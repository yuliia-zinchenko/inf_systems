"""Continuous load against the TagShop API.

Each worker thread plays two roles:
  * anonymous viewers — open a video, load its product tags, send `view` and
    sometimes `tag_click` analytics events;
  * a signed-in creator — lists, creates, edits and deletes videos and tags,
    reads analytics.
A small share of requests is intentionally invalid (wrong password, unknown or
malformed ids) so error panels in Grafana have something to show.

Viewers come from random client IPs via X-Forwarded-For (the API trusts one
proxy hop), which spreads analytics ip_hash values and per-IP rate limits the
way real traffic would.

Own metrics are exposed for Prometheus on :LOADGEN_METRICS_PORT.
"""
import os
import random
import threading
import time
import uuid

import httpx
import psycopg
from prometheus_client import Counter, Histogram, start_http_server

import catalog

API_URL = os.environ.get("API_URL", "http://localhost:4000/api")
DSN = os.environ.get("DATABASE_URL", "postgresql://tagshop:tagshop@localhost:5433/tagshop")
RPS = float(os.environ.get("LOAD_RPS", 5))
WORKERS = int(os.environ.get("LOAD_WORKERS", 4))
SEED_USERS = int(os.environ.get("SEED_USERS", 25))
PASSWORD = os.environ.get("SEED_PASSWORD", "Password123!")
METRICS_PORT = int(os.environ.get("LOADGEN_METRICS_PORT", 8000))

REQUESTS = Counter("loadgen_requests_total", "Requests sent to the API", ["action", "status"])
LATENCY = Histogram("loadgen_request_duration_seconds", "API latency seen by the generator", ["action"])


class Catalog:
    """Video/tag ids known to exist, refreshed from the DB every 30 s."""

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.videos: dict[str, list[str]] = {}
        self.refreshed = 0.0

    def refresh(self) -> None:
        if time.monotonic() - self.refreshed < 30:
            return
        try:
            with psycopg.connect(DSN) as conn:
                rows = conn.execute(
                    """SELECT v.id::text, coalesce(array_agg(t.id::text) FILTER (WHERE t.id IS NOT NULL), '{}')
                       FROM videos v LEFT JOIN product_tags t ON t.video_id = v.id GROUP BY v.id"""
                ).fetchall()
            with self.lock:
                self.videos = {vid: tags for vid, tags in rows}
                self.refreshed = time.monotonic()
        except psycopg.Error as err:
            print(f"[catalog] refresh failed: {err}", flush=True)

    def pick(self) -> tuple[str, list[str]] | None:
        with self.lock:
            if not self.videos:
                return None
            vid = random.choice(list(self.videos))
            return vid, self.videos[vid]


catalog_state = Catalog()


