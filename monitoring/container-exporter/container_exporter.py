"""Per-container resource metrics for Prometheus, read from the Docker Engine API.

Replaces cAdvisor, which cannot map containers to names under Docker Desktop's
containerd image store. Only containers of this compose project are reported,
labelled by their compose service name:

    container_cpu_usage_seconds_total{service="api"}        counter
    container_memory_usage_bytes{service="api"}             gauge (without page cache)
    container_memory_limit_bytes{service="api"}             gauge
    container_network_receive_bytes_total{service="api"}    counter
    container_network_transmit_bytes_total{service="api"}   counter
    container_up{service="api"}                             1 if running

Stats are fetched on each scrape (Docker API `one-shot`), no extra dependencies.
"""
import http.client
import json
import os
import socket
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import quote

SOCKET = "/var/run/docker.sock"
PROJECT = os.environ.get("COMPOSE_PROJECT", "tagshop")
PORT = int(os.environ.get("PORT", 9200))


class UnixHTTPConnection(http.client.HTTPConnection):
    def __init__(self) -> None:
        super().__init__("localhost", timeout=10)

    def connect(self) -> None:
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(10)
        self.sock.connect(SOCKET)


def docker_get(path: str):
    conn = UnixHTTPConnection()
    try:
        conn.request("GET", path)
        res = conn.getresponse()
        return json.loads(res.read())
    finally:
        conn.close()


def container_stats(container: dict) -> tuple[str, dict, bool]:
    service = container["Labels"].get("com.docker.compose.service", container["Names"][0].lstrip("/"))
    running = container["State"] == "running"
    stats = docker_get(f"/containers/{container['Id']}/stats?stream=false&one-shot=true") if running else {}
    return service, stats, running


def collect() -> str:
    filters = quote(json.dumps({"label": [f"com.docker.compose.project={PROJECT}"]}))
    containers = docker_get(f"/containers/json?all=true&filters={filters}")
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(container_stats, containers))

    series: dict[str, list[str]] = {
        "container_up": [], "container_cpu_usage_seconds_total": [],
        "container_memory_usage_bytes": [], "container_memory_limit_bytes": [],
        "container_network_receive_bytes_total": [], "container_network_transmit_bytes_total": [],
    }
    for service, stats, running in sorted(results, key=lambda r: r[0]):
        label = f'{{service="{service}"}}'
        series["container_up"].append(f"container_up{label} {1 if running else 0}")
        if not running or not stats:
            continue
        cpu_ns = stats.get("cpu_stats", {}).get("cpu_usage", {}).get("total_usage", 0)
        mem = stats.get("memory_stats", {})
        cache = mem.get("stats", {}).get("inactive_file", 0)
        nets = stats.get("networks", {}) or {}
        series["container_cpu_usage_seconds_total"].append(f"container_cpu_usage_seconds_total{label} {cpu_ns / 1e9}")
        series["container_memory_usage_bytes"].append(f"container_memory_usage_bytes{label} {max(mem.get('usage', 0) - cache, 0)}")
        series["container_memory_limit_bytes"].append(f"container_memory_limit_bytes{label} {mem.get('limit', 0)}")
        series["container_network_receive_bytes_total"].append(
            f"container_network_receive_bytes_total{label} {sum(n.get('rx_bytes', 0) for n in nets.values())}")
        series["container_network_transmit_bytes_total"].append(
            f"container_network_transmit_bytes_total{label} {sum(n.get('tx_bytes', 0) for n in nets.values())}")

    types = {"container_up": "gauge", "container_memory_usage_bytes": "gauge", "container_memory_limit_bytes": "gauge"}
    out = []
    for name, lines in series.items():
        out.append(f"# TYPE {name} {types.get(name, 'counter')}")
        out.extend(lines)
    return "\n".join(out) + "\n"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path != "/metrics":
            self.send_response(200 if self.path == "/healthz" else 404)
            self.end_headers()
            return
        try:
            body, status = collect().encode(), 200
        except Exception as err:  # noqa: BLE001 — report scrape failure to Prometheus
            body, status = f"# error: {err}\n".encode(), 500
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; version=0.0.4")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args) -> None:
        pass


if __name__ == "__main__":
    print(json.dumps({"level": "info", "service": "container-exporter", "msg": f"listening on :{PORT}, project={PROJECT}"}), flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
