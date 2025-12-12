#!/bin/bash

# Quick script to check backend status on the server
# Run this on the server via SSH

echo "🔍 Checking Backend Status..."
echo ""

echo "1️⃣ Docker containers status:"
docker compose ps | grep -E "backend|mongodb" || echo "   ⚠️  Docker compose not found or containers not running"
echo ""

echo "2️⃣ Backend container logs (last 20 lines):"
docker compose logs backend --tail=20 2>/dev/null || echo "   ⚠️  Could not retrieve logs"
echo ""

echo "3️⃣ Testing backend health endpoint locally:"
curl -s -m 5 http://localhost:5000/api/health | head -5 || echo "   ❌ Backend not responding on localhost:5000"
echo ""

echo "4️⃣ Checking if backend port is open:"
netstat -tuln | grep :5000 || ss -tuln | grep :5000 || echo "   ⚠️  Port 5000 not listening"
echo ""

echo "5️⃣ MongoDB connection status:"
docker compose ps mongodb 2>/dev/null | grep -q "Up" && echo "   ✅ MongoDB container is running" || echo "   ❌ MongoDB container is not running"
echo ""

echo "💡 If backend is down, restart it with:"
echo "   docker compose restart backend"
echo ""
echo "💡 Or check logs with:"
echo "   docker compose logs backend -f"
