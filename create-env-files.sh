#!/bin/bash

# Create backend .env file
cat > backend/.env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
KAVENEGAR_API_KEY=your-kavenegar-api-key-here
KAVENEGAR_TEMPLATE=your-template-name-here
EOF

# Create frontend .env.local file
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
EOF

echo "Environment files created successfully!"
echo ""
echo "⚠️  IMPORTANT: Update these files with your actual values:"
echo "   - backend/.env: Update JWT_SECRET, MONGODB_URI, KAVENEGAR_API_KEY, and KAVENEGAR_TEMPLATE"
echo "   - frontend/.env.local: Update NEXT_PUBLIC_MAPBOX_TOKEN with your Mapbox token"
echo ""
echo "Get a free Mapbox token at: https://account.mapbox.com/access-tokens/"
echo "Get Kavenegar API key at: https://panel.kavenegar.com/client/membership/input"
