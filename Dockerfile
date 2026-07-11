# Cloud Run image for the Express API + exported Expo web app.
# Cloud Run source deploys use this Dockerfile when the trigger's build type
# is set to "Dockerfile" (otherwise Google Cloud Buildpacks run and this file
# is ignored). Artifacts mirror vercel.json includeFiles; the server resolves
# static-build/, assets/, server/templates/, and app.json from process.cwd().
#
# The optional `build_extra_ca` secret lets sandboxed CI environments with a
# TLS-intercepting egress proxy inject their CA for npm; when the secret is
# not provided (e.g. Cloud Build) the mount is absent and npm runs normally.

# --- Build stage: bundle the API server and export the Expo web app ---
FROM node:22-slim AS build
WORKDIR /app
ENV CI=1
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=secret,id=build_extra_ca,target=/tmp/extra-ca.crt \
    sh -c '[ -s /tmp/extra-ca.crt ] && export npm_config_cafile=/tmp/extra-ca.crt NODE_EXTRA_CA_CERTS=/tmp/extra-ca.crt; \
    npm install -g npm@11 && npm ci'
COPY . .
RUN npm run server:build && npx expo export --platform web --output-dir static-build

# --- Runtime stage: production dependencies + built artifacts only ---
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json .npmrc ./
# --ignore-scripts: the only lifecycle script is patch-package (a devDependency,
# absent here); no runtime dependency needs an install script.
RUN --mount=type=secret,id=build_extra_ca,target=/tmp/extra-ca.crt \
    sh -c '[ -s /tmp/extra-ca.crt ] && export npm_config_cafile=/tmp/extra-ca.crt NODE_EXTRA_CA_CERTS=/tmp/extra-ca.crt; \
    npm install -g npm@11 && npm ci --omit=dev --ignore-scripts && npm cache clean --force'
COPY --from=build /app/server_dist ./server_dist
COPY --from=build /app/static-build ./static-build
COPY assets ./assets
COPY server/templates ./server/templates
COPY app.json ./
EXPOSE 8080
CMD ["node", "server_dist/index.js"]
