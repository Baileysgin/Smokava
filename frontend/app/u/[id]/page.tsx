'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, MapPin, Heart, MessageCircle, Share2, Copy, Check, UserPlus, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Post } from '@/store/feedStore';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';

interface PublicProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  bio?: string;
  createdAt: string;
}

interface PublicProfileData {
  user: PublicProfile;
  stats: {
    totalConsumed?: number;
    restaurantsVisited?: number;
    totalPosts?: number;
    followerCount?: number;
    followingCount?: number;
  };
  mutualRestaurants?: Array<{
    _id: string;
    nameFa: string;
    addressFa?: string;
  }>;
  posts: Post[];
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { isAuthenticated, user, followUser, fetchFollowing } = useAuthStore();
  const [profileUser, setProfileUser] = useState<PublicProfile | null>(null);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [mutualRestaurants, setMutualRestaurants] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && profileUser) {
      checkFollowingStatus();
    }
  }, [isAuthenticated, profileUser]);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      // Backend handles both username and ID lookup
      const response = await api.get(`/users/${userId}/public`);
      const data = response.data;
      setProfileData(data);
      setProfileUser(data.user || response.data);
      setProfileStats(data.stats || {});
      setPosts(data.posts || []);
      setMutualRestaurants(data.mutualRestaurants || []);
    } catch (error: any) {
      console.error('Fetch public profile error:', error);
      // User not found or other error
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatus = async () => {
    if (!isAuthenticated || !user?._id || !profileUser) return;
    try {
      await fetchFollowing();
      const following = (window as any).__followingList || [];
      setIsFollowing(following.includes(profileUser._id));
    } catch (error) {
      console.error('Check following status error:', error);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (!userId || userId === user?._id) return;
    try {
      setIsFollowing(!isFollowing);
      await followUser(userId);
      await fetchFollowing();
      await fetchPublicProfile(); // Refresh to get updated counts
    } catch (error) {
      console.error('Follow error:', error);
      setIsFollowing(!isFollowing); // Revert on error
    }
  };

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/u/${profileUser?.username || profileUser?._id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `پروفایل ${profileUser?.firstName || 'کاربر'} در اسموکاوا`,
          text: `پروفایل ${profileUser?.firstName || 'کاربر'} را در اسموکاوا ببینید`,
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        await navigator.clipboard.writeText(publicUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    }
  };

  const handleInvite = async () => {
    if (!isAuthenticated || !userId) return;
    try {
      const response = await api.post(`/users/${userId}/invite`);
      const inviteUrl = response.data.inviteUrl;

      if (navigator.share) {
        await navigator.share({
          title: `دعوت به پیوستن به Smokava`,
          text: `${profileUser?.firstName || 'کاربر'} شما را به Smokava دعوت کرده است`,
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (error: any) {
      console.error('Invite error:', error);
      // Fallback to share profile URL
      handleShare();
    }
  };

  const getUserDisplayName = (userData: any) => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`.trim();
    }
    return userData?.firstName || userData?.lastName || userData?.name || userData?.username || `User_${userData?._id?.slice(-6) || ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-300 pb-20">
        <div className="text-center py-8 text-gray-400">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-dark-300 pb-20">
        <div className="text-center py-8 text-gray-400">کاربر یافت نشد</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-300/98 backdrop-blur-xl border-b border-accent-500/30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-dark-100/50 rounded-lg transition-colors"
            >
              <span className="text-white">← بازگشت</span>
            </button>
            <h2 className="text-xl font-bold text-accent-500">پروفایل عمومی</h2>
            <button
              onClick={handleShare}
              className="p-1.5 hover:bg-dark-100/50 rounded-lg transition-colors"
            >
              {shareCopied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Share2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="bg-dark-100 border border-accent-500/20 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-24 h-24 rounded-full border-2 border-accent-500 overflow-hidden flex-shrink-0 relative" style={{
              boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)'
            }}>
              {profileUser.photoUrl ? (
                <img
                  src={profileUser.photoUrl}
                  alt={getUserDisplayName(profileUser)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-500/30 to-accent-600/20 flex items-center justify-center">
                  <User className="w-12 h-12 text-accent-400" strokeWidth={2} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {getUserDisplayName(profileUser)}
              </h1>
              <p className="text-gray-400 text-sm mb-2">
                @{profileUser.username || `user_${profileUser._id?.slice(-6) || ''}` || 'user'}
              </p>
              {profileUser.bio && (
                <p className="text-gray-300 text-sm mb-4">{profileUser.bio}</p>
              )}
              {isAuthenticated && userId !== user?._id && (
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isFollowing
                      ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                      : 'bg-accent-500 text-white hover:bg-accent-600'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>دنبال شده</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>دنبال کن</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mutual Restaurants */}
          {mutualRestaurants.length > 0 && (
            <div className="mb-4 pt-4 border-t border-accent-500/20">
              <h3 className="text-sm text-gray-400 mb-2">رستوران‌های مشترک</h3>
              <div className="flex flex-wrap gap-2">
                {mutualRestaurants.map((restaurant) => (
                  <div
                    key={restaurant._id}
                    className="px-3 py-1 bg-accent-500/20 border border-accent-500/30 rounded-full text-sm text-accent-400"
                  >
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {restaurant.nameFa}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-accent-500/20">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profileStats?.totalPosts || posts.length || 0}</p>
              <p className="text-xs text-gray-400">پست</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profileStats?.followerCount || 0}</p>
              <p className="text-xs text-gray-400">دنبال‌کننده</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profileStats?.followingCount || 0}</p>
              <p className="text-xs text-gray-400">دنبال‌شده</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profileStats?.restaurantsVisited || 0}</p>
              <p className="text-xs text-gray-400">رستوران</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {posts.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-accent-500/20 rounded-3xl p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">این کاربر هنوز پستی منتشر نکرده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-dark-100 border border-accent-500/20 rounded-3xl overflow-hidden backdrop-blur-xl"
              >
                {post.imageUrl && (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-white mb-3">{post.caption}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{post.restaurant?.nameFa}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAuthenticated && <BottomNav />}
    </div>
  );
}
