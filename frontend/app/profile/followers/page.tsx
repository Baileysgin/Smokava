'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';

export default function FollowersPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (user?._id) {
      fetchFollowers();
    }
  }, [isAuthenticated, router, user?._id]);

  const fetchFollowers = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await api.get(`/users/${user._id}/followers`);
      setFollowers(response.data);
    } catch (error) {
      console.error('Fetch followers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (userData: any) => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`.trim();
    }
    return userData?.firstName || userData?.lastName || userData?.name || userData?.username || `User_${userData?._id?.slice(-6) || ''}`;
  };

  const handleUserClick = (userId: string) => {
    if (userId === user?._id) {
      router.push('/profile');
    } else {
      router.push(`/user/${userId}`);
    }
  };

  return (
    <div className="min-h-screen bg-dark-300 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-300/98 backdrop-blur-xl border-b border-accent-500/30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3" dir="ltr">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-dark-100/50 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-white rotate-180" />
            </button>
            <h2 className="text-xl font-bold">
              <span className="text-accent-500">دنبال‌کننده‌ها</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Followers List */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">در حال بارگذاری...</div>
        ) : followers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-accent-500/20 rounded-3xl p-8 text-center">
            <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">هنوز کسی شما را دنبال نمی‌کند</p>
          </div>
        ) : (
          <div className="space-y-2">
            {followers.map((follower) => (
              <button
                key={follower._id}
                onClick={() => handleUserClick(follower._id)}
                className="w-full bg-dark-100 border border-accent-500/20 rounded-2xl p-4 flex items-center gap-4 hover:border-accent-500/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-accent-500/20 flex items-center justify-center border-2 border-accent-500/30 flex-shrink-0">
                  {follower.photoUrl || follower.avatar ? (
                    <img
                      src={follower.photoUrl || follower.avatar}
                      alt={getUserDisplayName(follower)}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-accent-500" />
                  )}
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-white mb-1">
                    {getUserDisplayName(follower)}
                  </h3>
                  <p className="text-sm text-gray-400">
                    @{follower.username || `user_${follower._id?.slice(-6) || ''}` || 'user'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}


