FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined into browser code at build time, so they must be build args.
ARG NEXT_PUBLIC_RETRACE_PACKAGE_ID
ARG NEXT_PUBLIC_RETRACE_REGISTRY_ID
ARG NEXT_PUBLIC_DEMO_PASSPORT_ID
ARG NEXT_PUBLIC_ENOKI_API_KEY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_RETRACE_PACKAGE_ID=$NEXT_PUBLIC_RETRACE_PACKAGE_ID     NEXT_PUBLIC_RETRACE_REGISTRY_ID=$NEXT_PUBLIC_RETRACE_REGISTRY_ID     NEXT_PUBLIC_DEMO_PASSPORT_ID=$NEXT_PUBLIC_DEMO_PASSPORT_ID     NEXT_PUBLIC_ENOKI_API_KEY=$NEXT_PUBLIC_ENOKI_API_KEY     NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1 RETRACE_DATA_DIR=/app/.data
RUN groupadd --system --gid 1001 retrace && useradd --system --uid 1001 --gid retrace retrace && mkdir /app/.data && chown retrace:retrace /app/.data
COPY --from=builder --chown=retrace:retrace /app/.next/standalone ./
COPY --from=builder --chown=retrace:retrace /app/.next/static ./.next/static
COPY --from=builder --chown=retrace:retrace /app/public ./public
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
# Starts as root only to fix the data volume's owner, then runs as the retrace user.
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
