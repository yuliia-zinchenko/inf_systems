"""Generates the Grafana dashboards in monitoring/grafana/dashboards/.

Edit panels here, then run:
    python monitoring/grafana/gen_dashboards.py monitoring/grafana/dashboards
Grafana picks up the changed JSON files within ~10 s (file provisioning).
"""
import json
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
DS = {"type": "prometheus", "uid": "prometheus"}


class Board:
    def __init__(self, uid, title, tags):
        self.uid, self.title, self.tags = uid, title, tags
        self.panels, self.y, self.next_id = [], 0, 1

    def row(self, title):
        self.panels.append({"type": "row", "title": title, "id": self._id(), "collapsed": False,
                            "gridPos": {"x": 0, "y": self.y, "w": 24, "h": 1}, "panels": []})
        self.y += 1

    def line(self, specs, h):
        """specs: list of (width, panel_dict) laid out left to right."""
        x = 0
        for w, p in specs:
            p["id"] = self._id()
            p["gridPos"] = {"x": x, "y": self.y, "w": w, "h": h}
            p.setdefault("datasource", DS)
            self.panels.append(p)
            x += w
        self.y += h

    def _id(self):
        self.next_id += 1
        return self.next_id - 1

    def dump(self):
        board = {
            "uid": self.uid, "title": self.title, "tags": self.tags,
            "timezone": "browser", "schemaVersion": 39, "version": 1,
            "refresh": "10s", "time": {"from": "now-30m", "to": "now"},
            "editable": True, "graphTooltip": 1, "panels": self.panels,
            "templating": {"list": []}, "annotations": {"list": []},
        }
        (OUT / f"{self.uid}.json").write_text(json.dumps(board, indent=2, ensure_ascii=False) + "\n",
                                              encoding="utf-8")


def targets(*exprs):
    return [{"refId": chr(65 + i), "expr": e, "legendFormat": l, "datasource": DS}
            for i, (e, l) in enumerate(exprs)]


def stat(title, expr, unit="short", decimals=None, thresholds=None):
    steps = thresholds or [{"color": "green", "value": None}]
    defaults = {"unit": unit, "thresholds": {"mode": "absolute", "steps": steps}}
    if decimals is not None:
        defaults["decimals"] = decimals
    return {"type": "stat", "title": title, "targets": targets((expr, "")),
            "fieldConfig": {"defaults": defaults, "overrides": []},
            "options": {"reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False},
                        "colorMode": "value", "graphMode": "area", "textMode": "auto"}}


def ts(title, *exprs, unit="short", stack=False, desc=None):
    p = {"type": "timeseries", "title": title, "targets": targets(*exprs),
         "fieldConfig": {"defaults": {"unit": unit, "custom": {
             "lineWidth": 2, "fillOpacity": 15 if stack else 8, "showPoints": "never",
             "stacking": {"mode": "normal" if stack else "none", "group": "A"}}}, "overrides": []},
         "options": {"legend": {"displayMode": "table", "placement": "right", "calcs": ["lastNotNull", "max"]},
                     "tooltip": {"mode": "multi", "sort": "desc"}}}
    if desc:
        p["description"] = desc
    return p


