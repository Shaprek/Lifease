### Multi-stage Dockerfile for Vite frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY public ./public
COPY src ./src
RUN npm ci --silent || npm install --silent
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
