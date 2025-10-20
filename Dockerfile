# Build Next.js project
FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY bun.lock ./
RUN bun install
COPY . .
RUN bun run build

# Create production image
FROM oven/bun:1.3-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/bun.lock ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./
COPY --from=build /app/src/db ./src/db
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

RUN bun install --production

EXPOSE 3000
ENV PORT=3000
CMD ["bun", "start"]