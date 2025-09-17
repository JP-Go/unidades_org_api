import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const OTLP_PROTO_TRACE_EXPORTER_ENDPOINT =
  process.env.OTLP_PROTO_TRACE_EXPORTER_ENDPOINT;
const OTLP_PROTO_METRICS_EXPORTER_ENDPOINT =
  process.env.OTLP_PROTO_METRICS_EXPORTER_ENDPOINT;

const exporter = new OTLPTraceExporter({
  url: OTLP_PROTO_TRACE_EXPORTER_ENDPOINT,
});

const metricReaderExporter = new OTLPMetricExporter({
  url: OTLP_PROTO_METRICS_EXPORTER_ENDPOINT,
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'org-api',
  }),
  traceExporter: exporter,
  spanProcessors: [new BatchSpanProcessor(exporter)],
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricReaderExporter,
    exportIntervalMillis: 5000,
  }),
  instrumentations: [getNodeAutoInstrumentations(), new NestInstrumentation()],
});

sdk.start();
process.on('beforeExit', () => {
  void sdk.shutdown();
});
