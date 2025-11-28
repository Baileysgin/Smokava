# eNAMAD Verification - Quick Reference

## 🚀 Quick Setup Checklist

### 1. Environment Variables (Add to Production)

```bash
NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE="Your Custom Title"
NEXT_PUBLIC_ENAMAD_META_CODE="your-enamad-code"
```

### 2. DNS Records (Add to Your DNS Provider)

| Type | Name | Value |
|------|------|-------|
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` |
| TXT | `google._domainkey` | (Get from Google Admin Console) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@smokava.com; pct=100` |

### 3. HTTPS Setup (Required)

```bash
sudo certbot --nginx -d smokava.com -d www.smokava.com
```

### 4. Verification URLs

- File: `https://smokava.com/28609673.txt`
- Debug: `http://localhost:3000/enamad-status` (dev only)

---

## 📋 Files Created/Modified

### Created Files:
- `/frontend/public/28609673.txt` - Verification file
- `/frontend/public/enamad/28609673.txt` - Backup verification file
- `/frontend/app/28609673.txt/route.ts` - Route handler
- `/frontend/app/enamad-status/page.tsx` - Debug page
- `/ENAMAD_VERIFICATION_SETUP.md` - Full documentation
- `/ENAMAD_QUICK_REFERENCE.md` - This file

### Modified Files:
- `/frontend/app/layout.tsx` - Added title override and meta tag support
- `/nginx/smokava-docker.conf` - Added verification file location blocks

---

## ✅ Verification Steps

1. **File Accessibility**:
   ```bash
   curl -I https://smokava.com/28609673.txt
   # Should return: 200 OK, Content-Type: text/plain
   ```

2. **HTTPS Check**:
   ```bash
   curl -I https://smokava.com
   # Should return: 200 OK (not redirect)
   ```

3. **Title Check**:
   - Visit `https://smokava.com`
   - View page source
   - Check `<title>` tag matches your override

4. **Meta Tag Check**:
   - Visit `https://smokava.com`
   - View page source
   - Check for `<meta name="enamad" content="...">`

5. **DNS Check**:
   ```bash
   dig TXT smokava.com +short
   dig TXT _dmarc.smokava.com +short
   ```

---

## 🔧 Server Config Summary

### Nginx Changes:
- Added `/28609673.txt` location with no-cache headers
- Added `/enamad/` location for folder access
- Ensured plain text content type

### Next.js Changes:
- Layout supports `NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE`
- Layout injects meta tag from `NEXT_PUBLIC_ENAMAD_META_CODE`
- Route handler for verification file

---

## 📝 Next Steps

1. ✅ Verification files created
2. ⚠️ **Set up HTTPS** (Let's Encrypt)
3. ⚠️ **Add DNS records** (SPF, DKIM, DMARC)
4. ⚠️ **Set environment variables** in production
5. ⚠️ **Configure email** (info@smokava.com)
6. ✅ Test all verification steps
7. Submit to eNAMAD

---

For detailed instructions, see: `ENAMAD_VERIFICATION_SETUP.md`
