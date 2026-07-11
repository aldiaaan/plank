setup:
    pnpm install

infra:
    docker compose up -d

clean:
    docker compose down -v --remove-orphans

dev: infra
    pnpm dev

db +args:
    pnpm --filter @plank/db exec drizzle-kit {{args}}
