# TagShop Video — моніторинг роботи з БД

**TagShop Video** — робочий застосунок: відео з товарними тегами на таймкодах (Node.js API + PostgreSQL).
У межах лабораторної імплементовано генерацію даних, збір метрик, логів і трейсів, авторизацію,
обмін повідомленнями та запуск усього в Docker.

## Запуск

Docker Desktop: вільні порти `8080`, `4000`, `5433`.

```bash
docker compose up -d --build                     
docker compose run --rm loadgen python check.py   # автоматична перевірка всіх вимог
```

Очікуваний результат `check.py`: `Пройдено 25/25 перевірок`, з окремим рядком для кожної вимоги.
БД наповнюється автоматично, і через ~1 хв після старту на дашбордах уже є дані.

## Доступ

| Що | Адреса | Логін |
|---|---|---|
| Моніторинг (вхід) | http://localhost:8080 | `admin` / `admin12345` або `viewer` / `viewer12345` |
| Grafana | http://localhost:8080/grafana/ | будь-який із двох |
| Prometheus | http://localhost:8080/prometheus/ | тільки `admin` |
| RabbitMQ | http://localhost:8080/rabbitmq/ | тільки `admin`, далі логін брокера `tagshop` / `tagshop` |
| API застосунку | http://localhost:4000/api | — |

## Що реалізовано

| # | Вимога | Реалізація | Де в проєкті |
|---|---|---|---|
| 0 | СУБД у Docker | PostgreSQL 16 у контейнері; схема створюється міграціями під час старту API | `docker-compose.yml` → `postgres`, `app-api/migrations/` |
| 1 | Генерація та актуалізація даних (Python) | `seed.py` наповнює БД напряму через psycopg (користувачі, відео, товарні теги, ~37 тис. подій). `load.py` безперервно імітує глядачів і авторів через API (~5 дій/с): створення, редагування, видалення, перегляди, кліки | `loadgen/` |
| 2 | Збір даних — Prometheus | 8 джерел метрик: API (HTTP, час SQL-запитів, пул з'єднань), worker, PostgreSQL через `postgres_exporter`, RabbitMQ, auth-service, генератор | `monitoring/prometheus/prometheus.yml`, `app-api/src/application/metrics.ts` |
| 3 | Time Series Storage | Вбудована TSDB Prometheus на volume `prometheus_data`, зберігання 15 днів | `docker-compose.yml` → `prometheus` |
| 4 | Відображення — Grafana | 5 дашбордів у папці TagShop: **PostgreSQL** (з'єднання, TPS, cache hit, рядки й розмір таблиць, час SQL), API, RabbitMQ, бізнес-метрики, логи. Джерела даних і дашборди підключаються автоматично | `monitoring/grafana/` |
| 5 | Логи — Grafana Loki | Усі сервіси пишуть структуровані JSON-логи; Grafana Alloy збирає логи всіх контейнерів у Loki. Кожен рядок містить `trace_id` із посиланням на трейс | `monitoring/loki/`, `monitoring/alloy/`, `app-api/src/application/logger.ts` |
| 6 | Трейси — Grafana Tempo | OpenTelemetry в API, worker і auth-service; окремий спан на кожен SQL-запит. Один трейс проходить шлях API → RabbitMQ → worker → `INSERT` | `monitoring/tempo/`, `app-api/src/instrumentation.ts` |
| 7 | Авторизація (Python + SQLite) | Сервер авторизації на FastAPI, користувачі й ролі в SQLite. Ролі `admin` (усе) і `viewer` (лише Grafana); блокування після 5 невдалих спроб входу. nginx пропускає до моніторингу тільки з дійсною сесією | `auth-service/`, `gateway/nginx.conf` |
| 8 | Контейнеризація | 14 сервісів в одному `docker-compose.yml`; запуск однією командою без додаткових налаштувань | `docker-compose.yml`, `*/Dockerfile` |
| 9 | Обмін повідомленнями — RabbitMQ | API публікує події переглядів і листи в черги `analytics.events` та `email.send`, окремий `worker` обробляє їх і пише в БД. Невдалі повідомлення потрапляють у `*.dlq`; якщо брокер недоступний, API обробляє подію сам | `app-api/src/messaging/`, `app-api/src/worker.ts` |

## Архітектура

```
Дані:
  loadgen (Python) ──HTTP──► api (Node.js) ──SQL──► PostgreSQL
                                   │                    ▲
                                   └─► RabbitMQ ─► worker ──INSERT

Доступ до моніторингу:
  браузер ─► gateway (nginx :8080) ──перевірка сесії──► auth-service (Python + SQLite)
                   ├─► Grafana
                   ├─► Prometheus   (тільки admin)
                   └─► RabbitMQ UI  (тільки admin)

Спостережуваність:
  Prometheus + TSDB ◄── метрики: api, worker, postgres_exporter, RabbitMQ, auth-service, loadgen
  Tempo             ◄── трейси:  api, worker, auth-service
  Loki              ◄── логи всіх контейнерів (через Alloy)
  Grafana           ──► Prometheus, Loki, Tempo
```

## Порти

`ports: "ХОСТ:КОНТЕЙНЕР"` у `docker-compose.yml` відкриває порт контейнера на комп'ютері.
Назовні опубліковано лише чотири порти:

| Хост | → Контейнер | Призначення |
|---|---|---|
| `8080` | `gateway:80` | єдиний вхід у моніторинг (через авторизацію) |
| `4000` | `api:4000` | API застосунку |
| `5433` | `postgres:5432` | БД для інструментів на хості |
| `3000` | `web:3000` | фронтенд, лише з `--profile web` |

Решта портів внутрішні: `prometheus:9090`, `grafana:3000`, `rabbitmq:5672/15672`, `loki:3100`, `tempo:4318`,
`auth-service:8000` тощо. Вони перелічені в `expose:` і доступні тільки іншим контейнерам.
Тому обійти авторизацію не вийде: `curl localhost:9090` → connection refused.

## Структура

```
app-api/        API застосунку + worker (метрики, логи, трейси, RabbitMQ)
loadgen/        Python: seed.py, load.py, check.py
auth-service/   Python: сервер авторизації (FastAPI + SQLite)
gateway/        nginx: вхід у моніторинг
monitoring/     конфіги Prometheus, Grafana (дашборди), Loki, Tempo, Alloy, RabbitMQ
app-web/        фронтенд застосунку (для перевірки не потрібен)
```

## Необов'язково

- `.env` (з `.env.example`): власні паролі `admin` / `viewer` замість демо-паролів.
- `app-api/.env` (з `app-api/.env.example`): ключі S3-сховища для завантаження відео. Без них усе працює,
  лише `POST /api/uploads/*` повертає `503`.
- Фронтенд: `docker compose --profile web up -d --build` → http://localhost:3000.
