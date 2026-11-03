"""Console self-check of the lab requirements (0–9).

Runs inside the Docker network, so it reaches services by name:

    docker compose run --rm loadgen python check.py

Prints one line per check (✓ / ✗) and a summary; exit code 1 if anything failed.
Read-only apart from one failed-login attempt for a random, non-existent user.
"""
import os
import socket
import sys
import time
import uuid

import httpx
import psycopg

DSN = os.environ.get("DATABASE_URL", "postgresql://tagshop:tagshop@postgres:5432/tagshop")
GATEWAY = os.environ.get("GATEWAY_URL", "http://gateway")
ADMIN_PASSWORD = os.environ.get("MONITORING_ADMIN_PASSWORD", "admin12345")
VIEWER_PASSWORD = os.environ.get("MONITORING_VIEWER_PASSWORD", "viewer12345")
RABBIT_AUTH = ("tagshop", "tagshop")

results: list[bool] = []


def check(title: str, ok: bool, detail: str = "") -> bool:
    results.append(ok)
    print(f"  {'✓' if ok else '✗'} {title}" + (f" — {detail}" if detail else ""), flush=True)
    return ok


def section(title: str) -> None:
    print(f"\n{title}", flush=True)


def login(username: str, password: str) -> httpx.Client:
    client = httpx.Client(base_url=GATEWAY, timeout=15, follow_redirects=False)
    client.post("/auth/login", data={"username": username, "password": password})
    return client


def safe(fn):
    """Runs one requirement block; an exception counts as a failed check instead of aborting."""
    try:
        fn()
    except Exception as err:  # noqa: BLE001 — report and continue with the next block
        check("перевірка виконалась без помилок", False, f"{type(err).__name__}: {err}")


