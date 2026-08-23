# Multi-stage build: install once, build client + server, then run with
# only production dependencies in the final image.

FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY server server
COPY client client
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev --workspace server

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/drizzle server/drizzle
COPY --from=build /app/client/dist client/dist

# node:20-slim already ships a `node` user at uid 1000 (fantasy-football's
# useradd approach collides with it: "UID 1000 is not unique"), so reuse it
# rather than create a second one.
RUN mkdir -p /app/data/uploads && chown -R node:node /app
USER node

EXPOSE 4100
CMD ["node", "server/dist/index.js"]
