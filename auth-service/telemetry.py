"""JSON logging (for Loki) and OpenTelemetry tracing (to Tempo)."""
import json
import logging
import os
from datetime import datetime, timezone

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

SERVICE = os.environ.get("OTEL_SERVICE_NAME", "auth-service")
# Level names as pino writes them, so one Loki filter (level="warn") covers every service.
LEVELS = {"warning": "warn", "critical": "fatal"}


class JsonFormatter(logging.Formatter):
    """One JSON object per line, same shape as the Node services (level, time, service, msg, trace_id)."""

    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "level": LEVELS.get(record.levelname.lower(), record.levelname.lower()),
            "time": datetime.fromtimestamp(record.created, timezone.utc).isoformat(timespec="milliseconds"),
            "service": SERVICE,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        ctx = trace.get_current_span().get_span_context()
        if ctx.is_valid:
            entry["trace_id"] = format(ctx.trace_id, "032x")
            entry["span_id"] = format(ctx.span_id, "016x")
        entry.update(getattr(record, "fields", {}))
        if record.exc_info:
            entry["err"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False)


def setup() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO").upper(), handlers=[handler], force=True)

    if os.environ.get("OTEL_SDK_DISABLED", "").lower() == "true":
        return
    provider = TracerProvider(resource=Resource.create({"service.name": SERVICE}))
    # Endpoint comes from OTEL_EXPORTER_OTLP_ENDPOINT (…/v1/traces is appended).
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(provider)
    SQLite3Instrumentor().instrument()
