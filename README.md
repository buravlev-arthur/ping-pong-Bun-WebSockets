# Ping Pong (Web-version)

_Ping Pong_ - is a replica of the computer game which was developed for [Atari](https://en.wikipedia.org/wiki/Atari,_Inc.) computers by [Allan Alcorn](https://en.wikipedia.org/wiki/Allan_Alcorn) in 1970 year. It's a web-oriented network game, thus you need a second player on any another desktop PC or laptop.

Demo: [188.225.84.218:81](http://188.225.84.218:81/)

## Stack of technologies

**Server**: [Bun](https://bun.sh/docs/api/websockets) with its WebSockets API, TypeScript.

**Frontend**: Vue 3 (Composition API), TypeScript, SCSS.

## Deployment

### Server

```bash
# intalling bun runtime globally
npm i -g bun

# in root derictory of the project
bun index.ts

# with using pm2
export NPM_GLOBALS_PATH=$(npm root -g)/bun/bin/bun
pm2 start --interpreter $NPM_GLOBALS_PATH index.ts
```

### Fontend

Build for frontend deployment is placed on: `<project root>/frontend/dist/`. Use [nginx](https://www.nginx.com/) or any another web-server.

Building:

```bash
# in frontend directory
bun run build
```

## Development

### Server

```bash
# installing bun runtime globally
npm i -g bun
# using bun with watch mode
bun dev
```

### Frontend

```bash
# in root-project directory
cd frontend
bun dev
```
