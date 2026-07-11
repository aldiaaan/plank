setup:
    pnpm install

infra:
    docker compose up -d

clean:
    docker compose down -v --remove-orphans

dev: infra
    pnpm dev
