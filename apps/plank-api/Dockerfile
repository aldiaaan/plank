# syntax=docker/dockerfile:1

FROM node:22-alpine AS dev-base
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate

WORKDIR /app

# Copy workspace manifests first so deps layer caches independently of source
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/plank-web/package.json apps/plank-web/
COPY apps/plank-api/package.json apps/plank-api/
COPY packages/plank-ui/package.json packages/plank-ui/
COPY packages/plank-server/package.json packages/plank-server/
COPY packages/plank-eslint/package.json packages/plank-eslint/
COPY packages/plank-tsconfig/package.json packages/plank-tsconfig/
COPY packages/plank-common/package.json packages/plank-common/

RUN pnpm install --frozen-lockfile

# Source is bind-mounted at runtime; this keeps the image self-contained
COPY . .

WORKDIR /app/apps/plank-api
EXPOSE 4000
CMD ["pnpm", "dev"]
