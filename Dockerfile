FROM nginx:1.27-alpine

# Serve the already-built Vite output. Build artifacts must be present in ./dist.
WORKDIR /usr/share/nginx/html

# Copy the production bundle into the /routes path expected by the app's base URL.
COPY dist/ /usr/share/nginx/html/routes/

# Lightweight nginx config that serves the SPA at /routes and falls back to index.html.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
