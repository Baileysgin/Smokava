'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePackageStore } from '@/store/packageStore';
import BottomNav from '@/components/BottomNav';

export default function PackagesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { packages, fetchPackages, purchasePackage } = usePackageStore();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    fetchPackages();
  }, [isAuthenticated, router, fetchPackages]);

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    try {
      const { paymentUrl } = await purchasePackage(packageId);
      // Redirect to IPG payment gateway
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        alert('خطا در ایجاد لینک پرداخت');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'خطایی رخ داد');
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const getPerItemPrice = (price: number, count: number) => {
    return Math.floor(price / count);
  };

  const popularPackage = packages.find((pkg) => pkg.badge === 'popular');

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'transparent' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-accent-500/20 p-4" style={{ backgroundColor: 'rgba(15, 15, 15, 0.7)' }}>
        <h2 className="text-2xl font-bold text-accent-500 text-center mb-1">
          انتخاب پکیج قلیان
        </h2>
        <p className="text-center text-gray-400 text-sm">بهترین قیمتها را انتخاب کنید</p>
      </div>

      {/* Best Seller Badge */}
      {popularPackage && (
        <div className="px-4 pt-4">
          <div className="bg-accent-500/20 border border-accent-500/30 rounded-full px-4 py-2 inline-flex items-center gap-2 max-w-md mx-auto block text-center">
            <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
            <span className="text-accent-500 font-semibold text-sm">پرفروش ترین</span>
          </div>
        </div>
      )}

      {/* Packages */}
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {packages.map((pkg) => {
          const perItemPrice = getPerItemPrice(pkg.price, pkg.count);
          const isSelected = selectedPackage === pkg._id;

          return (
            <div
              key={pkg._id}
              className={`bg-dark-100 border-2 rounded-3xl overflow-hidden transition-all ${
                isSelected ? 'border-accent-500' : 'border-accent-500/20'
              }`}
              onClick={() => setSelectedPackage(pkg._id)}
            >
              <div className="p-6 text-center">
                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-10 h-10 text-white" />
                </div>

                {/* Package Name */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {pkg.nameFa}
                </h3>
                <p className="text-gray-400 mb-4">{pkg.count} عدد قلیان</p>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-3xl font-bold text-white mb-1">
                    {formatPrice(pkg.price)} تومان
                  </p>
                  <p className="text-sm text-gray-500">
                    هر قلیان {formatPrice(perItemPrice)} تومان
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6 text-right">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">قابل استفاده در تمام رستورانها</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">اعتبار ۳ ماهه</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">پشتیبانی ۲۴ ساعته</span>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(pkg._id);
                  }}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال انتقال به درگاه پرداخت...' : 'خرید و پرداخت'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
