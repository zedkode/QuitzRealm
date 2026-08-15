# syntax=docker/dockerfile:1

# Imagine glibc, nu alpine: `argon2` are prebuild-uri pentru glibc, deci nu e
# nevoie de toolchain de compilare nativă în imagine.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
# `prisma.config.ts` cere DATABASE_URL la încărcare, deși `generate` nu se
# conectează la nimic. Îi dăm o valoare de unică folosință, doar pentru build.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build npx prisma generate \
  && npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
# `--chown=node`: `prisma migrate deploy` verifică motoarele din node_modules și
# are nevoie de drept de scriere acolo; altfel eșuează rulând ca utilizator node.
COPY --chown=node:node package.json package-lock.json prisma.config.ts tsconfig.json ./
COPY --chown=node:node prisma ./prisma
# Seed-urile (`prisma/seed.ts`, pachetul curatoriat) importă din `src/`, deci
# sursele rămân în imagine ca să poată fi rulate cu ts-node pe server.
COPY --chown=node:node src ./src
# Păstrăm și devDependencies: `prisma migrate deploy` și seed-urile (ts-node)
# rulează din aceeași imagine, ca să nu cerem un al doilea build.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=25s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/src/main"]
