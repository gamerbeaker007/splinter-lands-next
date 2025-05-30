#!/bin/sh

# Run DB migrations
npx prisma migrate deploy

# Start cron
crond -l 2

# Start the Next.js app in production mode
npm start
