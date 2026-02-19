#!/bin/bash
set -e

echo "🌱 Database Seeding"
echo "==================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Check if database is already seeded
echo "🔍 Checking if database is already seeded..."
ADMIN_EXISTS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM \"User\" WHERE email = 'admin@prompts.chat'" 2>/dev/null | grep -oP '\d+' | tail -1 || echo "0")

if [ "$ADMIN_EXISTS" != "0" ]; then
  echo "ℹ️  Database already contains data (admin user found)"
  echo "⚠️  Skipping seeding to prevent duplicates"
  echo ""
  echo "💡 To force re-seed, manually clear the database first"
  exit 0
fi

echo "📝 Starting database seed..."
echo ""

# Run seed script
npx tsx prisma/seed.ts

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database seeding completed successfully"
  echo ""
  echo "📋 Default credentials:"
  echo "   Email: admin@prompts.chat"
  echo "   Password: password123"
  echo ""
  echo "⚠️  IMPORTANT: Change the admin password after first login!"
else
  echo "❌ Seeding failed"
  exit 1
fi
