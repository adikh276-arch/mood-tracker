FROM node:20-alpine  AS builder
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build


FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy the static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html/mood_tracker
# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf
COPY vite-nginx.conf /etc/nginx/conf.d/nginx.conf

# Expose the port that Nginx will listen on
EXPOSE 80

# Command to start Nginx with runtime environment variable injection
CMD ["/bin/sh", "-c", "echo \"window.env = { VITE_NEON_CONNECTION_STRING: '$VITE_NEON_CONNECTION_STRING', VITE_NEON_API_KEY: '$VITE_NEON_API_KEY', VITE_PROJECT_ID: '$VITE_PROJECT_ID' };\" > /usr/share/nginx/html/mood_tracker/config.js && nginx -g 'daemon off;'"]
