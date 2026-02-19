#!/bin/bash
set -e

echo "🚀 Starting Prompts.Chat Application"
echo "====================================="

# Check if .env.docker exists
if [ ! -f docker-custom/.env.docker ]; then
  echo "❌ docker-custom/.env.docker not found"
  echo ""
  echo "📝 Create .env.docker from template:"
  echo "   cp docker-custom/.env.docker.example docker-custom/.env.docker"
  echo "   # Edit docker-custom/.env.docker with your configuration"
  exit 1
fi

# Load environment to check DATABASE_URL
source docker-custom/.env.docker

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set in docker-custom/.env.docker"
  exit 1
fi

echo "✅ Configuration loaded"
echo ""

# Start application
echo "🐳 Starting Docker container..."
docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker up -d

echo ""
echo "✅ Application started"
echo ""

# Show status
echo "📊 Container Status:"
docker-compose -f docker-custom/docker-compose.yml ps

echo ""
echo "🌐 Application URL: ${NEXTAUTH_URL:-http://localhost:3000}"
echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker-compose -f docker-custom/docker-compose.yml logs -f app"
echo "   Stop:             docker-compose -f docker-custom/docker-compose.yml down"
echo "   Restart:          docker-compose -f docker-custom/docker-compose.yml restart app"
echo "   Shell access:     docker-compose -f docker-custom/docker-compose.yml exec app /bin/bash"
echo ""
echo "   Or use Make:"
echo "   make logs         View logs"
echo "   make stop         Stop application"
echo "   make restart      Restart application"
echo "   make shell        Access container shell"
