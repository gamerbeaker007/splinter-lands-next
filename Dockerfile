FROM node:20-alpine

WORKDIR /app

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

# Setup cron job
RUN echo "0 1 * * * cd /app && npm run data:inject >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Add and make entrypoint executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
