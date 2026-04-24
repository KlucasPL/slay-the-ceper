#!/bin/bash
set -e
cd "$(dirname "$0")"
DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
IMG="opencode-sandbox"
CONTAINER_NAME="opencode-sandbox"

if ! $DOCKER image inspect $IMG >/dev/null 2>&1; then
    echo "Building opencode-sandbox image..."
    $DOCKER build -t $IMG .
fi

EXISTING=$($DOCKER ps -a -q -f name=$CONTAINER_NAME 2>/dev/null || true)

if [ -n "$EXISTING" ]; then
    echo "Starting existing container..."
    $DOCKER start $CONTAINER_NAME
    echo "Container started."
    exec $DOCKER exec -w /workspace -it $CONTAINER_NAME /bin/bash -c "opencode ."
    echo ""
else
    echo "Starting new container..."
    $DOCKER run -v "$(pwd):/workspace" -w /workspace -d --name $CONTAINER_NAME $IMG
    echo "Container started."
    exec $DOCKER exec -w /workspace $CONTAINER_NAME /bin/bash -c "opencode ."
fi