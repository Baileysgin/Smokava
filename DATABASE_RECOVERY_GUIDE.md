# 🚨 Database Recovery Guide

## ⚠️ Critical Situation

Your database has been affected by what appears to be a **ransomware attack**. A suspicious database named `READ__ME_TO_RECOVER_YOUR_DATA` was detected, which is a classic indicator of MongoDB ransomware.

## 📊 Current Status

- ✅ **MongoDB Volume**: Intact (329MB of data)
- ✅ **MongoDB Container**: Running and healthy
- ⚠️ **Collections**: Mostly empty (only 2 users remain)
- 🚨 **Suspicious Database**: `READ__ME_TO_RECOVER_YOUR_DATA` detected
- ❌ **Missing Data**: Packages, Restaurants, Admins

## 🔄 Immediate Recovery Steps

### Option 1: Quick Recovery (Recommended)

Run the recovery script:

```bash
# On the server
ssh root@91.107.241.245
cd /opt/smokava
./scripts/recover-database.sh
```

Or from local machine:

```bash
# Make script executable
chmod +x scripts/recover-database.sh

# Run recovery
SERVER=root@91.107.241.245 SSH_PASS=pqwRU4qhpVW7 ./scripts/recover-database.sh
```

### Option 2: Manual Recovery

```bash
# SSH to server
ssh root@91.107.241.245
cd /opt/smokava

# 1. Remove suspicious database
docker exec smokava-mongodb mongosh --eval 'db.getSiblingDB("READ__ME_TO_RECOVER_YOUR_DATA").dropDatabase()'

# 2. Recreate admin user
docker exec smokava-backend node scripts/createAdmin.js admin admin123

# 3. Seed packages and restaurants
docker exec smokava-backend node scripts/seed.js

# 4. Verify recovery
docker exec smokava-mongodb mongosh smokava --eval 'db.getCollectionNames().forEach(c => print(c + ": " + db[c].countDocuments()))'
```

## 🛡️ Security Measures (URGENT)

### 1. Secure MongoDB Immediately

```bash
# Stop MongoDB from being accessible from outside
# Edit docker-compose.yml and remove port mapping:
# ports:
#   - "27017:27017"  # REMOVE THIS LINE

# Restart MongoDB
docker compose restart mongodb
```

### 2. Enable MongoDB Authentication

Create a script to enable authentication:

```bash
# Create admin user in MongoDB
docker exec smokava-mongodb mongosh admin --eval '
db.createUser({
  user: "admin",
  pwd: "CHANGE_THIS_STRONG_PASSWORD",
  roles: [ { role: "root", db: "admin" } ]
})'

# Update docker-compose.yml MONGODB_URI:
# MONGODB_URI=mongodb://admin:CHANGE_THIS_STRONG_PASSWORD@mongodb:27017/smokava?authSource=admin
```

### 3. Restrict Network Access

```bash
# Only allow connections from backend container
# Update docker-compose.yml mongodb service:
# networks:
#   - smokava-network
# # Remove ports section or bind to 127.0.0.1 only
```

### 4. Firewall Rules

```bash
# Block MongoDB port from external access
ufw deny 27017
# or
iptables -A INPUT -p tcp --dport 27017 -j DROP
```

## 📋 Post-Recovery Checklist

- [ ] Remove suspicious database
- [ ] Recreate admin user
- [ ] Seed packages and restaurants
- [ ] Verify all collections have data
- [ ] Secure MongoDB (remove external port access)
- [ ] Enable MongoDB authentication
- [ ] Set up firewall rules
- [ ] Create immediate backup
- [ ] Set up automated daily backups
- [ ] Review server logs for attack vectors
- [ ] Change all passwords
- [ ] Update SSH keys
- [ ] Review Docker security

## 🔍 Investigation

### Check Attack Vector

```bash
# Check MongoDB logs
docker logs smokava-mongodb | grep -i "drop\|delete\|remove" | tail -50

# Check system logs
journalctl -u docker | grep -i mongodb | tail -50

# Check for suspicious processes
ps aux | grep -i mongo

# Check network connections
netstat -tulpn | grep 27017
```

### Common Attack Vectors

1. **Exposed MongoDB Port**: Port 27017 exposed to internet
2. **No Authentication**: MongoDB running without auth
3. **Weak Passwords**: Default or weak credentials
4. **Unpatched Software**: Old MongoDB versions with vulnerabilities
5. **Docker Security**: Containers running with excessive privileges

## 💾 Backup Strategy

### Immediate Backup

```bash
# Create backup now
./scripts/backup-mongodb.sh

# Or manually
docker exec smokava-mongodb mongodump --archive --gzip --db=smokava > backup_$(date +%Y%m%d_%H%M%S).gz
```

### Automated Backups

```bash
# Add to crontab (daily at 2 AM)
crontab -e
# Add:
0 2 * * * /opt/smokava/scripts/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

## 🚨 Prevention Measures

1. **Never expose MongoDB to internet**
   - Remove port mapping: `27017:27017`
   - Only allow internal Docker network access

2. **Always enable authentication**
   - Create admin user with strong password
   - Use connection string with credentials

3. **Regular backups**
   - Daily automated backups
   - Test restore procedures regularly

4. **Monitor access**
   - Log all MongoDB connections
   - Set up alerts for suspicious activity

5. **Keep software updated**
   - Regular MongoDB updates
   - Security patches applied promptly

6. **Network security**
   - Firewall rules
   - VPN for admin access
   - SSH key authentication only

## 📞 If Data Cannot Be Recovered

If the data is truly lost and no backups exist:

1. **Accept the loss** - Start fresh with seed data
2. **Implement security** - Prevent future attacks
3. **Set up monitoring** - Detect attacks early
4. **Regular backups** - Never lose data again

## ✅ Recovery Verification

After running recovery, verify:

```bash
# Check collections
docker exec smokava-mongodb mongosh smokava --eval '
print("Users: " + db.users.countDocuments());
print("Packages: " + db.packages.countDocuments());
print("Restaurants: " + db.restaurants.countDocuments());
print("Admins: " + db.admins.countDocuments());
'

# Test admin login
# Go to: https://admin.smokava.com
# Login with: admin / admin123
```

## 📝 Summary

**Current Situation:**
- 🚨 Ransomware attack detected
- ⚠️ Most data missing (packages, restaurants, admins)
- ✅ Volume intact (329MB)
- ✅ 2 users remain

**Action Required:**
1. Run recovery script immediately
2. Secure MongoDB (remove external access)
3. Enable authentication
4. Set up automated backups
5. Review server security

**Prevention:**
- Never expose MongoDB port 27017 to internet
- Always use authentication
- Regular backups
- Monitor for suspicious activity

---

**Status**: 🚨 **URGENT - Recovery Required**
**Date**: 2025-11-29
**Priority**: **CRITICAL**
