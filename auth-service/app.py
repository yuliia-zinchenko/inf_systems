"""Authorization server for the monitoring stack.

nginx asks GET /verify (auth_request) before proxying to Grafana, Prometheus
or the RabbitMQ UI. A valid session cookie (HS256 JWT) yields 200 plus
identity headers; otherwise 401 (nginx redirects to /auth/login) or 403 when
the route needs the admin role.

Users, roles and the login audit trail live in SQLite (see db.py, manage.py).
"""
import html
import logging
import os
import time
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, RedirectResponse, Response
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

import db
import telemetry

telemetry.setup()
log = logging.getLogger("auth")

COOKIE_NAME = "monitoring_session"
SESSION_TTL = timedelta(hours=int(os.environ.get("SESSION_TTL_HOURS", 8)))
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
LOCKOUT_ATTEMPTS = 5
LOCKOUT_WINDOW = timedelta(minutes=15)
# Grafana org role sent to Grafana's auth.proxy for each of our roles.
GRAFANA_ROLES = {"admin": "Admin", "viewer": "Viewer"}

LOGINS = Counter("auth_login_attempts_total", "Login attempts by outcome", ["result"])
VERIFIES = Counter("auth_verify_requests_total", "nginx auth_request checks by outcome", ["result"])
VERIFY_LATENCY = Histogram("auth_verify_duration_seconds", "Time to answer an auth_request check",
                           buckets=[0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1])
USERS = Gauge("auth_users", "Registered monitoring users", ["role"])


def bootstrap_users() -> None:
    """Creates the initial accounts from env on an empty database."""
    if db.list_users():
        return
    seeds = [
        (os.environ.get("ADMIN_USERNAME", "admin"), os.environ.get("ADMIN_PASSWORD"), "admin"),
        (os.environ.get("VIEWER_USERNAME", "viewer"), os.environ.get("VIEWER_PASSWORD"), "viewer"),
    ]
    for username, password, role in seeds:
        if password:
            db.create_user(username, password, role)
            log.info("Bootstrap user created", extra={"fields": {"username": username, "role": role}})
    if not db.list_users():
        log.warning("No users: set ADMIN_PASSWORD or run `python manage.py create-user`")


db.init()
bootstrap_users()
SECRET = db.get_or_create_secret()

app = FastAPI(title="TagShop monitoring auth", docs_url=None, redoc_url=None, openapi_url=None)
FastAPIInstrumentor.instrument_app(app, excluded_urls="healthz,metrics")


# ------------------------------------------------------------------ helpers
def client_ip(request: Request) -> str | None:
    return request.headers.get("x-real-ip") or (request.client.host if request.client else None)


def safe_next(target: str | None) -> str:
    """Only same-site relative paths, so the login form cannot be used as an open redirect."""
    if target and target.startswith("/") and not target.startswith("//"):
        return target
    return "/grafana/"


