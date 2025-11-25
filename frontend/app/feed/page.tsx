'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, MapPin, Send, Plus, User, Image as ImageIcon, Upload, X, ArrowRight, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
// HEIC conversion will be dynamically imported

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, user, following, fetchFollowing, followUser, syncTelegramContacts } = useAuthStore();
  const { posts, loading, fetchPosts, createPost, toggleLike, addComment, deletePost, showFollowingOnly, setShowFollowingOnly } = useFeedStore();
  const { restaurants, fetchRestaurants } = useRestaurantStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [restaurantId, setRestaurantId] = useState('');
  const [flavor, setFlavor] = useState('');
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    // Fetch posts based on current filter (following only or specific user)
    if (selectedUserId) {
      // Fetch posts for specific user
      fetchPosts(false, selectedUserId);
    } else {
      fetchPosts(showFollowingOnly, user?._id);
    }
    fetchRestaurants();
    fetchFollowing();

    // Sync Telegram contacts if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      // Request contacts access
      tg.requestContact((granted) => {
        if (granted && tg.initDataUnsafe?.user) {
          // In a real app, you would get contacts from Telegram
          // For now, we'll just sync with existing users
          syncTelegramContacts([]).then(setContacts).catch(console.error);
        }
      });
    }
  }, [isAuthenticated, router, fetchPosts, fetchRestaurants, fetchFollowing, showFollowingOnly, selectedUserId, user?._id, syncTelegramContacts]);

  const isHeicFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    return fileName.endsWith('.heic') ||
           fileName.endsWith('.heif') ||
           mimeType === 'image/heic' ||
           mimeType === 'image/heif';
  };

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      // Dynamically import heic2any to avoid SSR issues
      const heic2any = await import('heic2any');
      const convert = heic2any.default || heic2any.convert || (heic2any as any).default?.convert;

      if (!convert) {
        throw new Error('heic2any convert function not found');
      }

      console.log('Starting HEIC conversion...', { fileName: file.name, fileSize: file.size });

      const convertedBlob = await convert({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });

      console.log('HEIC conversion result:', convertedBlob);

      // convert returns an array, get the first item
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

      if (!blob) {
        throw new Error('Conversion returned empty result');
      }

      const newFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      console.log('HEIC conversion successful:', { originalSize: file.size, newSize: newFile.size });
      return newFile;
    } catch (error: any) {
      console.error('HEIC conversion error details:', {
        error,
        message: error?.message,
        stack: error?.stack,
        fileName: file.name
      });
      throw new Error(`HEIC conversion failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      try {
        let fileToProcess = file;

        // Convert HEIC to JPEG if needed
        if (isHeicFile(file)) {
          try {
            console.log('Converting HEIC file...');
            fileToProcess = await convertHeicToJpeg(file);
            setImageFile(fileToProcess);
            console.log('HEIC conversion successful');
          } catch (error: any) {
            console.error('HEIC conversion failed:', error);
            // Fallback: try to use HEIC file directly (backend will need to handle it)
            // For now, show warning but allow upload
            console.warn('HEIC conversion failed, using original file. Backend should handle conversion.');
            // Continue with original HEIC file - backend can handle it or user can convert manually
            fileToProcess = file;
          }
        }

        // Compress image to reduce size (skip compression for HEIC if conversion failed)
        if (isHeicFile(file) && fileToProcess === file) {
          // HEIC conversion failed, use original file directly
          console.log('Using HEIC file directly without compression');
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          // Compress image to reduce size
          const compressedImage = await compressImage(fileToProcess);
          setImagePreview(compressedImage);
        }
      } catch (error: any) {
        console.error('Image processing error:', error);
        // Fallback to original if processing fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleCreatePost = async () => {
    if (!restaurantId || !caption || !imagePreview) {
      alert('لطفا تمام فیلدهای الزامی (رستوران، متن و عکس) را پر کنید');
      return;
    }
    try {
      await createPost(restaurantId, flavor, caption, imagePreview);
      setShowCreateModal(false);
      setRestaurantId('');
      setFlavor('');
      setCaption('');
      setImageFile(null);
      setImagePreview(null);
      // Refresh posts to show the new one
      fetchPosts(showFollowingOnly, user?._id);
    } catch (error: any) {
      console.error('Create post error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'خطایی در ایجاد پست رخ داد';
      alert(errorMessage);
    }
  };

  const handleLike = async (postId: string) => {
    await toggleLike(postId);
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text) return;
    try {
      await addComment(postId, text);
      setCommentText({ ...commentText, [postId]: '' });
    } catch (error) {
      alert('خطایی رخ داد');
    }
  };

  const isLiked = (post: any) => {
    return post.likes?.some((like: any) => like.user === user?._id);
  };

  const isFollowing = (userId: string) => {
    return following.some((followedUser: any) => followedUser._id === userId);
  };

  const handleFollow = async (userId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent triggering profile click
    if (!userId || userId === user?._id) return;
    try {
      await followUser(userId);
      // Refresh following list
      await fetchFollowing();
      // Refresh posts if showing following only
      if (showFollowingOnly) {
        fetchPosts(showFollowingOnly, user?._id);
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleProfileClick = (userId: string) => {
    if (userId === user?._id) {
      // Navigate to own profile
      router.push('/profile');
    } else {
      // Navigate to user profile page
      router.push(`/user/${userId}`);
    }
  };

  const handleBackToFeed = () => {
    setSelectedUserId(null);
    fetchPosts(showFollowingOnly, user?._id);
  };

  const handleDeletePost = async () => {
    if (!deleteConfirmPostId) return;
    setDeleting(true);
    try {
      await deletePost(deleteConfirmPostId);
      setDeleteConfirmPostId(null);
    } catch (error: any) {
      console.error('Delete post error:', error);
      alert(error.response?.data?.message || 'خطا در حذف پست');
    } finally {
      setDeleting(false);
    }
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
    // Extract city/area from address
    const parts = restaurant.addressFa?.split('،') || [];
    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : restaurant.addressFa || '';
  };

  return (
    <div className="min-h-screen bg-dark-300 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-300/98 backdrop-blur-xl border-b border-accent-500/30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Top Row: Feed on LEFT, Logo on RIGHT */}
          <div className="flex items-center justify-between" dir="ltr">
            <div className="flex items-center gap-3 flex-1">
              {selectedUserId && (
                <button
                  onClick={handleBackToFeed}
                  className="p-1.5 hover:bg-dark-100/50 rounded-lg transition-colors -mr-1"
                >
                  <ArrowRight className="w-5 h-5 text-white rotate-180" />
                </button>
              )}
              <h2 className="text-xl font-bold">
                <span className="text-accent-500">Feed</span>
              </h2>
              {!selectedUserId && (
                <button
                  onClick={() => {
                    const newValue = !showFollowingOnly;
                    setShowFollowingOnly(newValue);
                    fetchPosts(newValue, user?._id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ml-auto ${
                    showFollowingOnly
                      ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                      : 'bg-dark-100/80 text-gray-400 border border-accent-500/20 hover:border-accent-500/40 hover:text-accent-400'
                  }`}
                >
                  {showFollowingOnly ? 'همه پست‌ها' : 'فقط دنبال‌شده‌ها'}
                </button>
              )}
            </div>
            <div className="flex-shrink-0 ml-3">
              <Logo variant="icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {selectedUserId && posts.length > 0 && (
          <div className="mb-4 pb-4 border-b border-accent-500/20">
            <p className="text-sm text-gray-400 text-center">
              نمایش پست‌های{' '}
              <span className="text-accent-400 font-semibold">
                {posts[0]?.user?.firstName && posts[0]?.user?.lastName
                  ? `${posts[0].user.firstName} ${posts[0].user.lastName}`.trim()
                  : posts[0]?.user?.firstName || posts[0]?.user?.lastName || posts[0]?.user?.name || posts[0]?.user?.username || `User_${posts[0]?.user?._id?.slice(-6) || ''}`}
              </span>
            </p>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 text-gray-400">در حال بارگذاری...</div>
        ) : posts.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-accent-500/20 rounded-3xl p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">هنوز پستی وجود ندارد</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-l from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-dark-300 rounded-xl py-3 px-6 font-semibold transition-all duration-200"
            >
              اولین پست را ایجاد کنید
            </button>
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
                <div className="p-4 flex items-start gap-3 relative">
                  <button
                    onClick={() => post.user?._id && handleProfileClick(post.user._id)}
                    className="w-12 h-12 rounded-full bg-accent-500/20 flex items-center justify-center border-2 border-accent-500/30 flex-shrink-0 hover:border-accent-500/60 transition-colors cursor-pointer"
                  >
                    {post.user?.photoUrl || post.user?.avatar ? (
                      <img
                        src={post.user.photoUrl || post.user.avatar}
                        alt={post.user.firstName || post.user.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-accent-500" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <button
                        onClick={() => post.user?._id && handleProfileClick(post.user._id)}
                        className="text-right hover:text-accent-400 transition-colors"
                      >
                        <h3 className="font-bold text-white">
                          {post.user?.firstName && post.user?.lastName
                            ? `${post.user.firstName} ${post.user.lastName}`.trim()
                            : post.user?.firstName || post.user?.lastName || post.user?.name || post.user?.username || `User_${post.user?._id?.slice(-6) || ''}`}
                        </h3>
                      </button>
                      <div className="flex items-center gap-2">
                        {post.user?._id && post.user._id !== user?._id && (
                          <button
                            onClick={(e) => handleFollow(post.user._id, e)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              isFollowing(post.user._id)
                                ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                                : 'bg-accent-500 text-white hover:bg-accent-600'
                            }`}
                          >
                            {isFollowing(post.user._id) ? (
                              <span>دنبال شده ✔️</span>
                            ) : (
                              <span>دنبال کن</span>
                            )}
                          </button>
                        )}
                        {/* Delete Button - Only show for post owner */}
                        {post.user?._id === user?._id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmPostId(post._id);
                            }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            title="حذف پست"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
                ) : (
                  <div className="relative h-64 bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                    <ImageIcon className="w-12 h-12 text-gray-600 relative z-0" />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-4">
                  <p className="text-white mb-3 leading-relaxed">
                    {post.caption}
                    {post.flavor && <span className="text-green-400"> 🍃</span>}
                  </p>

                  {/* Tags - Enhanced Readability */}
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

                  {/* Engagement - Enhanced Visual Strength */}
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
                            {comment.user?.firstName && comment.user?.lastName
                              ? `${comment.user.firstName} ${comment.user.lastName}`.trim()
                              : comment.user?.firstName || comment.user?.lastName || comment.user?.name || comment.user?.username || `User_${comment.user?._id?.slice(-6) || ''}`}
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

      {/* Create Post Button - Premium Styling */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 premium-accent text-dark-300 rounded-full p-5 shadow-2xl transition-all duration-300 z-40 hover:scale-110"
        style={{
          boxShadow: '0 8px 30px rgba(255, 107, 53, 0.5)'
        }}
      >
        <Plus className="w-7 h-7" strokeWidth={3} />
      </button>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-dark-200 border border-accent-500/30 rounded-3xl p-6 max-w-md w-full my-4 max-h-[90vh] flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-accent-500 flex-shrink-0">پست جدید</h2>
            <div className="space-y-5 overflow-y-auto flex-1 pr-2">
              <div>
                <label className="block text-sm font-semibold mb-3 text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent-500" />
                  <span>رستوران</span>
                  <span className="text-red-400 text-xs">*</span>
                </label>
                <select
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="input bg-dark-100 border-accent-500/30 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30"
                  required
                >
                  <option value="">انتخاب رستوران...</option>
                  {restaurants.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.nameFa}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">این پست به شبکه رستوران‌های همکار متصل می‌شود</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                  <span>🍃</span>
                  <span>طعم</span>
                  <span className="text-gray-500 text-xs">(اختیاری)</span>
                </label>
                <input
                  type="text"
                  value={flavor}
                  onChange={(e) => setFlavor(e.target.value)}
                  placeholder="مثل: دو سیب، نعنا و..."
                  className="input bg-dark-100 border-accent-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-300">متن پست</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="حس و حال خودت رو بنویس... ✨"
                  className="input bg-dark-100 border-accent-500/20 min-h-[120px] resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-accent-500" />
                  <span>عکس</span>
                  <span className="text-red-400 text-xs">*</span>
                </label>
                {!imagePreview ? (
                  <label className="block">
                    <div className="border-2 border-dashed border-accent-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-accent-500/50 transition-colors bg-dark-100/50">
                      <Upload className="w-8 h-8 text-accent-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-300 mb-1">عکس را انتخاب کنید</p>
                      <p className="text-xs text-gray-500">PNG, JPG, HEIC و سایر فرمت‌های تصویری</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={handleImageSelect}
                      className="hidden"
                      required
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-xl border-2 border-accent-500/30"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">عکس برای پست الزامی است</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6 flex-shrink-0 pt-4 border-t border-accent-500/20">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setRestaurantId('');
                    setFlavor('');
                    setCaption('');
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreatePost}
                  className="bg-gradient-to-l from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-dark-300 rounded-xl py-3 px-6 font-semibold transition-all duration-200 flex-1"
                >
                  انتشار
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPostId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-dark-200 border border-accent-500/30 rounded-3xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">حذف پست</h3>
                <p className="text-sm text-gray-400">این عمل قابل بازگشت نیست</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              آیا مطمئن هستید که می‌خواهید این پست را حذف کنید؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmPostId(null)}
                disabled={deleting}
                className="flex-1 bg-dark-100 hover:bg-dark-100/80 text-white border border-accent-500/30 rounded-xl py-3 px-4 font-semibold transition-all duration-200 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleDeletePost}
                disabled={deleting}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl py-3 px-4 font-semibold transition-all duration-200 disabled:opacity-50"
              >
                {deleting ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
