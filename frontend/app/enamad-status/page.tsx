'use client';

import { useEffect, useState } from 'react';

interface EnamadStatus {
  httpsEnabled: boolean;
  fileAccessible: boolean;
  titleOverride: boolean;
  metaTagPresent: boolean;
  emailDnsReady: boolean;
  fileUrl: string;
  currentTitle: string;
  metaCode: string | null;
}

export default function EnamadStatusPage() {
  const [status, setStatus] = useState<EnamadStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const checkStatus = async () => {
      const fileUrl = '/28609673.txt';

      // Check HTTPS
      const httpsEnabled = window.location.protocol === 'https:';

      // Check file accessibility
      let fileAccessible = false;
      try {
        const response = await fetch(fileUrl, { method: 'HEAD' });
        fileAccessible = response.ok;
      } catch (error) {
        fileAccessible = false;
      }

      // Check title override
      const titleOverride = !!process.env.NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE;
      const currentTitle = document.title;

      // Check meta tag
      const metaTagPresent = !!process.env.NEXT_PUBLIC_ENAMAD_META_CODE;
      const metaCode = process.env.NEXT_PUBLIC_ENAMAD_META_CODE || null;

      // Email DNS readiness (just show info, can't actually verify DNS)
      const emailDnsReady = true; // User needs to add DNS records manually

      setStatus({
        httpsEnabled,
        fileAccessible,
        titleOverride,
        metaTagPresent,
        emailDnsReady,
        fileUrl,
        currentTitle,
        metaCode,
      });
      setLoading(false);
    };

    checkStatus();
  }, []);

  // Hide in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">در حال بررسی...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-red-400">خطا در بررسی وضعیت</p>
      </div>
    );
  }

  const StatusBadge = ({ condition, label }: { condition: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full ${condition ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className={condition ? 'text-green-400' : 'text-red-400'}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">وضعیت تأیید eNAMAD</h1>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4 text-white">بررسی‌های فنی</h2>

          <StatusBadge condition={status.httpsEnabled} label="HTTPS فعال" />
          <StatusBadge condition={status.fileAccessible} label={`فایل ${status.fileUrl} قابل دسترسی`} />
          <StatusBadge condition={status.titleOverride} label="عنوان سفارشی تنظیم شده" />
          <StatusBadge condition={status.metaTagPresent} label="متا تگ eNAMAD تنظیم شده" />
          <StatusBadge condition={status.emailDnsReady} label="DNS ایمیل آماده (نیاز به تنظیم دستی)" />
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mt-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4 text-white">جزئیات</h2>

          <div className="space-y-2 text-gray-300">
            <p><strong className="text-white">عنوان فعلی:</strong> {status.currentTitle}</p>
            <p><strong className="text-white">URL فایل:</strong> <a href={status.fileUrl} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{status.fileUrl}</a></p>
            {status.metaCode && (
              <p><strong className="text-white">کد متا:</strong> {status.metaCode}</p>
            )}
            <p><strong className="text-white">پروتکل:</strong> {window.location.protocol}</p>
          </div>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-2 text-yellow-400">یادآوری‌ها</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-200 text-sm">
            <li>این صفحه فقط در حالت توسعه نمایش داده می‌شود</li>
            <li>برای فعال‌سازی HTTPS، از Let's Encrypt استفاده کنید</li>
            <li>رکوردهای DNS ایمیل را در پنل DNS خود اضافه کنید</li>
            <li>متغیرهای محیطی را در production تنظیم کنید</li>
          </ul>
        </div>
      </div>
    </div>
  );
}



