# ---------- Stage 1: build the Angular app ----------
# Start FROM an existing image that already has Node.js installed.
# "AS builder" gives this stage a name we can refer to later.
FROM node:20-alpine AS builder

# Set the working directory inside the image. Every command after this
# runs relative to /app. It's created automatically if it doesn't exist.
WORKDIR /app

# Copy ONLY the package files first (not the whole project yet).
# Why? Podman caches each step. As long as these two files don't change,
# it reuses the cached "npm install" instead of re-downloading everything.
# This one trick makes your rebuilds go from minutes to seconds.
COPY package.json package-lock.json ./

# Install exactly the locked dependency versions. "npm ci" is the
# build-server version of "npm install" — faster and reproducible.
RUN npm ci

# NOW copy the rest of your source code in.
COPY . .

# Build the production bundle. This produces dist/meeting-room-booking/browser/
RUN npm run build

# ---------- Stage 2: serve the built files ----------
# Throw away everything above. Start fresh from a tiny nginx web server.
FROM nginx:alpine

# Copy ONLY the built static files out of the "builder" stage
# into nginx's default web-serving folder. Node never makes it here.
COPY --from=builder /app/dist/meeting-room-booking/browser /usr/share/nginx/html

# Replace nginx's default site config with our SPA-aware one.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Document that this container serves on port 80 (nginx's default).
EXPOSE 80

# nginx's base image already knows how to start itself, so we don't
# even need a CMD here — but being explicit is good practice.
CMD ["nginx", "-g", "daemon off;"]