# 🔐 Admin Panel Access Information

## 🌐 Admin Panel Address

**URL**: `http://admin.smokava.com`

**Alternative (Direct IP)**: `http://91.107.241.245:5173`

## 👤 Admin Login Credentials

### Default Admin Account:
- **Username**: `admin`
- **Password**: `admin123`

### ⚠️ Important Security Note:
**Please change the default password immediately after first login!**

## 🔑 How to Change Admin Password

After logging in, you can change the password through the admin panel settings, or create a new admin with a different password:

```bash
ssh root@91.107.241.245
cd /opt/smokava
docker compose exec backend node scripts/createAdmin.js newusername newpassword
```

## 📋 Admin Panel Features

- Dashboard with statistics
- Restaurant management
- User management
- Package management
- Ratings management
- Gift management
- Consumed/Sold packages tracking

## 🔗 Related URLs

- **Admin Panel**: http://admin.smokava.com
- **Admin Login**: http://admin.smokava.com/login
- **Operator Panel**: http://admin.smokava.com/operator/login
- **API**: http://api.smokava.com
- **User App**: http://smokava.com

## 🧪 Test Login

1. Visit: `http://admin.smokava.com/login`
2. Enter:
   - Username: `admin`
   - Password: `admin123`
3. Click login

## ✅ Current Status

- ✅ Admin user created successfully
- ✅ Admin panel accessible
- ✅ Default credentials active

**Remember to change the password after first login!**


