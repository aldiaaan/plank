setup:
    pnpm install

infra:
    docker compose up -d

clean:
    docker compose down -v --remove-orphans

dev: infra
    pnpm exec turbo run dev --ui=tui codegen:watch --filter=@plank/web --filter=@plank/api --filter=@plank/client --filter=@plank/db --parallel

codegen:
    pnpm exec turbo run codegen --filter=@plank/client

# Visualize the Turborepo task graph (https://turborepo.dev/docs/core-concepts/package-and-task-graph)
deps:
    pnpm exec turbo run build --graph

db +args:
    pnpm --filter @plank/db exec drizzle-kit {{args}}
