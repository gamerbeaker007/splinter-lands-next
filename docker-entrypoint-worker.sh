#!/bin/sh
set -e
exec npx tsx --tsconfig src/scripts/tsconfig.scripts.json src/scripts/worker.ts
