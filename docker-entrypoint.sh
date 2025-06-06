#!/bin/sh

# Load .env variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Extract connection details from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*//[^:]+:[^@]+@([^:/]+):([0-9]+)/.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*//[^:]+:[^@]+@([^:/]+):([0-9]+)/.*|\2|')
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*//([^:]+):.*|\1|')

# Fallback defaults
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready at $DB_HOST:$DB_PORT as $DB_USER..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - continuing..."


# Run DB migrations
npx prisma migrate deploy

# Start cron
crond -l 2

# Start the Next.js app in production mode
npm start
