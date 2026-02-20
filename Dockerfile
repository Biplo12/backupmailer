FROM oven/bun:latest

RUN apt-get update && \
    apt-get install -y default-mysql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/

RUN mkdir -p /app/backups /app/logs

CMD ["bun", "run", "src/index.ts"]
