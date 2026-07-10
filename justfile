setup:
    pnpm install

infra:
    docker compose up -d

dev: infra
    pnpm dev
