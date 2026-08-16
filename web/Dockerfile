# syntax=docker/dockerfile:1

# Panoul web QuizRealm (Vite + Express, generat cu Manus). `pnpm`, nu `npm`:
# lockfile-ul e pnpm, iar override-urile și `allowBuilds` stau în
# `pnpm-workspace.yaml`.

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV CI=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
# URL-urile publice ale backendului intră în bundle la build (Vite le inline-uie
# în JS-ul clientului), deci se dau ca build args, nu ca variabile de runtime.
ARG VITE_QUIZREALM_API_URL
ARG VITE_QUIZREALM_SOCKET_URL
RUN printf 'VITE_QUIZREALM_API_URL=%s\nVITE_QUIZREALM_SOCKET_URL=%s\n' \
      "$VITE_QUIZREALM_API_URL" "$VITE_QUIZREALM_SOCKET_URL" > .env \
  && pnpm build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# `esbuild --packages=external` lasă toate importurile nerezolvate, iar
# `server/_core/index.ts` importă `./vite` la nivel de modul — deci `vite` (o
# devDependency) e cerut chiar și în producție, unde ramura Vite nu rulează.
# Un `--prod` ar pica la pornire cu ERR_MODULE_NOT_FOUND, așa că reluăm
# `node_modules` complet din etapa de build în loc să reinstalăm.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