class Worker(threading.Thread):
    def __init__(self, n: int) -> None:
        super().__init__(daemon=True, name=f"worker-{n}")
        self.n = n
        self.viewer = httpx.Client(base_url=API_URL, timeout=15)
        self.creator = httpx.Client(base_url=API_URL, timeout=15)
        self.creator_ip = catalog.random_ip()
        self.signed_in = False
        self.own_videos: list[str] = []
        # Videos this worker created; only these are ever deleted, so seeded data keeps growing.
        self.created_videos: list[str] = []

    # ------------------------------------------------------------ helpers
    def call(self, client: httpx.Client, action: str, method: str, path: str,
             ip: str | None = None, **kw) -> httpx.Response | None:
        headers = {"User-Agent": random.choice(catalog.USER_AGENTS),
                   "X-Forwarded-For": ip or catalog.random_ip()}
        started = time.perf_counter()
        try:
            res = client.request(method, path, headers=headers, **kw)
        except httpx.HTTPError as err:
            REQUESTS.labels(action, "error").inc()
            print(f"[{self.name}] {action}: {err!r}", flush=True)
            time.sleep(2)
            return None
        LATENCY.labels(action).observe(time.perf_counter() - started)
        REQUESTS.labels(action, str(res.status_code)).inc()
        return res

    def creator_call(self, action: str, method: str, path: str, **kw) -> httpx.Response | None:
        if not self.signed_in and not self.sign_in():
            return None
        res = self.call(self.creator, action, method, path, ip=self.creator_ip, **kw)
        if res is not None and res.status_code == 401:
            self.signed_in = False
        return res

    def sign_in(self) -> bool:
        email = f"user{random.randint(1, SEED_USERS)}@{catalog.SEED_EMAIL_DOMAIN}"
        res = self.call(self.creator, "signin", "POST", "/auth/signin", ip=self.creator_ip,
                        json={"email": email, "password": PASSWORD})
        if res is not None and res.status_code == 200:
            self.signed_in = True
            self.own_videos = []
            self.created_videos = []
            return True
        # No seeded users yet — register a fresh account instead.
        res = self.call(self.creator, "signup", "POST", "/auth/signup", ip=self.creator_ip,
                        json={"email": f"load-{uuid.uuid4().hex[:10]}@{catalog.SEED_EMAIL_DOMAIN}",
                              "password": PASSWORD, "name": f"Load worker {self.n}"})
        self.signed_in = res is not None and res.status_code == 201
        return self.signed_in

    # ------------------------------------------------------------ viewer actions
    def watch(self) -> None:
        picked = catalog_state.pick()
        if not picked:
            return
        vid, tags = picked
        ip = catalog.random_ip()
        self.call(self.viewer, "get_video", "GET", f"/videos/{vid}", ip=ip)
        self.call(self.viewer, "list_tags", "GET", f"/videos/{vid}/product-tags", ip=ip)
        self.call(self.viewer, "event_view", "POST", f"/videos/{vid}/events", ip=ip, json={"type": "view"})
        if tags and random.random() < 0.3:
            self.call(self.viewer, "event_tag_click", "POST", f"/videos/{vid}/events", ip=ip,
                      json={"type": "tag_click", "tagId": random.choice(tags)})

    def bad_requests(self) -> None:
        kind = random.random()
        if kind < 0.4:
            self.call(self.viewer, "get_video_missing", "GET", f"/videos/{uuid.uuid4()}")
        elif kind < 0.7:
            self.call(self.viewer, "get_video_invalid", "GET", "/videos/not-a-uuid")
        else:
            self.call(self.viewer, "signin_wrong_password", "POST", "/auth/signin",
                      json={"email": f"user1@{catalog.SEED_EMAIL_DOMAIN}", "password": "wrong-password"})

    def sign_up(self) -> None:
        with httpx.Client(base_url=API_URL, timeout=15) as fresh:
            self.call(fresh, "signup", "POST", "/auth/signup",
                      json={"email": f"new-{uuid.uuid4().hex[:10]}@{catalog.SEED_EMAIL_DOMAIN}",
                            "password": PASSWORD, "name": f"Новий користувач {random.randint(1, 9999)}"})

    # ------------------------------------------------------------ creator actions
    def list_videos(self) -> None:
        res = self.creator_call("list_videos", "GET", "/videos")
        if res is not None and res.status_code == 200:
            self.own_videos = [v["id"] for v in res.json()]

    def create_video(self) -> None:
        res = self.creator_call("create_video", "POST", "/videos",
                                json={"title": catalog.video_title(),
                                      "videoUrl": random.choice(catalog.VIDEO_URLS), "sourceType": "url"})
        if res is None or res.status_code != 201:
            return
        vid = res.json()["id"]
        self.own_videos.append(vid)
        self.created_videos.append(vid)
        for _ in range(random.randint(1, 3)):
            self.creator_call("create_tag", "POST", f"/videos/{vid}/product-tags", json=catalog.product_tag())

    def edit_video(self) -> None:
        if self.own_videos:
            vid = random.choice(self.own_videos)
            self.creator_call("update_video", "PATCH", f"/videos/{vid}", json={"title": catalog.video_title()})

    def edit_tag(self) -> None:
        if not self.own_videos:
            return
        vid = random.choice(self.own_videos)
        res = self.creator_call("list_own_tags", "GET", f"/videos/{vid}/product-tags")
        if res is not None and res.status_code == 200 and res.json():
            tag = random.choice(res.json())
            patch = {k: v for k, v in catalog.product_tag().items() if k in ("time", "variant", "accentColor")}
            self.creator_call("update_tag", "PATCH", f"/videos/{vid}/product-tags/{tag['id']}", json=patch)

    def delete_video(self) -> None:
        # Only videos created by this session: deleting a seeded video would cascade
        # away its whole analytics history.
        candidates = [v for v in self.created_videos if v in self.own_videos]
        if len(candidates) > 1:
            vid = candidates[random.randrange(len(candidates))]
            self.created_videos.remove(vid)
            self.own_videos.remove(vid)
            self.creator_call("delete_video", "DELETE", f"/videos/{vid}")

    def read_analytics(self) -> None:
        if self.own_videos:
            self.creator_call("get_analytics", "GET", f"/videos/{random.choice(self.own_videos)}/analytics")

    def resign_in(self) -> None:
        self.creator_call("signout", "POST", "/auth/signout")
        self.signed_in = False
        # Switch to another creator right away so own_videos never outlives its session.
        self.sign_in()

    # ------------------------------------------------------------ loop
    def run(self) -> None:
        actions = [
            (self.watch, 60),
            (self.list_videos, 8),
            (self.read_analytics, 6),
            (self.edit_video, 4),
            (self.edit_tag, 4),
            (self.create_video, 3),
            (self.delete_video, 1.5),
            (self.bad_requests, 4),
            (self.sign_up, 0.7),
            (self.resign_in, 0.5),
        ]
        funcs, weights = zip(*actions)
        per_worker_rps = RPS / WORKERS
        while True:
            catalog_state.refresh()
            random.choices(funcs, weights=weights)[0]()
            time.sleep(random.expovariate(per_worker_rps))


def main() -> None:
    start_http_server(METRICS_PORT)
    print(f"loadgen → {API_URL}, {RPS} actions/s across {WORKERS} workers, metrics on :{METRICS_PORT}", flush=True)
    for n in range(WORKERS):
        Worker(n).start()
    while True:
        time.sleep(3600)


if __name__ == "__main__":
    main()
