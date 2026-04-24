# Docker Image

Build and run the game in Docker:

## Quick Start

```bash
# Build and run
cd docker
docker build -t slay-the-ceper .
docker run -p 8080:8080 slay-the-ceper

# Or use docker-compose
docker-compose up -d
```

## Endpoints

- Production: http://localhost:8080
- Dev: http://localhost:5173 (with hot reload)

## Files

- `Dockerfile` - Production build (nginx)
- `Dockerfile.dev` - Development (vite dev server)
- `docker-compose.yml` - Orchestration
- `docker/nginx.conf` - Nginx config