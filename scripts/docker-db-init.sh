#!/bin/bash
set -e

echo "🔧 Database Initialization (Docker)"
echo "===================================="

# Check if .env.docker exists
if [ ! -f docker-custom/.env.docker ]; then
  echo "❌ docker-custom/.env.docker not found"
  exit 1
fi

echo "🔄 Running database migrations..."
docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker run --rm app /bin/bash /app/scripts/db-init.sh

echo ""
echo "✅ Database initialized"
