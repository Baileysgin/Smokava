# ✅ پیاده‌سازی Kavenegar lookup.json

## خلاصه

پیاده‌سازی متد `verify/lookup.json` از Kavenegar برای ارسال پیامک OTP انجام شد.

## تغییرات

### فایل: `backend/services/kavenegar.js`

- ✅ استفاده از متد `verify/lookup.json` از Kavenegar
- ✅ API Key از متغیر محیطی `KAVENEGAR_API_KEY`
- ✅ Template از متغیر محیطی `KAVENEGAR_TEMPLATE`
- ✅ Token (کد OTP) به عنوان پارامتر ارسال می‌شود

## مستندات

- **REST API**: https://kavenegar.com/rest.html
- **Node.js SDK**: https://kavenegar.com/SDK.html#node

## نحوه استفاده

### Endpoint
```
GET https://api.kavenegar.com/v1/{API_KEY}/verify/lookup.json
```

### پارامترها
- `receptor`: شماره موبایل گیرنده
- `token`: کد OTP (6 رقم برای لاگین)
- `template`: نام تمپلیت

### متغیرهای محیطی مورد نیاز

```bash
KAVENEGAR_API_KEY=your-api-key-here
KAVENEGAR_TEMPLATE=otp-v2
NODE_ENV=production
```

## کد پیاده‌سازی شده

```javascript
const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;

const response = await axios.get(url, {
  params: {
    receptor: phoneNumber,  // شماره موبایل
    token: token,           // کد OTP
    template: template      // نام تمپلیت
  },
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Smokava-OTP-Service/1.0'
  }
});
```

## وضعیت

✅ **کد پیاده‌سازی شده و روی سرور deploy شده است**

- فایل `backend/services/kavenegar.js` به‌روزرسانی شد
- فقط از متد `lookup.json` استفاده می‌کند
- API Key و Template از environment variables خوانده می‌شوند
- Token (کد OTP) به عنوان پارامتر ارسال می‌شود

## تست

برای تست می‌توانید از endpoint زیر استفاده کنید:

```bash
curl -X POST https://api.smokava.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09302593819"}'
```

## نکات مهم

1. **سرویس پیشرفته**: متد `verify/lookup.json` نیاز به سرویس پیشرفته Kavenegar دارد
2. **Template**: باید template در پنل Kavenegar ثبت شده باشد
3. **API Key**: باید API Key معتبر باشد

