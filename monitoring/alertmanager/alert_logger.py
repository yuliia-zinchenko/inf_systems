"""Webhook receiver for Alertmanager: writes every notification as one JSON log
line per alert to stdout, so notifications show up in Loki/Grafana
({service="alert-logger"}). Stands in for an email/Telegram/Slack receiver."""
import json
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        payload = json.loads(body or b"{}")
        for alert in payload.get("alerts", []):
            labels = alert.get("labels", {})
            annotations = alert.get("annotations", {})
            resolved = alert.get("status") == "resolved"
            print(json.dumps({
                "level": "info" if resolved else ("error" if labels.get("severity") == "critical" else "warn"),
                "time": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
                "service": "alert-logger",
                "msg": f"{'RESOLVED' if resolved else 'FIRING'}: {annotations.get('summary', labels.get('alertname'))}",
                "alertname": labels.get("alertname"),
                "severity": labels.get("severity"),
                "status": alert.get("status"),
                "description": annotations.get("description"),
                "startsAt": alert.get("startsAt"),
            }, ensure_ascii=False), flush=True)
        self.send_response(200)
        self.end_headers()

    def do_GET(self) -> None:  # healthcheck
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *_args) -> None:  # silence default access log
        pass


if __name__ == "__main__":
    print(json.dumps({"level": "info", "service": "alert-logger", "msg": "listening on :8080"}), flush=True)
    sys.stdout.reconfigure(encoding="utf-8")
    HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