def bars(title, expr, legend, unit="short"):
    return {"type": "bargauge", "title": title, "targets": targets((expr, legend)),
            "fieldConfig": {"defaults": {"unit": unit, "color": {"mode": "continuous-BlPu"}}, "overrides": []},
            "options": {"orientation": "horizontal", "displayMode": "gradient", "showUnfilled": True,
                        "reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False}}}


RED = [{"color": "green", "value": None}, {"color": "orange", "value": 1}, {"color": "red", "value": 5}]
LAT = [{"color": "green", "value": None}, {"color": "orange", "value": 0.3}, {"color": "red", "value": 1}]
H = "http_request_duration_seconds"
D = "db_query_duration_seconds"
PG = 'datname="tagshop"'

# ---------------------------------------------------------------- API
api = Board("tagshop-api", "TagShop · API", ["tagshop", "api"])
api.row("Огляд")
api.line([
    (6, stat("Запитів / с", f"sum(rate({H}_count[1m]))", "reqps", 2)),
    (6, stat("Помилки 5xx, %", f'100 * sum(rate({H}_count{{status_code=~"5.."}}[5m])) / clamp_min(sum(rate({H}_count[5m])), 1e-9)', "percent", 2, RED)),
    (6, stat("Помилки 4xx, %", f'100 * sum(rate({H}_count{{status_code=~"4.."}}[5m])) / clamp_min(sum(rate({H}_count[5m])), 1e-9)', "percent", 2, RED)),
    (6, stat("Затримка p95", f"histogram_quantile(0.95, sum by (le) (rate({H}_bucket[5m])))", "s", 3, LAT)),
], 4)
api.row("Трафік і затримка")
api.line([
    (12, ts("Запити за маршрутами", (f"sum by (method, route) (rate({H}_count[1m]))", "{{method}} {{route}}"), unit="reqps")),
    (12, ts("Відповіді за статусом", (f"sum by (status_code) (rate({H}_count[1m]))", "{{status_code}}"), unit="reqps", stack=True)),
], 9)
api.line([
    (12, ts("Затримка p50 / p95 / p99",
            (f"histogram_quantile(0.50, sum by (le) (rate({H}_bucket[1m])))", "p50"),
            (f"histogram_quantile(0.95, sum by (le) (rate({H}_bucket[1m])))", "p95"),
            (f"histogram_quantile(0.99, sum by (le) (rate({H}_bucket[1m])))", "p99"), unit="s")),
    (12, ts("p95 за маршрутами", (f"histogram_quantile(0.95, sum by (le, route) (rate({H}_bucket[5m])))", "{{route}}"), unit="s")),
], 9)
TEMPO = {"type": "tempo", "uid": "tempo"}
api.row("Трейси (Tempo)")
api.line([(24, {"type": "table", "title": "Повільні запити (> 100 мс) — клік по Trace ID відкриває трейс",
                "datasource": TEMPO,
                "targets": [{"refId": "A", "datasource": TEMPO, "queryType": "traceql", "limit": 20, "tableType": "traces",
                             "query": '{resource.service.name="tagshop-api" && kind=server && duration > 100ms}'}],
                "fieldConfig": {"defaults": {}, "overrides": []}, "options": {"showHeader": True}})], 9)
api.row("Процес Node.js")
api.line([
    (8, ts("Пам'ять", ("process_resident_memory_bytes", "RSS"), ("nodejs_heap_size_used_bytes", "heap used"),
           ("nodejs_heap_size_total_bytes", "heap total"), unit="bytes")),
    (8, ts("Event loop lag", ("nodejs_eventloop_lag_p50_seconds", "p50"), ("nodejs_eventloop_lag_p99_seconds", "p99"), unit="s")),
    (8, ts("CPU", ("rate(process_cpu_seconds_total[1m])", "cpu"), unit="percentunit")),
], 8)
api.dump()

# ---------------------------------------------------------------- PostgreSQL
pg = Board("tagshop-postgres", "TagShop · PostgreSQL", ["tagshop", "postgres"])
pg.row("Огляд")
pg.line([
    (5, stat("Активні з'єднання", f"sum(pg_stat_activity_count{{{PG}}})")),
    (5, stat("Розмір БД", f"pg_database_size_bytes{{{PG}}}", "bytes", 1)),
    (5, stat("Cache hit ratio", f"pg_stat_database_blks_hit{{{PG}}} / clamp_min(pg_stat_database_blks_hit{{{PG}}} + pg_stat_database_blks_read{{{PG}}}, 1)", "percentunit", 2,
             [{"color": "red", "value": None}, {"color": "orange", "value": 0.9}, {"color": "green", "value": 0.99}])),
    (4, stat("Транзакцій / с", f"rate(pg_stat_database_xact_commit{{{PG}}}[1m])", "short", 1)),
    (5, stat("Deadlocks", f"pg_stat_database_deadlocks{{{PG}}}", "short", 0, RED)),
], 4)
pg.row("Навантаження на сервер БД (postgres_exporter)")
pg.line([
    (12, ts("Транзакції", (f"rate(pg_stat_database_xact_commit{{{PG}}}[1m])", "commit"),
            (f"rate(pg_stat_database_xact_rollback{{{PG}}}[1m])", "rollback"), unit="ops")),
    (12, ts("Операції з рядками", (f"rate(pg_stat_database_tup_fetched{{{PG}}}[1m])", "fetched"),
            (f"rate(pg_stat_database_tup_inserted{{{PG}}}[1m])", "inserted"),
            (f"rate(pg_stat_database_tup_updated{{{PG}}}[1m])", "updated"),
            (f"rate(pg_stat_database_tup_deleted{{{PG}}}[1m])", "deleted"), unit="rowsps")),
], 8)
pg.line([
    (8, bars("Кількість рядків за таблицями", f"sum by (relname) (pg_stat_user_tables_n_live_tup{{{PG}}})", "{{relname}}")),
    (8, bars("Розмір таблиць", f"sum by (relname) (pg_stat_user_tables_size_bytes{{{PG}}})", "{{relname}}", "bytes")),
    (8, ts("Seq scan vs index scan", (f"sum(rate(pg_stat_user_tables_seq_scan{{{PG}}}[5m]))", "seq scan"),
           (f"sum(rate(pg_stat_user_tables_idx_scan{{{PG}}}[5m]))", "index scan"), unit="ops")),
], 9)
pg.line([
    (8, ts("З'єднання за станом", (f"sum by (state) (pg_stat_activity_count{{{PG}}})", "{{state}}"), stack=True)),
    (8, ts("Блокування", (f"sum by (mode) (pg_locks_count{{{PG}}})", "{{mode}}"), stack=True)),
    (8, ts("Вставки за таблицями", (f"sum by (relname) (rate(pg_stat_user_tables_n_tup_ins{{{PG}}}[1m]))", "{{relname}}"), unit="rowsps")),
], 8)
pg.row("Запити з боку застосунку (tagshop-api)")
pg.line([
    (8, ts("SQL-запитів / с за типом", (f"sum by (operation) (rate({D}_count[1m]))", "{{operation}}"), unit="ops", stack=True)),
    (8, ts("Затримка SQL p95 за типом", (f"histogram_quantile(0.95, sum by (le, operation) (rate({D}_bucket[5m])))", "{{operation}}"), unit="s")),
    (8, ts("Пул з'єднань", ("db_pool_connections", "{{state}}"),
           (f'sum(rate({D}_count{{status="error"}}[1m]))', "query errors/s"))),
], 8)
pg.dump()

# ---------------------------------------------------------------- Business
biz = Board("tagshop-business", "TagShop · Бізнес-метрики", ["tagshop", "business"])
biz.row("За вибраний період")
biz.line([
    (6, stat("Перегляди", 'sum(increase(tagshop_video_events_total{type="view"}[$__range]))', "short", 0)),
    (6, stat("Кліки по тегах", 'sum(increase(tagshop_video_events_total{type="tag_click"}[$__range]))', "short", 0)),
    (6, stat("CTR тегів", 'sum(increase(tagshop_video_events_total{type="tag_click"}[$__range])) / clamp_min(sum(increase(tagshop_video_events_total{type="view"}[$__range])), 1)', "percentunit", 1)),
    (6, stat("Реєстрації", 'sum(increase(tagshop_auth_attempts_total{action="signup",result="success"}[$__range]))', "short", 0)),
], 4)
biz.row("Динаміка")
biz.line([
    (12, ts("Події відео / хв", ("sum by (type) (increase(tagshop_video_events_total[1m]))", "{{type}}"), stack=True)),
    (12, ts("Спроби входу / хв", ("sum by (action, result) (increase(tagshop_auth_attempts_total[1m]))", "{{action}} · {{result}}"))),
], 9)
biz.line([
    (8, ts("Завантаження / хв", ("sum by (kind) (increase(tagshop_uploads_total[1m]))", "{{kind}}"), stack=True)),
    (8, ts("Обсяг завантажень", ("sum by (kind) (rate(tagshop_upload_bytes_total[5m]))", "{{kind}}"), unit="Bps")),
    (8, ts("Зростання даних у БД",
           ('sum by (relname) (pg_stat_user_tables_n_live_tup{datname="tagshop", relname=~"users|videos|product_tags|video_events"})', "{{relname}}"))),
], 8)
biz.row("Доступ до моніторингу (auth-service, Python + SQLite)")
biz.line([
    (4, stat("Адміністратори", 'auth_users{role="admin"}', "short", 0)),
    (4, stat("Viewers", 'auth_users{role="viewer"}', "short", 0)),
    (8, ts("Спроби входу", ("sum by (result) (increase(auth_login_attempts_total[5m]))", "{{result}}"), stack=True,
           desc="success / invalid / locked (5 невдалих спроб за 15 хв)")),
    (8, ts("Перевірки nginx auth_request", ("sum by (result) (rate(auth_verify_requests_total[1m]))", "{{result}}"), unit="reqps")),
], 8)
biz.dump()

# ---------------------------------------------------------------- RabbitMQ
Q = 'rabbitmq_detailed_queue_messages_ready'
mq = Board("tagshop-rabbitmq", "TagShop · RabbitMQ", ["tagshop", "rabbitmq"])
mq.row("Огляд")
mq.line([
    (6, stat("У чергах (ready)", f'sum({Q}{{queue!~".*dlq"}})', "short", 0,
             [{"color": "green", "value": None}, {"color": "orange", "value": 100}, {"color": "red", "value": 1000}])),
    (6, stat("У DLQ", f'sum({Q}{{queue=~".*dlq"}})', "short", 0, RED)),
    (6, stat("Consumers", 'sum(rabbitmq_detailed_queue_consumers{queue!~".*dlq"})', "short", 0)),
    (6, stat("Оброблено / с", "sum(rate(tagshop_worker_messages_total[1m]))", "ops", 1)),
], 4)
mq.row("Брокер")
mq.line([
    (12, ts("Глибина черг", (f"sum by (queue) ({Q})", "{{queue}} ready"),
            ("sum by (queue) (rabbitmq_detailed_queue_messages_unacked)", "{{queue}} unacked"))),
    (12, ts("Потік повідомлень", ("sum(rate(rabbitmq_global_messages_received_total[1m]))", "published"),
            ("sum(rate(rabbitmq_global_messages_delivered_total[1m]))", "delivered"),
            ("sum(rate(rabbitmq_global_messages_acknowledged_total[1m]))", "acked"),
            ("sum(rate(rabbitmq_global_messages_dead_lettered_rejected_total[1m]))", "dead-lettered"), unit="ops")),
], 8)
mq.row("Застосунок")
mq.line([
    (8, ts("API → брокер", ("sum by (queue, result) (rate(tagshop_messages_published_total[1m]))", "{{queue}} · {{result}}"), unit="ops",
           desc="fallback — брокер недоступний, повідомлення оброблено в самому API")),
    (8, ts("Worker: оброблено", ("sum by (queue, result) (rate(tagshop_worker_messages_total[1m]))", "{{queue}} · {{result}}"), unit="ops")),
    (8, ts("Worker: час обробки p95", ("histogram_quantile(0.95, sum by (le, queue) (rate(tagshop_worker_processing_seconds_bucket[5m])))", "{{queue}}"), unit="s")),
], 8)
mq.line([
    (12, ts("З'єднання та канали", ("rabbitmq_connections", "connections"), ("rabbitmq_channels", "channels"))),
    (12, ts("Пам'ять брокера", ("rabbitmq_process_resident_memory_bytes", "RSS"), unit="bytes")),
], 7)
mq.dump()

LOKI = {"type": "loki", "uid": "loki"}


def on_loki(panel):
    panel["datasource"] = LOKI
    for t in panel["targets"]:
        t["datasource"] = LOKI
    return panel


def logs(title, expr):
    return {"type": "logs", "title": title, "datasource": LOKI,
            "targets": [{"refId": "A", "expr": expr, "datasource": LOKI}],
            "options": {"showTime": True, "wrapLogMessage": True, "enableLogDetails": True,
                        "sortOrder": "Descending", "dedupStrategy": "none", "prettifyLogMessage": False}}


lg = Board("tagshop-logs", "TagShop · Логи", ["tagshop", "logs", "loki"])
lg.row("Обсяг логів")
lg.line([
    (6, on_loki(stat("Помилки API", 'sum(count_over_time({service="api", level="error"}[$__range])) or vector(0)', "short", 0, RED))),
    (6, on_loki(stat("Попередження API", 'sum(count_over_time({service="api", level="warn"}[$__range])) or vector(0)', "short", 0))),
    (12, on_loki(ts("Логи API за рівнем", ('sum by (level) (count_over_time({service="api"}[1m]))', "{{level}}"), stack=True))),
], 6)
lg.line([
    (24, on_loki(ts("Рядків логів за сервісом", ('sum by (service) (count_over_time({service=~".+"}[1m]))', "{{service}}"), stack=True))),
], 7)
lg.row("Записи")
lg.line([(24, logs("API: попередження та помилки", '{service="api", level=~"warn|error|fatal"} | json'))], 10)
lg.line([(24, logs("API: усі запити", '{service="api"} | json'))], 12)
lg.line([
    (12, logs("Листи (dev-режим, не надіслані)", '{service="api"} |= "Email (dev" | json')),
    (12, logs("Генератор навантаження", '{service="loadgen"}')),
], 10)
lg.dump()

print("ok:", [p.name for p in OUT.glob("*.json")])
