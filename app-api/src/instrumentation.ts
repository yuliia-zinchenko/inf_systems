/**
 * OpenTelemetry bootstrap. Loaded before the app with
 *   node --import ./src/instrumentation.ts src/index.ts
 *
 * The app is ESM, so module patching needs the import-in-the-middle loader
 * hook registered before express/pg are imported. Auto-instrumentation then
 * creates spans for incoming HTTP, Express middleware/routes, every pg query,
 * outgoing HTTP (S3) and injects trace_id/span_id into pino log lines.
 *
 * Configured through standard env vars: OTEL_SERVICE_NAME,
 * OTEL_EXPORTER_OTLP_ENDPOINT (e.g. http://tempo:4318), OTEL_SDK_DISABLED.
 */
import { register } from 'node:module';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

const IGNORED_PATHS = new Set(['/healthz', '/metrics']);

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Low-value, high-volume spans.
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
      // Express 5 runs on the `router` package; the express instrumentation already
      // covers it, so this one would only duplicate every middleware span.
      '@opentelemetry/instrumentation-router': { enabled: false },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req) => IGNORED_PATHS.has((req.url ?? '').split('?')[0] ?? ''),
      },
      '@opentelemetry/instrumentation-pg': { enhancedDatabaseReporting: false },
    }),
  ],
});

sdk.start();

const shutdown = (): void => {
  sdk.shutdown().finally(() => process.exit(0));
};
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
