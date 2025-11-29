'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Wallet, ArrowUp, Key, Copy, Check, Gift, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePackageStore } from '@/store/packageStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import BottomNav from '@/components/BottomNav';
import RatingModal from '@/components/RatingModal';

export default function WalletPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { userPackages, loading, fetchUserPackages, generateConsumptionOtp, getPendingRating, getUnratedConsumptions } = usePackageStore();
  const { restaurants, fetchRestaurants } = useRestaurantStore();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [shishaCount, setShishaCount] = useState(1);
  const [otpData, setOtpData] = useState<{ otpCode: string; expiresAt: string } | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState<{
    restaurantId: string;
    operatorId?: string;
    packageId?: string;
    redeemLogId: string;
    isGift?: boolean;
    restaurantName?: string;
  } | null>(null);
  const [hasCheckedPendingRating, setHasCheckedPendingRating] = useState(false);
  const [unratedConsumptions, setUnratedConsumptions] = useState<Map<string, {
    redeemLogId: string;
    restaurantId: string;
    restaurantName: string;
    operatorId?: string;
    packageId: string;
    isGift: boolean;
    consumedAt: string;
  }>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    fetchUserPackages();
    fetchRestaurants();
  }, [isAuthenticated, router, fetchUserPackages, fetchRestaurants]);

  // Fetch unrated consumptions
  useEffect(() => {
    const fetchUnrated = async () => {
      if (!isAuthenticated || loading) return;
      try {
        const result = await getUnratedConsumptions();
        const unratedMap = new Map();
        result.consumptions.forEach(consumption => {
          unratedMap.set(consumption.redeemLogId, consumption);
        });
        setUnratedConsumptions(unratedMap);
      } catch (error) {
        console.error('Error fetching unrated consumptions:', error);
      }
    };

    if (!loading && userPackages.length > 0) {
      fetchUnrated();
    }
  }, [isAuthenticated, loading, userPackages, getUnratedConsumptions]);

  // Check for pending ratings after packages are loaded
  useEffect(() => {
    const checkPendingRating = async () => {
      if (!isAuthenticated || loading || hasCheckedPendingRating || showRatingModal) return;

      try {
        const result = await getPendingRating();
        if (result.pending) {
          setRatingData({
            restaurantId: result.pending.restaurantId,
            operatorId: result.pending.operatorId,
            packageId: result.pending.packageId,
            redeemLogId: result.pending.redeemLogId,
            isGift: result.pending.isGift,
            restaurantName: result.pending.restaurantName
          });
          setShowRatingModal(true);
        }
        setHasCheckedPendingRating(true);
      } catch (error) {
        console.error('Error checking pending rating:', error);
        setHasCheckedPendingRating(true); // Mark as checked even on error to prevent retry loops
      }
    };

    if (!loading && userPackages.length > 0 && !showRatingModal) {
      checkPendingRating();
    }
  }, [isAuthenticated, loading, userPackages.length, getPendingRating, hasCheckedPendingRating, showRatingModal]);

  // Reset check flag when rating modal is closed (to allow checking again after new redemption)
  useEffect(() => {
    if (!showRatingModal && ratingData === null) {
      setHasCheckedPendingRating(false);
    }
  }, [showRatingModal, ratingData]);

  // Check for pending ratings when page becomes visible (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isAuthenticated && !loading && !showRatingModal) {
        try {
          const result = await getPendingRating();
          if (result.pending) {
            setRatingData({
              restaurantId: result.pending.restaurantId,
              operatorId: result.pending.operatorId,
              packageId: result.pending.packageId,
              redeemLogId: result.pending.redeemLogId,
              isGift: result.pending.isGift,
              restaurantName: result.pending.restaurantName
            });
            setShowRatingModal(true);
          }
        } catch (error) {
          console.error('Error checking pending rating on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, loading, showRatingModal, getPendingRating]);

  const handleGenerateOtp = async () => {
    if (!selectedRestaurant) {
      alert('لطفا رستوران را انتخاب کنید');
      return;
    }

    setOtpLoading(true);
    try {
      const data = await generateConsumptionOtp(selectedRestaurant, shishaCount);
      // Ensure OTP is always 5 digits as string
      if (data.otpCode) {
        // Convert to string first, then pad to ensure 5 digits
        const otpStr = String(data.otpCode);
        data.otpCode = otpStr.padStart(5, '0');
        console.log('OTP received:', data.otpCode, 'Length:', data.otpCode.length);
      }
      setOtpData(data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'خطایی رخ داد');
    } finally {
      setOtpLoading(false);
    }
  };

  const copyOtp = () => {
    if (otpData?.otpCode) {
      navigator.clipboard.writeText(otpData.otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString('fa-IR', { month: 'long' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  const getExpiryDate = (purchasedAt: string) => {
    const date = new Date(purchasedAt);
    date.setMonth(date.getMonth() + 3);
    const day = date.getDate();
    const month = date.toLocaleDateString('fa-IR', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
        <p className="text-gray-400">در حال بارگذاری...</p>
      </div>
    );
  }

  if (userPackages.length === 0) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: 'transparent' }}>
        <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-accent-500/20 p-4" style={{ backgroundColor: 'rgba(15, 15, 15, 0.7)' }}>
          <h2 className="text-2xl font-bold text-white text-center">پکیج های من</h2>
        </div>
        <div className="px-4 py-8">
          <div className="border border-accent-500/20 rounded-3xl p-8 text-center backdrop-blur-xl" style={{ backgroundColor: 'rgba(45, 45, 45, 0.6)' }}>
            <p className="text-gray-400 mb-4">هیچ پکیجی ندارید</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Separate gift packages from regular packages
  const regularPackages = userPackages.filter(pkg => !pkg.isGift && pkg.package);
  const giftPackages = userPackages.filter(pkg => pkg.isGift);

  // Get the first active package (or most recent)
  const activePackage = regularPackages[0] || userPackages[0];
  if (!activePackage) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: 'transparent' }}>
        <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-accent-500/20 p-4" style={{ backgroundColor: 'rgba(15, 15, 15, 0.7)' }}>
          <h2 className="text-2xl font-bold text-white text-center">پکیج های من</h2>
        </div>
        <div className="px-4 py-8">
          <div className="border border-accent-500/20 rounded-3xl p-8 text-center backdrop-blur-xl" style={{ backgroundColor: 'rgba(45, 45, 45, 0.6)' }}>
            <p className="text-gray-400 mb-4">در حال بارگذاری اطلاعات پکیج...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }
  const consumed = activePackage.totalCount - activePackage.remainingCount;
  const progressPercentage = (consumed / activePackage.totalCount) * 100;

  return (
    <div className="min-h-screen bg-dark-300 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-300/95 backdrop-blur-lg border-b border-accent-500/20 p-4">
        <h2 className="text-2xl font-bold text-white text-center">پکیج های من</h2>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Current Balance Card */}
        <div className="border-2 border-accent-500/30 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl" style={{
          backgroundColor: 'rgba(45, 45, 45, 0.6)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 107, 53, 0.1)'
        }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 107, 53, 0.1) 10px, rgba(255, 107, 53, 0.1) 20px)'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-400 text-sm font-medium">موجودی فعلی</span>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg" style={{
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
              }}>
                <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>

            <div className="mb-6 text-center">
              <p className="text-gray-400 text-sm mb-3 font-medium">
                {activePackage.isGift ? 'قلیون هدیه رستوران' : `پکیج ${activePackage.package?.nameFa || 'نامشخص'}`}
              </p>

              {/* Circular Progress Indicator */}
              <div className="relative inline-flex items-center justify-center mb-3">
                <svg className="transform -rotate-90 w-40 h-40">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="rgba(30, 30, 30, 0.5)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#accentGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - progressPercentage / 100)}`}
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b35" />
                      <stop offset="50%" stopColor="#ff7b47" />
                      <stop offset="100%" stopColor="#ff6b35" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-5xl font-bold text-white mb-1">{activePackage.remainingCount}</p>
                  <p className="text-xs text-gray-400">عدد باقی مانده</p>
                </div>
              </div>

              <div className="flex justify-center items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">مصرف شده:</span>
                  <span className="text-white font-semibold">{consumed} عدد</span>
                </div>
                <div className="w-px h-4 bg-accent-500/30"></div>
                <div className="flex items-center gap-2 text-accent-500">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-xs">اعتبار تا {getExpiryDate(activePackage.purchasedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate OTP Section - Highest Visual Hierarchy */}
        <div className="bg-gradient-to-br from-dark-100 to-dark-200 border-2 border-accent-500/40 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl" style={{
          boxShadow: '0 12px 40px rgba(255, 107, 53, 0.2), inset 0 1px 0 rgba(255, 107, 53, 0.1)'
        }}>
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center border border-accent-500/30">
                <Key className="w-5 h-5 text-accent-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-white">مصرف قلیان</h3>
            </div>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              برای مصرف قلیان در رستوران، کد OTP دریافت کنید
            </p>

            {/* Primary Action Button - Premium Styling */}
            <button
              onClick={() => setShowOtpModal(true)}
              className="w-full premium-accent text-dark-300 rounded-xl py-4 font-bold text-lg transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Key className="w-5 h-5" strokeWidth={2.5} />
                دریافت کد OTP
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            {/* Error Prevention Message */}
            <p className="text-xs text-gray-500 mt-3 text-center leading-relaxed flex items-center justify-center gap-1">
              <span>⚠️</span>
              <span>کد فقط در حضور پرسنل رستوران دریافت شود</span>
            </p>
          </div>
        </div>

        {/* Gift Packages Section */}
        {giftPackages.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-accent-500" />
              <h3 className="text-lg font-bold text-white">قلیون‌های هدیه رستوران</h3>
            </div>
            <div className="space-y-3">
              {giftPackages.map((giftPkg) => (
                <div
                  key={giftPkg._id}
                  className="bg-gradient-to-br from-dark-100 to-dark-200 border-2 border-accent-500/40 rounded-2xl p-4 relative overflow-hidden"
                >
                  <div className="absolute top-2 left-2">
                    <div className="bg-accent-500/20 border border-accent-500/40 rounded-full px-3 py-1">
                      <span className="text-accent-500 text-xs font-semibold flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        هدیه
                      </span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">
                        {giftPkg.giftFromRestaurantId?.nameFa || 'رستوران'}
                      </span>
                      <span className="text-2xl font-bold text-accent-500">
                        {giftPkg.remainingCount}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">
                      {giftPkg.remainingCount > 0 ? 'قابل استفاده' : 'استفاده شده'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage History */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">تاریخچه مصرف</h3>
          <div className="space-y-3">
            {activePackage.history && activePackage.history.length > 0 ? (
              activePackage.history.map((item, index) => {
                const redeemLogId = (item as any).redeemLogId?.toString();
                const canRate = redeemLogId && unratedConsumptions.has(redeemLogId);
                const unratedData = canRate ? unratedConsumptions.get(redeemLogId) : null;
                const consumedDate = new Date(item.consumedAt);
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                const isWithinTwoDays = consumedDate >= twoDaysAgo;

                const handleRateClick = () => {
                  if (unratedData) {
                    setRatingData({
                      restaurantId: unratedData.restaurantId,
                      operatorId: unratedData.operatorId,
                      packageId: unratedData.packageId,
                      redeemLogId: unratedData.redeemLogId,
                      isGift: unratedData.isGift,
                      restaurantName: unratedData.restaurantName
                    });
                    setShowRatingModal(true);
                  }
                };

                return (
                  <div
                    key={index}
                    className="border border-accent-500/20 rounded-2xl p-4 backdrop-blur-xl"
                    style={{ backgroundColor: 'rgba(45, 45, 45, 0.6)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">
                          {item.restaurant?.nameFa || 'نامشخص'}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.restaurant?.addressFa?.split('،').slice(0, 2).join('،') || ''}</span>
                        </div>
                        {item.flavor && (
                          <p className="text-red-400 text-sm mb-2">🍃 {item.flavor}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(item.consumedAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {item.count} عدد
                        </div>
                        {canRate && isWithinTwoDays && (
                          <button
                            onClick={handleRateClick}
                            className="flex items-center gap-1 bg-gradient-to-l from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-dark-300 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all"
                          >
                            <Star className="w-4 h-4 fill-current" />
                            امتیاز دهید
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-dark-100 border border-accent-500/20 rounded-2xl p-6 text-center">
                <p className="text-gray-400">هنوز مصرفی ثبت نشده</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-dark-200 border border-accent-500/30 rounded-3xl p-6 max-w-md w-full">
            {!otpData ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-accent-500">دریافت کد OTP</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">رستوران</label>
                    <select
                      value={selectedRestaurant}
                      onChange={(e) => setSelectedRestaurant(e.target.value)}
                      className="w-full bg-dark-100 border border-accent-500/20 rounded-xl py-3 px-4 text-white"
                    >
                      <option value="">انتخاب کنید</option>
                      {restaurants.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.nameFa}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">تعداد قلیان</label>
                    <input
                      type="number"
                      min="1"
                      value={shishaCount}
                      onChange={(e) => setShishaCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-dark-100 border border-accent-500/20 rounded-xl py-3 px-4 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowOtpModal(false)}
                      className="btn-secondary flex-1"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleGenerateOtp}
                      disabled={otpLoading || !selectedRestaurant}
                      className="bg-gradient-to-l from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-dark-300 rounded-xl py-3 px-6 font-semibold transition-all duration-200 flex-1 disabled:opacity-50"
                    >
                      {otpLoading ? 'در حال تولید...' : 'تولید کد'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-accent-500">کد OTP شما</h2>
                <div className="bg-gradient-to-br from-dark-100 to-dark-200 border-2 border-accent-500/50 rounded-2xl p-8 text-center mb-4 relative overflow-hidden" style={{
                  boxShadow: '0 8px 32px rgba(255, 107, 53, 0.3), inset 0 1px 0 rgba(255, 107, 53, 0.2)'
                }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-7xl font-bold mb-3 tracking-widest" style={{
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff7b47 50%, #ff6b35 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 30px rgba(255, 107, 53, 0.5)',
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '0.1em'
                    }}>
                      {(() => {
                        // Ensure OTP is always displayed as 5 digits
                        const otp = otpData.otpCode;
                        if (!otp) return '';
                        // Convert to string and pad to 5 digits
                        const otpStr = String(otp);
                        const padded = otpStr.padStart(5, '0');
                        return padded;
                      })()}
                    </div>
                    <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                      <span>⏰</span>
                      <span>این کد تا {new Date(otpData.expiresAt).toLocaleTimeString('fa-IR')} معتبر است</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyOtp}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      کپی شد
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      کپی کد
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpData(null);
                    setSelectedRestaurant('');
                    setShishaCount(1);
                  }}
                  className="w-full mt-2 btn-secondary"
                >
                  بستن
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingData && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={async () => {
            setShowRatingModal(false);
            setRatingData(null);
            // Refresh packages and unrated consumptions after rating is submitted/closed
            await fetchUserPackages();
            try {
              const result = await getUnratedConsumptions();
              const unratedMap = new Map();
              result.consumptions.forEach(consumption => {
                unratedMap.set(consumption.redeemLogId, consumption);
              });
              setUnratedConsumptions(unratedMap);
            } catch (error) {
              console.error('Error refreshing unrated consumptions:', error);
            }
          }}
          restaurantId={ratingData.restaurantId}
          operatorId={ratingData.operatorId}
          packageId={ratingData.packageId}
          redeemLogId={ratingData.redeemLogId}
          isGift={ratingData.isGift}
          restaurantName={ratingData.restaurantName}
        />
      )}

      <BottomNav />
    </div>
  );
}
