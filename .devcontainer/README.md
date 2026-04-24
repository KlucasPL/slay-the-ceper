# Development in Docker with VS Code

This project includes a devcontainer configuration for consistent, containerized development.

## Prerequisites

- [Docker](https://docker.com)
- [VS Code](https://code.visualstudio.com)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Quick Start

1. Open this folder in VS Code
2. Click "Reopen in Container" (or press `F1` → "Dev Containers: Reopen in Container")
3. Wait for container to build (~2-3 min first time)
4. Run `npm run dev` to start dev server

## Manual Docker Setup

### Build image

```bash
docker build -t usiec-ceper-dev:latest .
```

### Run container

```bash
docker compose -f .devcontainer/docker-compose.yml up -d
```

### Attach VS Code

```bash
docker exec -it usiec-ceper-dev-dev-1 code /workspace
```

### Or attach terminal

```bash
docker exec -it usiec-ceper-dev-dev-1 bash
```

## Available Commands (inside container)

| Command          | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `npm run dev`    | Start dev server at http://localhost:5173/slay-the-ceper/ |
| `npm run lint`   | Run ESLint                                                |
| `npm run format` | Fix formatting                                            |
| `npm test`       | Run tests                                                 |
| `npm run build`  | Production build                                          |

## Troubleshooting

### Port not accessible

Ensure ports are exposed: `5173` (dev server), `9222` (debug)

### npm install fails

```bash
npm install --ignore-scripts && npm install @rollup/rollup-linux-x64
```

###VS Code not found
The Dockerfile includes VS Code server for remote development.
