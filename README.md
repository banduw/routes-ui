# Routes App

Two-workspace layout:

- `client/` – Vite + React front-end (served from `/routes`).
- `server/` – Express service that hosts the API and the built client assets.

## Install

```sh
npm install
```

## Build

```sh
npm run build          # builds both workspaces
npm run build:client   # client only
npm run build:server   # server only
```

## Run

```sh
npm run start --workspace server   # after building server
```

The Dockerfile expects `client/dist` to exist before building the image.
