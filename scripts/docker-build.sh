#!/bin/bash
set -e

echo "🐳 Building Docker Image"
echo "========================"

# Get version from package.json or use timestamp
VERSION=$(date +%Y%m%d-%H%M%S)
IMAGE_NAME="prompts-chat"

echo "📦 Image: ${IMAGE_NAME}:${VERSION}"
echo ""

# Build image
docker build \
  -f docker-custom/Dockerfile \
  --tag ${IMAGE_NAME}:latest \
  --tag ${IMAGE_NAME}:${VERSION} \
  --build-arg NODE_ENV=production \
  --progress=plain \
  .

echo ""
echo "✅ Docker image built successfully"
echo ""
echo "📋 Built images:"
docker images ${IMAGE_NAME} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""
echo "🚀 Run with: bash scripts/docker-run.sh"
echo "   Or: make run"
