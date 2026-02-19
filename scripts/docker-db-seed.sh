#!/bin/bash
set -e

echo "🌱 Database Seeding (Docker)"
echo "============================"

# Check if .env.docker exists
if [ ! -f docker-custom/.env.docker ]; then
  echo "❌ docker-custom/.env.docker not found"
  exit 1
fi

echo "🔄 Seeding database..."
docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker run --rm app /bin/bash /app/scripts/db-seed.sh

echo ""
echo "✅ Database seeded"
