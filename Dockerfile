# Use Alpine for smallest final image
FROM node:24-alpine

WORKDIR /app

COPY node_modules/@twinlogic-singapore/common-if-utils \
    node_modules/@twinlogic-singapore/common-if-utils

# Copy only built artifacts and server manifest
COPY client/dist ./client/dist
COPY server/dist ./server/dist
COPY server/package.json ./server/

# Install just production server deps
WORKDIR /app/server
COPY .npmrc .npmrc
RUN npm install --omit=dev
RUN rm .npmrc

# Expose and run
CMD ["node", "dist/server.js"]
