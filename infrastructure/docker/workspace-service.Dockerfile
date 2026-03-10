# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN true

FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app .
USER app
EXPOSE 3000
CMD ["sh", "-c", "echo starting workspace-service"]
