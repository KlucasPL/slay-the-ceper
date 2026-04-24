#!/bin/bash
set -e
cd "$(dirname "$0")"
DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
IMG="opencode-sandbox"

if ! $DOCKER image inspect $IMG >/dev/null 2>&1; then
    echo "Building opencode-sandbox image..."
    $DOCKER build -t $IMG .
fi

echo "Starting container..."
$DOCKER run --rm -v "$(pwd):/workspace" -w /workspace -d --name opencode-sandbox $IMG

echo "Container started."
echo ""
echo "To attach, run:"
echo "  docker exec -it opencode-sandbox /bin/bash"
echo ""
echo "Then inside container:"
echo "  opencode providers login"
echo "  opencode ."