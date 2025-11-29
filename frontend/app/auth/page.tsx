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
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { sendOTP, verifyOTP, telegramLogin } = useAuthStore();
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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await sendOTP(phoneNumber);

      // Check if SMS failed but OTP was generated
      if (response.smsError) {
        setError(`⚠️ کد تایید تولید شد اما ارسال پیامک ناموفق بود: ${response.smsError.message || 'خطای نامشخص'}. ${response.debugInfo || ''}`);
        // Still proceed to OTP step - user can use debug endpoint or check logs
        setStep('otp');
      } else {
        setStep('otp');
        setError('');
      }

      // In development, show OTP in console
      if (response.debugOtp) {
        console.log('🔐 Development OTP:', response.debugOtp);
        console.log('📱 Phone:', phoneNumber);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطایی در ارسال کد تایید رخ داد');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isVerifying || loading) {
      return;
    }
    
    setError('');
    setLoading(true);
    setIsVerifying(true);

    try {
      await verifyOTP(phoneNumber, code);
      // Only navigate if verification was successful
      router.push('/packages');
    } catch (err: any) {
      const errorMsg = err.message || err.response?.data?.message || 'کد تایید نامعتبر است';
      // Map English errors to Persian
      const errorMap: { [key: string]: string } = {
        'Invalid code': 'کد تایید نامعتبر است',
        'Expired code': 'کد تایید منقضی شده است',
        'Phone not found': 'شماره تلفن یافت نشد',
        'No OTP found. Please request a new one': 'کد تایید یافت نشد. لطفا دوباره درخواست دهید'
      };
      setError(errorMap[errorMsg] || errorMsg);
      setIsVerifying(false);
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

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
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
                disabled={loading}
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
              {loading ? 'در حال ارسال...' : 'ارسال کد تایید'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit} className="space-y-6">
            <div>
              <p className="text-sm text-gray-400 mb-4 text-center">
                کد تایید به شماره {phoneNumber} ارسال شد
              </p>
              <label htmlFor="otp" className="block text-sm font-medium mb-3 text-gray-300 flex items-center gap-2">
                <span>🔐</span>
                کد تایید را وارد کنید
              </label>
              <input
                id="otp"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="input bg-dark-200 border-accent-500/20 focus:border-accent-500 text-center text-2xl tracking-widest"
                required
                dir="ltr"
                maxLength={6}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-xl p-3 text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded-xl py-4 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بازگشت
              </button>
              <button
                type="submit"
                disabled={loading || isVerifying || code.length !== 6}
                className="flex-1 bg-gradient-to-l from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-white rounded-xl py-4 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20"
              >
                <LogIn className="w-5 h-5" />
                {loading || isVerifying ? 'در حال ورود...' : 'تایید و ورود'}
              </button>
            </div>
          </form>
        )}

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
