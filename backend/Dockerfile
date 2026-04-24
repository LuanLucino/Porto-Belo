# syntax=docker/dockerfile:1.7

# ---------- Stage 1: dependências ----------
FROM node:20-alpine AS deps

WORKDIR /app

# Aproveita cache: só reinstala se package*.json mudar
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force


# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime

LABEL org.opencontainers.image.title="Porto Belo — Backend" \
      org.opencontainers.image.description="API Express que serve de gateway para o Sienge" \
      org.opencontainers.image.source="https://github.com/LuanLucino/Porto-Belo"

ENV NODE_ENV=production \
    PORT=3001

WORKDIR /app

# Usuário não-root para rodar a app
RUN addgroup -S portobelo && adduser -S portobelo -G portobelo

COPY --from=deps --chown=portobelo:portobelo /app/node_modules ./node_modules
COPY --chown=portobelo:portobelo . .

USER portobelo

EXPOSE 3001

# Healthcheck definido no docker-compose.yml (lá há contexto de rede/nome de serviço).
CMD ["node", "index.js"]
