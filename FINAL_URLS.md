# 🌐 Smokava - Final URLs

## ✅ Nginx Setup Complete!

Nginx is now configured and running. Your project is accessible via domain names.

## 🔗 Your URLs

### **User Application (Frontend)**
```
http://smokava.com
http://www.smokava.com
```

**Direct IP (if DNS not propagated):**
```
http://91.107.241.245:3000
```

### **Backend API**
```
http://api.smokava.com
http://api.smokava.com/api
```

**Direct IP:**
```
http://91.107.241.245:5000
http://91.107.241.245:5000/api
```

### **Admin Panel**
```
http://admin.smokava.com
http://admin.smokava.com/login
```

**Direct IP:**
```
http://91.107.241.245:5173
http://91.107.241.245:5173/login
```

### **Operator Panel**
```
http://admin.smokava.com/operator/login
http://admin.smokava.com/operator
```

**Direct IP:**
```
http://91.107.241.245:5173/operator/login
http://91.107.241.245:5173/operator
```

## ⚠️ DNS Configuration Required

**If the domain doesn't work yet, configure DNS:**

Point these DNS A records to `91.107.241.245`:

```
A     @                   91.107.241.245
A     www                 91.107.241.245
A     api                 91.107.241.245
A     admin               91.107.241.245
```

**DNS propagation time:** 5 minutes to 48 hours

## ✅ What's Working

- ✅ Nginx installed and running on port 80
- ✅ Frontend accessible via domain (when DNS is set)
- ✅ Backend API accessible via domain
- ✅ Admin panel accessible via domain
- ✅ All services proxied correctly
- ✅ CORS updated to allow domain names

## 🔐 Enable HTTPS (Optional but Recommended)

To add SSL certificates:

```bash
ssh root@91.107.241.245

# Install certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificates (after DNS is working)
certbot --nginx -d smokava.com -d www.smokava.com
certbot --nginx -d api.smokava.com
certbot --nginx -d admin.smokava.com
```

After SSL, URLs will be:
- https://smokava.com
- https://api.smokava.com
- https://admin.smokava.com

## 🧪 Test Your Setup

```bash
# Test frontend
curl http://smokava.com

# Test API
curl http://api.smokava.com

# Test admin
curl http://admin.smokava.com
```

## 📊 Current Status

| Service | Status | URL |
|---------|--------|-----|
| Frontend | ✅ Running | http://smokava.com |
| Backend | ✅ Running | http://api.smokava.com |
| Admin Panel | ✅ Running | http://admin.smokava.com |
| Operator Panel | ✅ Running | http://admin.smokava.com/operator |
| Nginx | ✅ Running | Port 80 |
| MongoDB | ✅ Running | Port 27017 |

## 🎉 Ready to Use!

Your Smokava project is now accessible via **smokava.com**!

Once DNS propagates, you can access:
- User app at: **http://smokava.com**
- API at: **http://api.smokava.com**
- Admin at: **http://admin.smokava.com**


