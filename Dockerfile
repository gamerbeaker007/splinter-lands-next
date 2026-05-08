# Base stage -- shared foundation for builder and runner
FROM node:24-alpine AS base

WORKDIR /app

# Builder stage -- installs deps and produces the Next.js build
FROM base AS builder

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Dummy DATABASE_URL for build -- prisma generate only reads the schema, never connects.
# ARG is scoped to this stage and does NOT leak into the runner image.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DATABASE_URL=${DATABASE_URL}

# App version -- passed from CI as a build arg, baked into the image
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

RUN npx prisma generate
RUN npm run build

# Production runner stage -- lean image with only runtime artefacts
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

# Create non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Install prisma CLI + tsx + dotenv globally for running migrations and the worker.
# Versions are read from package.json to stay in sync with the app.
# NODE_PATH lets prisma.config.ts resolve these imports from the global location.
COPY --from=builder /app/package.json ./package.json
RUN PRISMA_VER=$(node -p "require('./package.json').devDependencies.prisma") && \
    DOTENV_VER=$(node -p "require('./package.json').devDependencies.dotenv") && \
    TSX_VER=$(node -p "require('./package.json').devDependencies.tsx") && \
    npm install -g "prisma@${PRISMA_VER}" "dotenv@${DOTENV_VER}" "tsx@${TSX_VER}" && \
    rm package.json

ENV NODE_PATH=/usr/local/lib/node_modules

# Full node_modules from builder (needed by worker tsx runtime).
# Copy BEFORE standalone -- standalone overwrites some modules with its
# optimised copies, which is fine for the app; the worker only uses
# modules that standalone does not touch.
COPY --from=builder /app/node_modules ./node_modules

# Standalone Next.js runtime (overwrites its subset of node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma: schema, migrations, and config
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Worker: scripts + backend libs + types (tsx transpiles on the fly)
COPY --from=builder /app/src/scripts ./src/scripts
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/src/constants ./src/constants
COPY --from=builder /app/tsconfig.json ./

# Entrypoint scripts
COPY docker-entrypoint.sh ./
COPY docker-entrypoint-worker.sh ./
RUN chmod +x docker-entrypoint.sh docker-entrypoint-worker.sh

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]