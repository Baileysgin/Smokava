# 🔧 DNS Setup Guide for Smokava

## ❌ Current Issue: DNS_PROBE_FINISHED_NXDOMAIN

This error means **DNS records are not configured** for `smokava.com`. The domain doesn't know where to point.

## ✅ Solution: Configure DNS Records

You need to add DNS A records pointing to your server IP: **91.107.241.245**

### Step 1: Access Your Domain Registrar

1. Log in to your domain registrar (where you bought `smokava.com`)
   - Common registrars: GoDaddy, Namecheap, Cloudflare, Google Domains, etc.

2. Find the DNS management section
   - Usually called "DNS Settings", "DNS Management", or "Name Servers"

### Step 2: Add DNS A Records

Add these **A records**:

| Type | Name/Host | Value/Points To | TTL |
|------|-----------|----------------|-----|
| A | @ (or blank) | 91.107.241.245 | 3600 (or Auto) |
| A | www | 91.107.241.245 | 3600 (or Auto) |
| A | api | 91.107.241.245 | 3600 (or Auto) |
| A | admin | 91.107.241.245 | 3600 (or Auto) |

**Note:**
- `@` or blank = root domain (smokava.com)
- `www` = www.smokava.com
- `api` = api.smokava.com
- `admin` = admin.smokava.com

### Step 3: Wait for DNS Propagation

- **Minimum:** 5-15 minutes
- **Average:** 1-4 hours
- **Maximum:** 48 hours

### Step 4: Verify DNS

After adding records, verify with:

```bash
# Check if DNS is working
dig +short smokava.com
# Should return: 91.107.241.245

dig +short api.smokava.com
# Should return: 91.107.241.245

dig +short admin.smokava.com
# Should return: 91.107.241.245
```

## 🌐 Alternative: Use Direct IP (Temporary)

While waiting for DNS, you can access your site using:

### Option 1: Edit Hosts File (Local Only)

**On Windows:**
1. Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
2. Add these lines:
```
91.107.241.245    smokava.com
91.107.241.245    www.smokava.com
91.107.241.245    api.smokava.com
91.107.241.245    admin.smokava.com
```
3. Save and try accessing `smokava.com` in your browser

**On Mac/Linux:**
1. Open terminal
2. Run: `sudo nano /etc/hosts`
3. Add the same lines as above
4. Save (Ctrl+O, Enter, Ctrl+X)

### Option 2: Use Direct IP URLs

- **Frontend:** http://91.107.241.245:3000
- **API:** http://91.107.241.245:5000
- **Admin:** http://91.107.241.245:5173

## 📋 Common Domain Registrars - Quick Links

### GoDaddy
1. Go to: https://www.godaddy.com
2. My Products → DNS → Manage DNS
3. Add A records

### Namecheap
1. Go to: https://www.namecheap.com
2. Domain List → Manage → Advanced DNS
3. Add A records

### Cloudflare
1. Go to: https://dash.cloudflare.com
2. Select domain → DNS → Records
3. Add A records

### Google Domains
1. Go to: https://domains.google.com
2. My domains → DNS → Custom records
3. Add A records

## ✅ After DNS is Configured

Once DNS propagates, you can access:

- ✅ http://smokava.com
- ✅ http://api.smokava.com
- ✅ http://admin.smokava.com

## 🔐 Next: Enable HTTPS

After DNS is working, get SSL certificates:

```bash
ssh root@91.107.241.245
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d smokava.com -d www.smokava.com -d api.smokava.com -d admin.smokava.com
```

## 🆘 Still Having Issues?

1. **Check DNS propagation:** https://www.whatsmydns.net/#A/smokava.com
2. **Verify server is running:** `curl http://91.107.241.245:3000`
3. **Check Nginx:** `ssh root@91.107.241.245 'systemctl status nginx'`

## 📞 Quick Test Commands

```bash
# Test if server is accessible
curl http://91.107.241.245:3000

# Test Nginx with Host header
curl -H 'Host: smokava.com' http://91.107.241.245

# Check DNS
dig +short smokava.com
```