def issue_token(username: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": username, "role": role, "iat": now, "exp": now + SESSION_TTL}, SECRET, algorithm="HS256")


def read_session(request: Request) -> dict | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        claims = jwt.decode(token, SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    # Deleted users and changed roles take effect immediately, not at token expiry.
    user = db.get_user(claims.get("sub", ""))
    if not user:
        return None
    return {"username": user["username"], "role": user["role"]}


PAGE = """<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · TagShop Monitoring</title>
<style>
  :root {{ color-scheme: light dark; --bg:#f4f5f7; --card:#fff; --text:#1d2330; --muted:#677084; --accent:#5b5bd6; --err:#c2334d; --line:#d9dce3; }}
  @media (prefers-color-scheme: dark) {{ :root {{ --bg:#111318; --card:#1b1e26; --text:#e6e8ee; --muted:#9097a8; --accent:#8b8bf0; --err:#ff6b86; --line:#2c303b; }} }}
  * {{ box-sizing: border-box; }}
  body {{ margin:0; min-height:100vh; display:grid; place-items:center; padding:16px; background:var(--bg); color:var(--text);
         font:15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }}
  .card {{ width:100%; max-width:360px; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:28px; }}
  h1 {{ font-size:20px; margin:0 0 4px; }}
  p.sub {{ margin:0 0 20px; color:var(--muted); font-size:14px; }}
  label {{ display:block; font-size:13px; color:var(--muted); margin:14px 0 6px; }}
  input {{ width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:8px; background:transparent; color:inherit; font:inherit; }}
  input:focus {{ outline:2px solid var(--accent); outline-offset:1px; }}
  button, a.btn {{ display:block; width:100%; margin-top:20px; padding:10px; border:0; border-radius:8px; background:var(--accent);
                  color:#fff; font:inherit; font-weight:600; cursor:pointer; text-align:center; text-decoration:none; }}
  .err {{ margin:16px 0 0; padding:10px 12px; border-radius:8px; color:var(--err); border:1px solid currentColor; font-size:14px; }}
</style></head><body><main class="card">{body}</main></body></html>"""


def page(title: str, body: str, status: int = 200) -> HTMLResponse:
    return HTMLResponse(PAGE.format(title=html.escape(title), body=body), status_code=status)


def login_page(next_url: str, error: str | None = None, status: int = 200) -> HTMLResponse:
    err = f'<p class="err" role="alert">{html.escape(error)}</p>' if error else ""
    return page("Вхід", f"""
<h1>TagShop Monitoring</h1>
<p class="sub">Grafana, Prometheus і RabbitMQ доступні лише авторизованим користувачам.</p>
<form method="post" action="/auth/login">
  <input type="hidden" name="next" value="{html.escape(next_url)}">
  <label for="username">Логін</label>
  <input id="username" name="username" autocomplete="username" required autofocus>
  <label for="password">Пароль</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button type="submit">Увійти</button>
</form>{err}""", status)


# ------------------------------------------------------------------ routes
@app.get("/login", response_class=HTMLResponse)
def login_form(next: str | None = None):
    return login_page(safe_next(next))


@app.post("/login")
def login(request: Request, username: str = Form(...), password: str = Form(...), next: str = Form("/grafana/")):
    username = username.strip()
    target = safe_next(next)
    ip = client_ip(request)

    if db.recent_failures(username, LOCKOUT_WINDOW) >= LOCKOUT_ATTEMPTS:
        LOGINS.labels("locked").inc()
        log.warning("Login blocked: too many failures", extra={"fields": {"username": username, "ip": ip}})
        return login_page(target, "Забагато невдалих спроб. Спробуйте через 15 хвилин.", 429)

    user = db.check_credentials(username, password)
    db.record_login(username, user is not None, ip)
    if not user:
        LOGINS.labels("invalid").inc()
        log.warning("Login failed", extra={"fields": {"username": username, "ip": ip}})
        return login_page(target, "Невірний логін або пароль.", 401)

    LOGINS.labels("success").inc()
    log.info("Login succeeded", extra={"fields": {"username": username, "role": user["role"], "ip": ip}})
    response = RedirectResponse(target, status_code=303)
    response.set_cookie(COOKIE_NAME, issue_token(user["username"], user["role"]), max_age=int(SESSION_TTL.total_seconds()),
                        httponly=True, samesite="lax", secure=COOKIE_SECURE, path="/")
    return response


@app.get("/logout")
@app.post("/logout")
def logout(request: Request):
    session = read_session(request)
    if session:
        log.info("Logout", extra={"fields": {"username": session["username"]}})
    response = RedirectResponse("/auth/login", status_code=303)
    response.delete_cookie(COOKIE_NAME, path="/")
    return response


@app.get("/forbidden", response_class=HTMLResponse)
def forbidden():
    return page("Доступ заборонено", """
<h1>Доступ заборонено</h1>
<p class="sub">Цей розділ доступний лише ролі <b>admin</b>. Ваш обліковий запис має роль viewer.</p>
<a class="btn" href="/grafana/">До дашбордів</a>
<a class="btn" href="/auth/logout">Увійти іншим користувачем</a>""", 403)


@app.get("/verify")
def verify(request: Request, role: str | None = None):
    started = time.perf_counter()
    session = read_session(request)
    if not session:
        result, response = "unauthorized", Response(status_code=401)
    elif role == "admin" and session["role"] != "admin":
        result, response = "forbidden", Response(status_code=403)
    else:
        result = "ok"
        response = Response(status_code=200, headers={
            "X-Auth-User": session["username"],
            "X-Auth-Role": session["role"],
            "X-Grafana-Role": GRAFANA_ROLES[session["role"]],
        })
    VERIFIES.labels(result).inc()
    VERIFY_LATENCY.observe(time.perf_counter() - started)
    if result != "ok":
        log.debug("Verify rejected", extra={"fields": {"result": result, "uri": request.headers.get("x-original-uri")}})
    return response


@app.get("/metrics")
def metrics():
    for r, n in db.count_users_by_role().items():
        USERS.labels(r).set(n)
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/healthz", response_class=PlainTextResponse)
def healthz():
    return "ok"
