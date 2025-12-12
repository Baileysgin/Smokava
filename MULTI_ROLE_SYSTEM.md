# Multi-Role System Documentation

## Overview
The Smokava application supports context-aware multi-role authentication. The same user account can have multiple roles (user, restaurant_operator, admin), and the active role is determined by the login context.

## Role Contexts

### 1. User App Context (`context: 'user'`)
- **Login endpoint**: `/api/auth/verify-otp` or `/api/auth/telegram-login`
- **Default role**: Always returns `role: 'user'`
- **Usage**: User mobile app / web app
- **Token payload**: `{ userId, role: 'user', context: 'user' }`

### 2. Operator Panel Context (`context: 'operator'`)
- **Login endpoint**: `/api/auth/verify-otp` with `context: 'operator'` in request body
- **Required role**: User must have `role: 'restaurant_operator'` in database
- **Usage**: Restaurant operator dashboard
- **Token payload**: `{ userId, role: 'restaurant_operator', context: 'operator' }`
- **Access**: Requires `assignedRestaurant` field

### 3. Admin Panel Context (`context: 'admin'`)
- **Login endpoint**: Uses separate `/api/admin/login` endpoint (Admin model)
- **Token payload**: `{ adminId, role: 'admin' }`
- **Usage**: Admin panel
- **Note**: Admin uses separate Admin model, not User model

## Implementation Details

### Token Generation
```javascript
// User model
user.generateAuthToken(context = 'user')

// Contexts:
// - 'user': Always returns role: 'user'
// - 'operator': Returns role: 'restaurant_operator' if user has that role
// - 'admin': Returns role: 'admin' if user has that role
```

### Authentication Flow

1. **User App Login**:
   ```
   POST /api/auth/verify-otp
   Body: { phoneNumber, verificationCode }
   → Returns token with context: 'user', role: 'user'
   ```

2. **Operator Panel Login**:
   ```
   POST /api/auth/verify-otp
   Body: { phoneNumber, verificationCode, context: 'operator' }
   → Returns token with context: 'operator', role: 'restaurant_operator'
   → Fails if user doesn't have restaurant_operator role
   ```

3. **Admin Panel Login**:
   ```
   POST /api/admin/login
   Body: { username, password }
   → Uses Admin model (separate from User)
   → Returns token with adminId, role: 'admin'
   ```

### Middleware

- **`auth`**: General authentication middleware
  - Checks for `adminId` first (Admin tokens)
  - Then checks for `userId` (User tokens)
  - Sets `req.user` with appropriate role

- **`requireOperator`**: Operator-only middleware
  - Requires `role: 'restaurant_operator'`
  - Requires `assignedRestaurant`

- **`requireAdmin`**: Admin-only middleware
  - Requires `role: 'admin'` or `adminId`

## Multi-Role Support

The same phone number/user can have:
- `role: 'user'` - Regular user (default)
- `role: 'restaurant_operator'` - Restaurant operator
- `role: 'admin'` - Admin (though admin uses separate model)

When logging in:
- User app: Always uses 'user' context regardless of other roles
- Operator panel: Must have 'restaurant_operator' role
- Admin panel: Uses separate Admin model (not User model)

## Migration Notes

The system maintains backward compatibility:
- Existing users without context parameter default to 'user' context
- Single `role` field on User model for backward compatibility
- UserRole model exists for future multi-role expansion but is not currently used in auth flow

## Security Considerations

1. Context validation happens at token generation, not at middleware
2. Middleware checks the role in the token, not the context
3. Admin panel uses separate authentication (Admin model) for security
4. Operator access requires explicit `assignedRestaurant` field
