FROM node:20-alpine

WORKDIR /app

# Cài dependencies trước để tận dụng cache layer
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src
COPY admin ./admin

ENV NODE_ENV=production
ENV PORT=8790
ENV DATA_DIR=/data

# Thư mục dữ liệu (mount volume để không mất khi update container)
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 8790

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:8790/health || exit 1

CMD ["node", "src/index.js"]
