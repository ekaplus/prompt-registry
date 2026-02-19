#!/bin/bash
set -e

echo "🔄 Database Initialization"
echo "=========================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

echo "📍 Database: ${DATABASE_URL%%\?*}"

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Database connection timeout after ${MAX_RETRIES} attempts"
    exit 1
  fi
  echo "   Attempt ${RETRY_COUNT}/${MAX_RETRIES} - Retrying in 2s..."
  sleep 2
done

echo "✅ Database connection established"

# Run migrations
echo ""
echo "📦 Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migration failed"
  exit 1
fi

echo ""
echo "✅ Database initialization complete"
