#!/bin/bash

# ===========================================
# SEED DATABASE SCRIPT
# ===========================================
# This script seeds the database with initial data
# Run this after pulling from git to ensure database has required data
# Usage: ./scripts/seed-database.sh

set -e

echo "🌱 Starting database seeding..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

# Check if running in Docker or locally
if [ -f "/.dockerenv" ] || [ -n "$DOCKER_CONTAINER" ]; then
    echo "📦 Running inside Docker container"
    MONGODB_URI="${MONGODB_URI:-mongodb://mongodb:27017/smokava}"
else
    echo "💻 Running locally"
    MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/smokava}"
fi

# Check if docker-compose is available and containers are running
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    if docker compose ps 2>/dev/null | grep -q "smokava-backend.*Up"; then
        echo "🐳 Using Docker Compose backend container"
        docker compose exec -T backend node scripts/seed.js
        exit $?
    fi
fi

# Fallback to local execution
if [ ! -d "$PROJECT_DIR/backend" ]; then
    echo "❌ Error: backend directory not found"
    exit 1
fi

cd "$PROJECT_DIR/backend"

if [ ! -f "package.json" ]; then
    echo "❌ Error: backend/package.json not found"
    exit 1
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set MongoDB URI and run seed script
export MONGODB_URI="$MONGODB_URI"
export NODE_ENV="${NODE_ENV:-production}"

echo "🔗 Connecting to MongoDB: $MONGODB_URI"
node scripts/seed.js

echo "✅ Database seeding completed!"

