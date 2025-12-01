'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, MapPin, Cigarette, Calendar, Star, Award, Trophy, Target, Users, UserCheck, X, LogOut, Edit, Share2, Copy, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout, updateUser } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    fetchStats();
    fetchFollowCounts();
    fetchUserPrivacy();
  }, [isAuthenticated, router, user?._id]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const fetchFollowCounts = async () => {
    if (!user?._id) return;
    try {
      const [followersRes, followingRes] = await Promise.all([
        api.get(`/users/${user._id}/followers/count`),
        api.get(`/users/${user._id}/following/count`)
      ]);
      setFollowersCount(followersRes.data.count);
      setFollowingCount(followingRes.data.count);
    } catch (error) {
      console.error('Fetch follow counts error:', error);
    }
  };

  const fetchUserPrivacy = async () => {
    if (!user?._id) return;
    try {
      const response = await api.get(`/users/${user._id}`);
      setIsPrivate(response.data.isPrivate || false);
    } catch (error) {
      console.error('Fetch user privacy error:', error);
    }
  };

  const handlePrivacyToggle = async (value: boolean) => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await api.patch(`/users/${user._id}`, { isPrivate: value });
      setIsPrivate(value);
      await updateUser({ isPrivate: value } as any);
    } catch (error) {
      console.error('Update privacy error:', error);
      setIsPrivate(!value); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const handleShareProfile = async () => {
    if (!user?._id) return;

    try {
      // Generate public profile URL - try username first, fallback to ID
      const identifier = user.username || user._id;
      const publicUrl = `${window.location.origin}/u/${identifier}`;

      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `پروفایل ${user.firstName || user.name || 'کاربر'} در اسموکاوا`,
          text: `پروفایل ${user.firstName || user.name || 'کاربر'} را در اسموکاوا ببینید`,
          url: publicUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(publicUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        // Fallback to clipboard if share failed
        const identifier = user.username || user._id;
        const publicUrl = `${window.location.origin}/u/${identifier}`;
        await navigator.clipboard.writeText(publicUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    }
  };

  // Use real stats from API
  const displayStats = {
    restaurantsVisited: stats?.restaurantsVisited || 0,
    hookahsSmoked: stats?.totalConsumed || 0,
    daysActive: stats?.daysActive || 0,
    diverseFlavors: stats?.diverseFlavors || 0,
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'transparent' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-accent-500/20 p-4" style={{ backgroundColor: 'rgba(15, 15, 15, 0.7)' }}>
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-dark-100/50 rounded-lg transition-colors"
          >
            <Settings className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-xl font-bold text-white">پروفایل</h2>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Profile Header */}
        <div>
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : user?.firstName || user?.lastName || user?.name || user?.username || `User_${user?._id?.slice(-6) || ''}`}
              </h1>
              <p className="text-gray-400 text-sm mb-3">
                @{user?.username || `user_${user?._id?.slice(-6) || ''}` || 'user'}
              </p>
              {(user as any)?.bio ? (
                <div className="bg-dark-100 border border-accent-500/20 rounded-xl px-4 py-2 inline-flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-300">{(user as any).bio}</span>
                </div>
              ) : (
                <div className="bg-dark-100 border border-accent-500/20 rounded-xl px-4 py-2 inline-flex items-center gap-2 mb-3">
                  <span className="text-green-400">🍃</span>
                  <span className="text-sm text-gray-300">عاشق قلیان و فضاهای سنتی ایرانی</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="flex items-center gap-2 bg-accent-500/20 hover:bg-accent-500/30 text-accent-400 border border-accent-500/30 rounded-xl px-4 py-2 transition-all duration-200"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-semibold">ویرایش پروفایل</span>
                </button>
                <button
                  onClick={handleShareProfile}
                  className="flex items-center gap-2 bg-accent-500/20 hover:bg-accent-500/30 text-accent-400 border border-accent-500/30 rounded-xl px-4 py-2 transition-all duration-200"
                >
                  {shareCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-semibold">کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm font-semibold">اشتراک‌گذاری</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full border-2 border-accent-500 overflow-hidden flex-shrink-0 relative" style={{
              boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)'
            }}>
              {user?.photoUrl || user?.avatar ? (
                <img
                  src={user.photoUrl || user.avatar}
                  alt={user.firstName || user.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-500/30 to-accent-600/20 flex items-center justify-center">
                  <User className="w-10 h-10 text-accent-400" strokeWidth={2} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid - Premium Styling */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-dark-100 to-dark-200 border border-accent-500/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden" style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 107, 53, 0.1)'
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/5 rounded-full blur-2xl"></div>
            <MapPin className="w-6 h-6 text-accent-400 mb-2 relative z-10" strokeWidth={2.5} />
            <p className="text-3xl font-bold text-white mb-1 relative z-10">{displayStats.restaurantsVisited}</p>
            <p className="text-xs text-gray-400 relative z-10">رستوران بازدید</p>
          </div>
          <div className="bg-gradient-to-br from-dark-100 to-dark-200 border border-accent-500/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden" style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 107, 53, 0.1)'
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/5 rounded-full blur-2xl"></div>
            <Cigarette className="w-6 h-6 text-accent-400 mb-2 relative z-10" strokeWidth={2.5} />
            <p className="text-3xl font-bold text-white mb-1 relative z-10">{displayStats.hookahsSmoked}</p>
            <p className="text-xs text-gray-400 relative z-10">قلیان کشیده</p>
          </div>
          <button
            onClick={() => router.push(`/profile/followers`)}
            className="bg-gradient-to-br from-dark-100 to-dark-200 border border-accent-500/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden hover:border-accent-500/50 transition-colors cursor-pointer" style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 107, 53, 0.1)'
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/5 rounded-full blur-2xl"></div>
            <Users className="w-6 h-6 text-accent-400 mb-2 relative z-10" strokeWidth={2.5} />
            <p className="text-3xl font-bold text-white mb-1 relative z-10">{followersCount}</p>
            <p className="text-xs text-gray-400 relative z-10">دنبال‌کننده‌ها</p>
          </button>
          <button
            onClick={() => router.push(`/profile/following`)}
            className="bg-gradient-to-br from-dark-100 to-dark-200 border border-accent-500/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden hover:border-accent-500/50 transition-colors cursor-pointer" style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 107, 53, 0.1)'
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/5 rounded-full blur-2xl"></div>
            <UserCheck className="w-6 h-6 text-accent-400 mb-2 relative z-10" strokeWidth={2.5} />
            <p className="text-3xl font-bold text-white mb-1 relative z-10">{followingCount}</p>
            <p className="text-xs text-gray-400 relative z-10">دنبال‌شونده‌ها</p>
          </button>
          <div className="bg-gradient-to-br from-dark-100 to-dark-200 border border-accent-500/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden" style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 107, 53, 0.1)'
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/5 rounded-full blur-2xl"></div>
            <Calendar className="w-6 h-6 text-accent-400 mb-2 relative z-10" strokeWidth={2.5} />
            <p className="text-3xl font-bold text-white mb-1 relative z-10">{displayStats.daysActive}</p>
            <p className="text-xs text-gray-400 relative z-10">روز فعالیت</p>
          </div>
          <div className="bg-gradient-to-br from-dark-100 to-dark-200 border border-accent-500/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden" style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 107, 53, 0.1)'
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/5 rounded-full blur-2xl"></div>
            <Star className="w-6 h-6 text-accent-400 mb-2 relative z-10" strokeWidth={2.5} />
            <p className="text-3xl font-bold text-white mb-1 relative z-10">{displayStats.diverseFlavors}</p>
            <p className="text-xs text-gray-400 relative z-10">طعم متنوع</p>
          </div>
        </div>

        {/* Badges Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-white">نشانهای من</h3>
            <Award className="w-5 h-5 text-accent-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-100 border-t-4 border-red-500 rounded-2xl p-4 flex items-center justify-center">
              <Cigarette className="w-8 h-8 text-white" />
            </div>
            <div className="bg-dark-100 border-t-4 border-accent-500 rounded-2xl p-4 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div className="bg-dark-100 border-t-4 border-gray-400 rounded-2xl p-4 flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-dark-200 border border-accent-500/30 rounded-3xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-accent-500">تنظیمات</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-dark-100/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-4 bg-dark-100 rounded-xl border border-accent-500/20">
                <div>
                  <p className="text-white font-semibold mb-1">پروفایل خصوصی</p>
                  <p className="text-xs text-gray-400">پست‌های شما فقط برای دنبال‌کنندگان قابل مشاهده است</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => handlePrivacyToggle(e.target.checked)}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                </label>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl py-3 px-4 font-semibold transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>خروج از حساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
