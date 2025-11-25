'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, User, MapPin, Heart, MessageCircle, Send } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Post } from '@/store/feedStore';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';

interface UserProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  name?: string;
  avatar?: string;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const { isAuthenticated, user, following, fetchFollowing, followUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
      fetchFollowing();
    }
  }, [isAuthenticated, router, userId, fetchFollowing]);

  useEffect(() => {
    if (profileUser) {
      setIsFollowingUser(profileUser.isFollowing || false);
    }
  }, [profileUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setProfileUser(response.data);
      setIsFollowingUser(response.data.isFollowing || false);
    } catch (error) {
      console.error('Fetch user profile error:', error);
      router.push('/feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await api.get(`/users/${userId}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Fetch user posts error:', error);
    }
  };

  const handleFollow = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!userId || userId === user?._id) return;
    try {
      // Optimistic update
      setIsFollowingUser(!isFollowingUser);
      if (profileUser) {
        setProfileUser({
          ...profileUser,
          followerCount: (profileUser.followerCount || 0) + (isFollowingUser ? -1 : 1),
          isFollowing: !isFollowingUser
        });
      }
      await followUser(userId);
      await fetchFollowing();
      // Refresh profile to get accurate counts
      await fetchUserProfile();
    } catch (error) {
      console.error('Follow error:', error);
      // Revert optimistic update on error
      setIsFollowingUser(!isFollowingUser);
      if (profileUser) {
        setProfileUser({
          ...profileUser,
          followerCount: (profileUser.followerCount || 0) + (isFollowingUser ? 1 : -1),
          isFollowing: isFollowingUser
        });
      }
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/feed/${postId}/like`);
      await fetchUserPosts();
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text) return;
    try {
      await api.post(`/feed/${postId}/comment`, { text });
      setCommentText({ ...commentText, [postId]: '' });
      await fetchUserPosts();
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const isLiked = (post: Post) => {
    return post.likes?.some((like: any) => like.user === user?._id);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'کمتر از یک ساعت پیش';
    if (diffInHours < 24) return `${diffInHours} ساعت پیش`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} روز پیش`;
  };

  const getRestaurantLocation = (restaurant: any) => {
    if (!restaurant) return '';
    const parts = restaurant.addressFa?.split('،') || [];
    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : restaurant.addressFa || '';
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
    return null;
  }

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
              <span className="text-accent-500">پروفایل</span>
            </h2>
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
              {profileUser.photoUrl || profileUser.avatar ? (
                <img
                  src={profileUser.photoUrl || profileUser.avatar}
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
              <p className="text-gray-400 text-sm mb-4">
                @{profileUser.username || `user_${profileUser._id?.slice(-6) || ''}` || 'user'}
              </p>
              {userId !== user?._id && (
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isFollowingUser
                      ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                      : 'bg-accent-500 text-white hover:bg-accent-600'
                  }`}
                >
                  {isFollowingUser ? (
                    <span>دنبال شده ✔️</span>
                  ) : (
                    <span>دنبال کن</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 pt-4 border-t border-accent-500/20">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{posts.length}</p>
              <p className="text-xs text-gray-400">پست</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profileUser.followerCount || 0}</p>
              <p className="text-xs text-gray-400">دنبال‌کننده</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profileUser.followingCount || 0}</p>
              <p className="text-xs text-gray-400">دنبال‌شده</p>
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
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 107, 53, 0.05)'
                }}
              >
                {/* Post Header */}
                <div className="p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent-500/20 flex items-center justify-center border-2 border-accent-500/30 flex-shrink-0">
                    {post.user?.photoUrl || post.user?.avatar ? (
                      <img
                        src={post.user.photoUrl || post.user.avatar}
                        alt={getUserDisplayName(post.user)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-accent-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-white">
                        {getUserDisplayName(post.user)}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400">{getTimeAgo(post.createdAt)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4 text-accent-500" />
                      <span className="text-sm text-white">{post.restaurant?.nameFa}</span>
                    </div>
                  </div>
                </div>

                {/* Post Image */}
                {post.imageUrl ? (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                ) : null}

                {/* Post Content */}
                <div className="p-4">
                  <p className="text-white mb-3 leading-relaxed">
                    {post.caption}
                    {post.flavor && <span className="text-green-400"> 🍃</span>}
                  </p>

                  {/* Tags */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <div className="bg-accent-500/25 backdrop-blur-sm border border-accent-500/40 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg" style={{
                      boxShadow: '0 4px 15px rgba(255, 107, 53, 0.2)'
                    }}>
                      <MapPin className="w-4 h-4 text-accent-400" strokeWidth={2.5} />
                      <span className="text-sm font-semibold text-accent-300">{getRestaurantLocation(post.restaurant)}</span>
                    </div>
                    {post.flavor && (
                      <div className="bg-red-500/25 backdrop-blur-sm border border-red-500/40 rounded-full px-4 py-2 shadow-lg" style={{
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
                      }}>
                        <span className="text-sm font-semibold text-red-300">🍃 {post.flavor}</span>
                      </div>
                    )}
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center justify-between pt-4 border-t border-accent-500/10">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-2 transition-all duration-200 px-3 py-2 rounded-lg ${
                        isLiked(post)
                          ? 'text-accent-500 bg-accent-500/10'
                          : 'text-gray-400 hover:text-accent-500 hover:bg-accent-500/5'
                      }`}
                    >
                      <Heart
                        className={`w-6 h-6 transition-transform duration-200 ${
                          isLiked(post)
                            ? 'fill-accent-500 scale-110'
                            : 'hover:scale-110'
                        }`}
                        strokeWidth={2}
                      />
                      <span className="text-sm font-semibold">پسندیدم ({post.likes?.length || 0})</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-accent-500 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-accent-500/5">
                      <MessageCircle className="w-6 h-6 transition-transform duration-200 hover:scale-110" strokeWidth={2} />
                      <span className="text-sm font-semibold">نظر ({post.comments?.length || 0})</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-accent-500/10 space-y-3">
                      {post.comments.map((comment) => (
                        <div key={comment._id} className="bg-dark-200/50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-white mb-1">
                            {getUserDisplayName(comment.user)}
                          </p>
                          <p className="text-sm text-gray-300">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={commentText[post._id] || ''}
                      onChange={(e) =>
                        setCommentText({ ...commentText, [post._id]: e.target.value })
                      }
                      placeholder="نظر بده..."
                      className="input flex-1 text-sm py-2 bg-dark-200/50 border-accent-500/20"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post._id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post._id)}
                      className="bg-accent-500 hover:bg-accent-600 text-dark-300 rounded-lg px-4 py-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
