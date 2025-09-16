FROM oven/bun:alpine AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production

ENV DATABASE_URL=${DATABASE_URL:-postgres://org_api_user:org_api_password@org_db:5432/org_db}
ENV OTLP_PROTO_TRACE_EXPORTER_ENDPOINT={OTLP_PROTO_TRACE_EXPORTER_ENDPOINT:-http://org_jaeger:4318/v1/traces}
ENV OTLP_PROTO_METRICS_EXPORTER_ENDPOINT={OTLP_PROTO_METRICS_EXPORTER_ENDPOINT:-http://org_jaeger:4318/v1/metrics}

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/ .

# Install pg driver to run migrations
RUN bun install pg

# run the app
EXPOSE 3000/tcp
CMD bun run db:push && bun run start:prod
