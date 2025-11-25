'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Phone, LogIn } from 'lucide-react';
import Logo from '@/components/Logo';

// Declare Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
            phone_number?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        requestContact: (callback: (granted: boolean) => void) => void;
        openLink: (url: string) => void;
      };
    };
  }
}

export default function AuthPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, telegramLogin } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Initialize Telegram WebApp if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();

      // Auto-login with Telegram if user data is available
      const tg = window.Telegram.WebApp;
      if (tg.initDataUnsafe?.user?.phone_number) {
        handleTelegramLogin();
      }
    }
  }, []);

  const handleTelegramLogin = async () => {
    if (!window.Telegram?.WebApp) {
      setError('تلگرام در دسترس نیست');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const tg = window.Telegram.WebApp;

      // Request contact permission
      tg.requestContact((granted) => {
        if (granted) {
          telegramLogin({
            initData: tg.initData,
            user: tg.initDataUnsafe.user
          }).then(() => {
            router.push('/packages');
          }).catch((err: any) => {
            setError(err.response?.data?.message || 'خطایی رخ داد');
          }).finally(() => {
            setLoading(false);
          });
        } else {
          setError('دسترسی به اطلاعات تماس لازم است');
          setLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطایی رخ داد');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(phoneNumber);
      router.push('/packages');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-300 via-dark-200 to-dark-300 p-4 sm:p-6">
      <div className="bg-white/5 backdrop-blur-sm border border-accent-500/20 rounded-3xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-2xl">
        <div className="text-center mb-8">
          <Logo className="mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-white">ورود / ثبت‌نام</h2>
          <p className="text-gray-400 text-sm">شماره موبایل خود را وارد کنید</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-3 text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent-500" />
              شماره موبایل را وارد کنید
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09123456789"
              className="input bg-dark-200 border-accent-500/20 focus:border-accent-500"
              required
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-xl p-3 text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-l from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-white rounded-xl py-4 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'در حال ورود...' : 'ورود / ثبت‌نام'}
          </button>
        </form>

        {/* Telegram Login Button */}
        {typeof window !== 'undefined' && window.Telegram?.WebApp && (
          <div className="mt-4">
            <button
              onClick={handleTelegramLogin}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>📱</span>
              {loading ? 'در حال ورود...' : 'ورود با تلگرام'}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            با ورود به اسموکاوا، شرایط و قوانین را می‌پذیرید
          </p>
        </div>
      </div>
    </div>
  );
}
