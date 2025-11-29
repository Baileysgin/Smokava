# 🔧 Cloudflare Nameserver Setup

## ✅ DNS Records Configured

I can see you've added all the DNS A records in Cloudflare:
- ✅ `smokava.com` → 91.107.241.245
- ✅ `www` → 91.107.241.245
- ✅ `api` → 91.107.241.245
- ✅ `admin` → 91.107.241.245

## ⚠️ Important: Update Nameservers

The orange "Invalid nameservers" warning means you need to update your domain's nameservers at your **domain registrar** (where you bought the domain).

### Your Cloudflare Nameservers:
```
cleo.ns.cloudflare.com
novalee.ns.cloudflare.com
```

## 📋 Steps to Fix:

### Step 1: Go to Your Domain Registrar

Log in to where you registered `smokava.com` (NOT Cloudflare, but the original registrar like GoDaddy, Namecheap, etc.)

### Step 2: Find Nameserver Settings

Look for:
- "Nameservers"
- "DNS Nameservers"
- "Name Server Settings"
- "DNS Management"

### Step 3: Change Nameservers

Replace the current nameservers with Cloudflare's:

**Remove old nameservers, add these:**
```
cleo.ns.cloudflare.com
novalee.ns.cloudflare.com
```

### Step 4: Save and Wait

- Save the changes
- Wait 5 minutes to 48 hours for propagation
- The "Invalid nameservers" warning in Cloudflare will disappear once it detects the change

## ✅ After Nameservers Are Updated

Once nameservers are changed, your domain will work:
- ✅ http://smokava.com
- ✅ http://api.smokava.com
- ✅ http://admin.smokava.com

## 🧪 Verify It's Working

After updating nameservers, check:

```bash
# Should return: 91.107.241.245
dig +short smokava.com

# Should return: 91.107.241.245
dig +short api.smokava.com

# Should return: 91.107.241.245
dig +short admin.smokava.com
```

Or use: https://www.whatsmydns.net/#A/smokava.com

## 📝 Common Registrars - Where to Find Nameservers

### GoDaddy
1. My Products → DNS → Nameservers
2. Change to "Custom" → Add Cloudflare nameservers

### Namecheap
1. Domain List → Manage → Nameservers
2. Select "Custom DNS" → Add Cloudflare nameservers

### Google Domains
1. My domains → DNS → Name servers
2. Use custom name servers → Add Cloudflare nameservers

## ⚡ Quick Test (While Waiting)

You can test if everything works by editing your hosts file (see DNS_SETUP_GUIDE.md) or using:

- Direct IP: http://91.107.241.245:3000
- With Host header: `curl -H 'Host: smokava.com' http://91.107.241.245`

## 🎉 Once Nameservers Are Active

Your site will be live at:
- **http://smokava.com** (user app)
- **http://api.smokava.com** (backend API)
- **http://admin.smokava.com** (admin panel)

Everything is configured correctly on the server side - just need to update nameservers at your registrar!


