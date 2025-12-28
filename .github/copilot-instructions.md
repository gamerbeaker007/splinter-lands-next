# Splinterlands Next.js Application - AI Coding Guide

## Project Overview
This is a Next.js 16 dashboard application for analyzing Splinterlands land game data. It features player deed tracking, resource management, production analytics, and market insights using data from Splinterlands APIs and a PostgreSQL database.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Material-UI v7, Plotly.js
- **Backend**: Next.js Server Actions, Prisma ORM, PostgreSQL
- **Auth**: NextAuth.js (GitHub OAuth, whitelist-based)
- **State**: React Context (PlayerContext, AuthContext, PageTitleContext)
- **Testing**: Vitest + Playwright (Storybook integration)
- **Deployment**: Docker with cron jobs for scheduled data ingestion

### Key Architectural Patterns

**Data Layer Separation**:
- `src/lib/backend/api/spl/` - External Splinterlands API calls
- `src/lib/backend/api/internal/` - Internal DB queries with Prisma
- `src/lib/backend/actions/` - Server Actions marked with `"use server"`
- `src/lib/backend/services/` - Business logic and caching

**Caching Strategy**:
- Two-tier NodeCache: `cache` (1 hour TTL) and `dailyCache` (25 hour TTL)
- Cache keys follow pattern: `{resource-type}:{identifier}` (e.g., `player-data:username`)
- See `src/lib/backend/cache/cache.ts` and service files for implementation

**Server Components Pattern**:
- Page components are async Server Components fetching data via Server Actions
- Use `Promise.all()` for parallel data fetching (see `src/app/planning/page.tsx`)
- Client components in `src/components/` consume data via props
- Custom hooks (e.g., `usePlayerDeeds`) wrap Server Actions for client-side data fetching

**Prisma Configuration**:
- Client generated to `src/generated/prisma/` (not default location)
- Always import from `@/generated/prisma/client`, never `@prisma/client`
- Uses PostgreSQL adapter with connection pooling (see `src/lib/prisma.ts`)

## Development Workflows

**Running the Application**:
```bash
npm run dev              # Start dev server with Turbopack
npm run build           # Production build
npm run data:inject     # Manual daily data ingestion
npm run data:inject-weekly  # Manual weekly data ingestion
npm run format:all      # Format + lint + type check
```

**Database Workflow**:
```bash
npx prisma generate     # Generate client (required after schema changes)
npx prisma migrate dev  # Create and apply migrations
npx prisma studio       # Visual database editor
```

**Docker Setup**:
- DB on port 5432, pgAdmin on 8080, app on 3000
- Cron jobs: daily at 1:00 AM, weekly Sunday 2:00 AM
- Entrypoint waits for DB and runs migrations automatically

## Project-Specific Conventions

**File Organization**:
- Actions: `src/lib/backend/actions/{domain}/{action-name}-actions.ts`
- Services: `src/lib/backend/services/{domain}Service.ts`
- Types: `src/types/{type-name}.ts` (prefer specific over generic names)
- Pages: `src/app/{section}/{page}/page.tsx` with tab-based navigation
- Components: `src/components/{section}/{ComponentName}.tsx`

**TypeScript Import Aliases**:
- Use `@/` for all internal imports: `@/lib/backend/actions/...`
- Never use relative imports for cross-folder references

**Logging Pattern**:
```typescript
import logger from "@/lib/backend/log/logger.server";
logger.info("Message");  // Logs to logs/app.log + console in dev
```

**Error Handling**:
- Use `logError(context, error)` from `@/lib/backend/log/logUtils` in scripts
- Server Actions should catch and return meaningful error objects to clients
- External API calls use retry-axios for resilience

**Data Enrichment Pipeline**:
Raw data → Service layer processing → Type conversion → Component consumption
- Example: `fetchRegionDataPlayer()` → `getCachedPlayerData()` → `mapRegionDataToDeedComplete()` → `DeedComplete[]`

## Critical Integration Points

**Splinterlands APIs**:
- Base: `spl-base-api.ts` (players, balances, cards)
- Land: `spl-land-api.ts` (deeds, taxes, liquidity pools, market)
- All use retry-axios and may have rate limits

**Authentication**:
- Only GitHub users in `GITHUB_ALLOWED_USERS` env var can sign in
- Protected routes check session via `getServerSession(authOptions)`
- Custom JWT validation in `src/lib/backend/jwt/splJwtValidation.ts`

**Data Ingestion Scripts**:
- Run via cron (Docker) or manually via npm scripts
- Flow: Fetch external data → Process metrics → Store in DB → Update LastUpdate timestamp
- See `src/scripts/data_inject.ts` for orchestration

**Material-UI Integration**:
- Custom dark theme in `src/lib/frontend/themes/themes.ts`
- Uses AppRouterCacheProvider and Emotion
- Import from `@mui/material` directly (prefer named imports)

## Common Tasks

**Adding a New Page**:
1. Create `src/app/{section}/{page}/page.tsx` (async Server Component)
2. Add Server Action in `src/lib/backend/actions/{domain}/`
3. Create presentational component in `src/components/{section}/`
4. Add navigation link in SideBar/TopBar

**Adding Database Table**:
1. Update `prisma/schema.prisma` with `@@map("table_name")` for snake_case tables
2. Run `npx prisma migrate dev --name descriptive_name`
3. Run `npx prisma generate` to regenerate client
4. Add query functions in `src/lib/backend/api/internal/`

**Creating Cached Service**:
```typescript
export async function getCached{Resource}(force = false): Promise<Type> {
  const cacheKey = `resource:identifier`;
  if (!force) {
    const cached = cache.get<Type>(cacheKey);
    if (cached) return cached;
  }
  const data = await fetch{Resource}();
  cache.set(cacheKey, data);
  return data;
}
```

## Testing & Quality

**Storybook**:
- Component stories in `*.stories.tsx` next to components
- Run with `npm run storybook`
- Vitest integration for component testing

**Type Safety**:
- `npx tsc --noEmit` for type checking without build
- Prisma types auto-generated; never manually define DB models
- Avoid `any`; use generated Prisma types or explicit interfaces

## Gotchas

- **Always run `npx prisma generate` after schema changes** or imports will fail
- **Server Actions must have `"use server"` directive** at file top
- **Material-UI requires both `ThemeProvider` and `CssBaseline`** (already in layout)
- **Cron logs** write to `/var/log/cron.log` in container (mounted volume)
- **Cache singleton** uses globalThis to persist across Next.js hot reloads
- **Prisma migration files** are versioned; don't manually edit after creation
