#!/bin/bash
set -e

echo "🔐 Reset Admin Password"
echo "======================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

echo "🔄 Resetting admin password to: password123"
npx tsx prisma/reset-admin.ts

if [ $? -eq 0 ]; then
  echo "✅ Admin password reset successfully"
  echo ""
  echo "📋 Admin credentials:"
  echo "   Email: admin@prompts.chat"
  echo "   Password: password123"
else
  echo "❌ Password reset failed"
  exit 1
fi
