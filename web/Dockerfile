# syntax=docker/dockerfile:1

# Imaginea care servește ambele aplicații web: site-ul public și panoul de
# administrare. Sunt pachete separate în workspace, construite separat, servite
# de același proces Express — panoul sub `/admin`.
#
# Contextul de build e **rădăcina depozitului**, nu `web/`, pentru că workspace-ul
# cuprinde `shared/`, `web/` și `admin/`. Ce nu e necesar se exclude prin
# `.dockerignore`.
#
# `pnpm`, nu `npm`: lockfile-ul e pnpm, iar override-urile și `allowBuilds` stau
# în `pnpm-workspace.yaml`.

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV CI=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Manifestele întâi, ca stratul de dependențe să se refolosească între build-uri.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY shared/package.json ./shared/
COPY web/package.json ./web/
COPY admin/package.json ./admin/
RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY web ./web
COPY admin ./admin

# URL-urile publice ale backendului intră în bundle la build (Vite le inline-uie
# în JS-ul clientului), deci se dau ca build args, nu ca variabile de runtime.
ARG VITE_QUIZREALM_API_URL
ARG VITE_QUIZREALM_SOCKET_URL
RUN printf 'VITE_QUIZREALM_API_URL=%s\nVITE_QUIZREALM_SOCKET_URL=%s\n' \
      "$VITE_QUIZREALM_API_URL" "$VITE_QUIZREALM_SOCKET_URL" > .env \
  && pnpm --filter @quizrealm/web build \
  && pnpm --filter @quizrealm/admin build \
  && cp -r admin/dist web/dist/admin

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# `dist/index.js` e bundle complet (Express inclus), `dist/public` e site-ul și
# `dist/admin` e panoul, deci imaginea de producție nu are nevoie de node_modules.
COPY --from=build /app/web/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
