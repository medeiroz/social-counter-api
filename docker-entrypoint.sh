#!/bin/sh
set -e

# Verifica se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Running database seed..."
npm run db:seed || echo "⚠️  Seed failed or already executed"

echo "✅ Database setup complete"
echo "🚀 Starting application..."

exec "$@"
