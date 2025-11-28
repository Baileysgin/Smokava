#!/bin/bash

# Setup Kavenegar credentials in backend/.env

BACKEND_ENV="backend/.env"

echo "🔧 Setting up Kavenegar credentials..."

# Check if backend/.env exists
if [ ! -f "$BACKEND_ENV" ]; then
    echo "📝 Creating backend/.env file..."
    cat > "$BACKEND_ENV" << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production

# Kavenegar SMS Service
KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D
KAVENEGAR_TEMPLATE=otp-v2
KAVENEGAR_SENDER=

# OTP Debug (optional - for retrieving OTP in production)
OTP_DEBUG_SECRET_KEY=smokava-otp-debug-2024
EOF
    echo "✅ Created backend/.env file"
else
    echo "📝 Updating backend/.env file..."

    # Update or add KAVENEGAR_API_KEY
    if grep -q "^KAVENEGAR_API_KEY=" "$BACKEND_ENV"; then
        sed -i.bak "s|^KAVENEGAR_API_KEY=.*|KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D|" "$BACKEND_ENV"
    else
        echo "" >> "$BACKEND_ENV"
        echo "# Kavenegar SMS Service" >> "$BACKEND_ENV"
        echo "KAVENEGAR_API_KEY=4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D" >> "$BACKEND_ENV"
    fi

    # Update or add KAVENEGAR_TEMPLATE
    if grep -q "^KAVENEGAR_TEMPLATE=" "$BACKEND_ENV"; then
        sed -i.bak "s|^KAVENEGAR_TEMPLATE=.*|KAVENEGAR_TEMPLATE=otp-v2|" "$BACKEND_ENV"
    else
        echo "KAVENEGAR_TEMPLATE=otp-v2" >> "$BACKEND_ENV"
    fi

    # Update NODE_ENV to production
    if grep -q "^NODE_ENV=" "$BACKEND_ENV"; then
        sed -i.bak "s|^NODE_ENV=.*|NODE_ENV=production|" "$BACKEND_ENV"
    else
        echo "NODE_ENV=production" >> "$BACKEND_ENV"
    fi

    # Remove backup file if created
    [ -f "$BACKEND_ENV.bak" ] && rm "$BACKEND_ENV.bak"

    echo "✅ Updated backend/.env file"
fi

echo ""
echo "✅ Kavenegar credentials configured!"
echo ""
echo "📋 Configuration:"
echo "   API Key: 4D555572645075637678686F684E4154317157364C41666C636D2F657679556846326A4B384868704179383D"
echo "   Template: otp-v2"
echo ""
echo "🧪 To test, run:"
echo "   cd backend && npm run test:kavenegar"
echo ""
