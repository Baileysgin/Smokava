# Admin Panel Login Fix ✅

## Problem
Admin panel login was failing with `401 Unauthorized` error when trying to log in with credentials `admin`/`admin123`.

## Root Cause
The admin user did not exist in the database. The `Admin` collection was empty, causing the login endpoint to return "Invalid credentials" even with correct username/password.

## Solution
Created an admin user using the `createAdmin.js` script:

```bash
docker exec smokava-backend node scripts/createAdmin.js admin admin123
```

## Verification
✅ Admin user created successfully
✅ Login endpoint tested and working
✅ Token generation working correctly

## Current Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Please change the default password after first login for security!

## Testing

Test the login:
```bash
curl -X POST https://api.smokava.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "692a25ad15a97879ed06e412",
    "username": "admin"
  }
}
```

## Admin Panel Access

- **URL**: `https://admin.smokava.com/login`
- **Status**: ✅ Working
- **Authentication**: JWT token (valid for 7 days)

## Next Steps

1. Log in to the admin panel with the credentials above
2. Change the default password for security
3. Optionally create additional admin users with different credentials