def req0() -> None:
    section("0. СУБД у Docker-контейнері (PostgreSQL)")
    with psycopg.connect(DSN) as conn:
        version = conn.execute("SHOW server_version").fetchone()[0]
        tables = [r[0] for r in conn.execute(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1").fetchall()]
    check("PostgreSQL відповідає", True, f"версія {version}, хост postgres")
    check("схема створена міграціями", len(tables) >= 8, ", ".join(tables))


def req1() -> None:
    section("1. Генерація та актуалізація даних (Python)")
    with psycopg.connect(DSN) as conn:
        q = "SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM videos), " \
            "(SELECT count(*) FROM product_tags), (SELECT count(*) FROM video_events)"
        users, videos, tags, before = conn.execute(q).fetchone()
        check("seed.py наповнив БД", users >= 25 and videos > 0 and tags > 0,
              f"users={users} videos={videos} product_tags={tags} video_events={before}")
        time.sleep(10)
        after = conn.execute("SELECT count(*) FROM video_events").fetchone()[0]
    check("load.py постійно актуалізує дані", after > before, f"+{after - before} подій за 10 с")


def req2_3(admin: httpx.Client) -> None:
    section("2. Збір даних — Prometheus")
    targets = admin.get("/prometheus/api/v1/targets").json()["data"]["activeTargets"]
    up = [t["labels"]["job"] for t in targets if t["health"] == "up"]
    down = [t["labels"]["job"] for t in targets if t["health"] != "up"]
    check("усі цілі scrape у стані UP", not down and len(up) >= 8,
          f"{len(up)}/{len(targets)} up" + (f", down: {down}" if down else ""))
    r = admin.get("/prometheus/api/v1/query",
                  params={"query": "sum(rate(db_query_duration_seconds_count[1m]))"}).json()["data"]["result"]
    qps = float(r[0]["value"][1]) if r else 0
    check("метрики роботи з БД збираються", qps > 0, f"{qps:.1f} SQL-запитів/с з API")

    section("3. Збереження — TSDB Prometheus")
    tsdb = admin.get("/prometheus/api/v1/status/tsdb").json()["data"]["headStats"]
    flags = admin.get("/prometheus/api/v1/status/flags").json()["data"]
    check("TSDB зберігає часові ряди", tsdb["numSeries"] > 0,
          f"{tsdb['numSeries']} рядів, {tsdb['chunkCount']} chunks")
    check("налаштовано зберігання на диску", bool(flags.get("storage.tsdb.path")),
          f"path={flags.get('storage.tsdb.path')}, retention={flags.get('storage.tsdb.retention.time')}")


def req4_5_6(admin: httpx.Client) -> None:
    section("4. Відображення — Grafana")
    dashboards = admin.get("/grafana/api/search", params={"type": "dash-db"}).json()
    check("дашборди завантажені", len(dashboards) >= 5, ", ".join(d["title"] for d in dashboards))
    prom = admin.get("/grafana/api/datasources/uid/prometheus/health").json()
    check("Grafana бачить Prometheus", prom.get("status") == "OK", prom.get("message", ""))

    section("5. Логи — Grafana Loki")
    loki = "/grafana/api/datasources/proxy/uid/loki/loki/api/v1"
    services = admin.get(f"{loki}/label/service/values").json().get("data") or []
    check("логи контейнерів надходять у Loki",
          {"api", "worker", "auth-service"} <= set(services), f"{len(services)} сервісів: {', '.join(services)}")
    r = admin.get(f"{loki}/query", params={
        "query": 'sum(count_over_time({service="api"} |= "trace_id" [5m]))'}).json()["data"]["result"]
    n = int(float(r[0]["value"][1])) if r else 0
    check("логи API містять trace_id (зв'язок з Tempo)", n > 0, f"{n} рядків за 5 хв")

    section("6. Трейси — Grafana Tempo")
    end = int(time.time())
    tempo = "/grafana/api/datasources/proxy/uid/tempo/api"
    found = admin.get(f"{tempo}/search", params={
        "q": '{resource.service.name="tagshop-worker"}', "limit": 5, "start": end - 900, "end": end}).json()
    traces = found.get("traces", [])
    check("трейси надходять у Tempo", bool(traces), f"{len(traces)} трейсів worker за 15 хв")
    if traces:
        trace = admin.get(f"{tempo}/v2/traces/{traces[0]['traceID']}").json()["trace"]
        services = set()
        span_names = set()
        for rs in trace["resourceSpans"]:
            services |= {a["value"]["stringValue"] for a in rs["resource"]["attributes"] if a["key"] == "service.name"}
            span_names |= {s["name"] for ss in rs["scopeSpans"] for s in ss["spans"]}
        check("один трейс проходить API → RabbitMQ → worker → PostgreSQL",
              {"tagshop-api", "tagshop-worker"} <= services and any(n.startswith("pg.query:INSERT") for n in span_names),
              f"сервіси: {', '.join(sorted(services))}")


def req7() -> None:
    section("7. Авторизація (Python + SQLite, nginx auth_request)")
    anon = httpx.Client(base_url=GATEWAY, timeout=15, follow_redirects=False)
    r = anon.get("/grafana/")
    check("анонім перенаправляється на вхід", r.status_code == 302 and "/auth/login" in r.headers.get("location", ""),
          f"{r.status_code} → {r.headers.get('location')}")
    r = anon.post("/auth/login", data={"username": f"check-{uuid.uuid4().hex[:8]}", "password": "wrong"})
    check("неправильний пароль відхиляється", r.status_code == 401, f"HTTP {r.status_code}")
    r = anon.get("/auth/verify")
    check("внутрішній /verify недоступний ззовні", r.status_code == 404, f"HTTP {r.status_code}")

    viewer = login("viewer", VIEWER_PASSWORD)
    orgs = viewer.get("/grafana/api/user/orgs")
    role = orgs.json()[0]["role"] if orgs.status_code == 200 else f"HTTP {orgs.status_code}"
    check("viewer входить у Grafana з роллю Viewer", role == "Viewer", f"роль: {role}")
    r = viewer.get("/prometheus/")
    check("viewer не має доступу до Prometheus", r.status_code == 302 and "forbidden" in r.headers.get("location", ""),
          f"{r.status_code} → {r.headers.get('location')}")

    admin = login("admin", ADMIN_PASSWORD)
    orgs = admin.get("/grafana/api/user/orgs")
    role = orgs.json()[0]["role"] if orgs.status_code == 200 else f"HTTP {orgs.status_code}"
    check("admin входить у Grafana з роллю Admin", role == "Admin", f"роль: {role}")
    r = admin.get("/prometheus/-/ready")
    check("admin має доступ до Prometheus", r.status_code == 200, f"HTTP {r.status_code}")


def req8() -> None:
    section("8. Контейнеризація (Docker)")
    names = ["postgres", "api", "worker", "rabbitmq", "loadgen", "postgres-exporter", "prometheus",
             "loki", "tempo", "alloy", "grafana", "auth-service", "gateway"]
    missing = []
    for name in names:
        try:
            socket.gethostbyname(name)
        except OSError:
            missing.append(name)
    check("сервіси працюють у спільній Docker-мережі", not missing,
          f"{len(names) - len(missing)}/{len(names)}" + (f", немає: {missing}" if missing else ""))


def req9(admin: httpx.Client) -> None:
    section("9. Обмін повідомленнями — RabbitMQ")
    queues = admin.get("/rabbitmq/api/queues", auth=RABBIT_AUTH).json()
    by_name = {q["name"]: q for q in queues}
    expected = ["analytics.events", "email.send", "analytics.events.dlq", "email.send.dlq"]
    check("черги та DLQ створені", all(n in by_name for n in expected), ", ".join(sorted(by_name)))
    consumers = {n: by_name.get(n, {}).get("consumers", 0) for n in expected[:2]}
    check("worker підписаний на черги", all(c >= 1 for c in consumers.values()), str(consumers))
    r = admin.get("/prometheus/api/v1/query", params={
        "query": 'sum(rate(tagshop_worker_messages_total{result="ok"}[1m]))'}).json()["data"]["result"]
    rate = float(r[0]["value"][1]) if r else 0
    check("повідомлення обробляються", rate > 0, f"{rate:.1f} повідомлень/с")


def main() -> None:
    print("TagShop · перевірка вимог лабораторної роботи")
    safe(req0)
    safe(req1)
    admin = login("admin", ADMIN_PASSWORD)
    safe(lambda: req2_3(admin))
    safe(lambda: req4_5_6(admin))
    safe(req7)
    safe(req8)
    safe(lambda: req9(admin))

    passed = sum(results)
    print(f"\nПройдено {passed}/{len(results)} перевірок")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
