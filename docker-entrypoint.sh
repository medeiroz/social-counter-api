#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npm run db:deploy

echo "🌱 Running database seed..."
npm run db:seed || echo "⚠️  Seed failed or already executed"

echo "✅ Database setup complete"
echo "🚀 Starting application..."

exec "$@"
