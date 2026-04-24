# syntax=docker/dockerfile:1.7

FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="Porto Belo — Frontend" \
      org.opencontainers.image.description="Portal de pagamento do fornecedor (HTML/CSS/JS vanilla) servido por nginx" \
      org.opencontainers.image.source="https://github.com/LuanLucino/Porto-Belo"

# Substitui a config default do nginx pela nossa
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Arquivos estáticos do portal
COPY . /usr/share/nginx/html

EXPOSE 80

# Healthcheck definido no docker-compose.yml (lá há contexto de rede/nome de serviço).
