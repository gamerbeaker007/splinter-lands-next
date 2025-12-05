FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Prisma generate
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Daily job at 1:00 AM
RUN echo "0 1 * * * cd /app && npm run data:inject >> /var/log/cron.log 2>&1" > /etc/crontabs/root
# Weekly job at 2:00 AM on Sundays (0 = Sunday)
RUN echo "0 2 * * 0 cd /app && npm run data:inject-weekly >> /var/log/cron.log 2>&1" >> /etc/crontabs/root

# Add and make entrypoint executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
