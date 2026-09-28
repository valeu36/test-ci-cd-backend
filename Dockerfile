# Three stages so that the image that runs in production carries only the
# compiled output and its runtime dependencies — no TypeScript sources, tests
# or build toolchain.

# Keep in step with .nvmrc.
ARG NODE_VERSION=24.18.0

# ---- builder: compile src/ into dist/ ---------------------------------------
FROM node:${NODE_VERSION}-slim AS builder

WORKDIR /app

# Dependencies first, on their own layer, so a source-only change does not
# reinstall them. The full install (dev included) is needed for the Nest CLI
# and the TypeScript compiler.
COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- deps: production node_modules only -------------------------------------
# A separate stage rather than pruning the builder's tree: it installs from the
# lockfile with --omit=dev, so nothing dev-only can leak through.
FROM node:${NODE_VERSION}-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- runner: what actually ships --------------------------------------------
FROM node:${NODE_VERSION}-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# package.json alone (no lockfile, no sources): it is what `npm run
# migration:run:prod` reads when Railway runs the pre-deploy command in this
# image.
COPY package.json ./

USER node

# Railway injects PORT; 3000 is the local default (src/config/env.validation.ts).
EXPOSE 3000

CMD ["node", "dist/main"]
