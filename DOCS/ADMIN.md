# Admin Panel Guide

This guide explains how to use the admin panel features, including role assignment and moderation.

## Accessing Admin Panel

1. Navigate to `https://admin.smokava.com`
2. Login with admin credentials
3. You'll see the dashboard with statistics

## Role System

### Understanding Roles

- **user**: Regular user (default for all accounts)
- **operator**: Restaurant operator (can manage specific restaurant)
- **admin**: Full admin access

### Assigning Roles

1. Navigate to **Users** in the sidebar
2. Click on a user to view details
3. Use the role assignment section to:
   - Assign roles (user, operator, admin)
   - Assign restaurant to operators
   - Revoke roles

### Role Assignment API

You can also assign roles via API:

```bash
# Assign role(s) to user
POST /api/admin/users/:id/roles
{
  "roleNames": ["operator", "admin"],
  "restaurantId": "optional-restaurant-id-for-operators"
}

# List user roles
GET /api/admin/users/:id/roles

# Revoke role
DELETE /api/admin/users/:id/roles/:role?restaurantId=optional
```

## Moderation

### Managing Posts

1. Navigate to **مدیریت پست‌ها و نظرات** (Moderation) in the sidebar
2. View list of all posts
3. Actions available:
   - **View Details**: Click on a post to see full details and comments
   - **Hide/Unhide**: Toggle post visibility (published/unpublished)
   - **Delete**: Soft-delete a post (marks as deleted, doesn't remove from DB)

### Managing Comments

1. Select a post to view its comments
2. Click delete button on any comment
3. Comments are soft-deleted (marked as deleted, not removed)

### Moderation Logs

All moderation actions are logged in the `moderation_logs` collection:
- Action type (delete_post, hide_post, etc.)
- Target (post or comment)
- Admin who performed the action
- Timestamp
- Reason (optional)

## Package Management

### Creating Packages

1. Navigate to **مدیریت پکیج** (Package Management)
2. Click "افزودن پکیج جدید" (Add New Package)
3. Fill in package details:
   - Name (Persian)
   - Count (number of shishas)
   - Price
   - Features (optional)
   - **Time Windows** (optional): Define when package can be used
     - Format: `HH:mm` (e.g., "13:00" to "17:00")
     - Timezone: Asia/Tehran
   - **Duration Days** (optional): Package expiry in days

### Activating Packages for Users

1. Navigate to **فعال‌سازی پکیج** (Activate Package)
2. Select user and package
3. Optionally set:
   - Start date
   - End date
   - Time windows (overrides package defaults)

### Time-Based Packages

Packages can have time windows when they can be used:

- **Daily Windows**: Define hours when package is active (e.g., 13:00-17:00)
- **Date Range**: Set start and end dates
- **Timezone**: All times use Asia/Tehran

Users will see:
- Remaining tokens
- Current window status (available/waiting/expired)
- Next available window time

## User Management

### Viewing Users

1. Navigate to **کاربران** (Users)
2. See list of all users with:
   - Phone number
   - Name
   - Role
   - Registration date

### User Details

Click on a user to see:
- Profile information
- Packages owned
- Posts created
- Statistics:
  - Total packages
  - Total consumed shishas
  - Restaurants visited
  - Total posts

### Rebuilding Counters

If counters are incorrect:

1. Use API endpoint:
```bash
POST /api/admin/rebuild-counters
```

Or run script:
```bash
./scripts/rebuild-counters.sh
```

## Restaurant Management

### Adding Restaurants

1. Navigate to **رستوران‌ها** (Restaurants)
2. Click "افزودن رستوران" (Add Restaurant)
3. Fill in:
   - Name (English and Persian)
   - Address (English and Persian)
   - Coordinates (longitude, latitude)
   - Phone
   - City
   - Description

### Assigning Operators

1. Go to user details
2. Assign "operator" role
3. Select restaurant for the operator
4. Operator can now manage that restaurant

## Statistics Dashboard

The dashboard shows:
- Total users
- Total restaurants
- Total posts
- Total packages sold
- Total shishas consumed
- Recent users (last 7 days)

## Best Practices

1. **Always log moderation actions** with reasons
2. **Use soft-deletes** for posts/comments (can be restored)
3. **Test time windows** before activating packages
4. **Monitor user activity** through statistics
5. **Regular backups** (automated hourly)
6. **Review moderation logs** regularly

## Troubleshooting

### Counters Not Updating

Run rebuild counters:
```bash
POST /api/admin/rebuild-counters
```

### Role Assignment Not Working

Check:
1. User exists
2. Role name is valid (user, operator, admin)
3. Restaurant exists (for operators)
4. Admin token is valid

### Moderation Actions Not Appearing

Check:
1. Moderation logs collection
2. Post/comment `deletedAt` field
3. Post `published` field

## API Reference

See backend routes:
- `/api/admin/users` - User management
- `/api/admin/posts` - Post moderation
- `/api/admin/packages` - Package management
- `/api/admin/rebuild-counters` - Rebuild statistics
