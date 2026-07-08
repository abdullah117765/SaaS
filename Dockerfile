# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci


FROM deps AS builder

ARG VITE_API_BASE_URL
ARG VITE_ASSET_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_ASSET_BASE_URL=${VITE_ASSET_BASE_URL}

COPY . .
RUN npm run build


FROM nginx:1.27-alpine AS runtime

ENV PORT=3000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
