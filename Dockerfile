# One image: Express serves the API and the built React app (SDS SD-05).

FROM node:24-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server/package.json server/package-lock.json server/prisma.config.ts server/
COPY server/prisma server/prisma
RUN cd server && npm ci
COPY client/package.json client/package-lock.json client/
RUN cd client && npm ci
COPY server server
COPY client client
RUN cd server && npx prisma generate && npm run build
RUN cd client && npm run build

FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ARG APP_VERSION=dev
ENV NODE_ENV=production PORT=4000 CLIENT_DIST=/app/client/dist APP_VERSION=$APP_VERSION
# shortcut: copies server dev dependencies too (prisma CLI and tsx are needed for migrate/seed at start); prune when image size matters.
COPY --from=build /app/server /app/server
COPY --from=build /app/client/dist /app/client/dist
WORKDIR /app/server
EXPOSE 4000
CMD ["sh", "docker-entrypoint.sh"]
