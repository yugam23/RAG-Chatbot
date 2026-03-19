# Build stage: compile the Vite React app
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (ci is deterministic for CI/CD)
RUN npm ci

# Copy source files
COPY . .

# Build the production bundle (outputs to dist/)
RUN npm run build

# Production stage: serve static files via nginx
FROM nginx:alpine

# Copy built static files to nginx html root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx SPA routing configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
