import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Trash2, Eye, EyeOff, MessageSquare, Calendar, User, MapPin } from 'lucide-react';

interface Post {
  _id: string;
  caption: string;
  imageUrl: string;
  createdAt: string;
  published: boolean;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username?: string;
    photoUrl?: string;
  };
  restaurant: {
    _id: string;
    nameFa: string;
    addressFa?: string;
  };
  likes: Array<{ user: string }>;
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    text: string;
    commentedAt: string;
    deletedAt?: string;
  }>;
}

export default function Moderation() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'published' | 'hidden'>('all');

  useEffect(() => {
    fetchPosts();
  }, [page, filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/posts', {
        params: {
          page,
          limit: 20,
          published: filter === 'all' ? undefined : filter === 'published'
        }
      });
      setPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error('Fetch posts error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetails = async (postId: string) => {
    try {
      const response = await api.get(`/admin/posts/${postId}`);
      setSelectedPost(response.data);
    } catch (error: any) {
      console.error('Fetch post details error:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این پست را حذف کنید؟')) {
      return;
    }

    try {
      await api.delete(`/admin/posts/${postId}`, {
        data: { reason: 'Admin moderation' }
      });
      fetchPosts();
      if (selectedPost?._id === postId) {
        setSelectedPost(null);
      }
    } catch (error: any) {
      console.error('Delete post error:', error);
      alert('خطا در حذف پست');
    }
  };

  const handleToggleVisibility = async (postId: string, currentPublished: boolean) => {
    try {
      await api.patch(`/admin/posts/${postId}`, {
        published: !currentPublished,
        reason: currentPublished ? 'Hidden by admin' : 'Restored by admin'
      });
      fetchPosts();
      if (selectedPost?._id === postId) {
        setSelectedPost({ ...selectedPost, published: !currentPublished });
      }
    } catch (error: any) {
      console.error('Toggle visibility error:', error);
      alert('خطا در تغییر وضعیت پست');
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این نظر را حذف کنید؟')) {
      return;
    }

    try {
      await api.delete(`/admin/posts/${postId}/comments/${commentId}`, {
        data: { reason: 'Admin moderation' }
      });
      if (selectedPost) {
        fetchPostDetails(selectedPost._id);
      }
    } catch (error: any) {
      console.error('Delete comment error:', error);
      alert('خطا در حذف نظر');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">مدیریت پست‌ها و نظرات</h1>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              همه
            </button>
            <button
              onClick={() => { setFilter('published'); setPage(1); }}
              className={`px-4 py-2 rounded ${filter === 'published' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              منتشر شده
            </button>
            <button
              onClick={() => { setFilter('hidden'); setPage(1); }}
              className={`px-4 py-2 rounded ${filter === 'hidden' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              مخفی شده
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">در حال بارگذاری...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Posts List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">لیست پست‌ها</h2>
              </div>
              <div className="divide-y">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedPost?._id === post._id ? 'bg-blue-50' : ''}`}
                    onClick={() => fetchPostDetails(post._id)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={post.imageUrl || '/placeholder.png'}
                        alt="Post"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2">{post.caption}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.user.firstName} {post.user.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {post.restaurant.nameFa}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {post.comments?.filter(c => !c.deletedAt).length || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(post._id, post.published);
                            }}
                            className={`px-2 py-1 text-xs rounded ${
                              post.published
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {post.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post._id);
                            }}
                            className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {posts.length === 0 && (
                <div className="p-8 text-center text-gray-500">پستی یافت نشد</div>
              )}
              {totalPages > 1 && (
                <div className="p-4 border-t flex justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  <span className="px-4 py-2">
                    صفحه {page} از {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
                  >
                    بعدی
                  </button>
                </div>
              )}
            </div>

            {/* Post Details */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">جزئیات پست</h2>
              </div>
              {selectedPost ? (
                <div className="p-4">
                  <img
                    src={selectedPost.imageUrl}
                    alt="Post"
                    className="w-full h-64 object-cover rounded mb-4"
                  />
                  <p className="text-gray-900 mb-4">{selectedPost.caption}</p>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{selectedPost.user.firstName} {selectedPost.user.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedPost.restaurant.nameFa}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedPost.createdAt)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">نظرات ({selectedPost.comments?.filter(c => !c.deletedAt).length || 0})</h3>
                    <div className="space-y-3">
                      {selectedPost.comments
                        ?.filter(c => !c.deletedAt)
                        .map((comment) => (
                          <div key={comment._id} className="p-3 bg-gray-50 rounded">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {comment.user.firstName} {comment.user.lastName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(comment.commentedAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.text}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteComment(selectedPost._id, comment._id)}
                                className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {(!selectedPost.comments || selectedPost.comments.filter(c => !c.deletedAt).length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">نظری وجود ندارد</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  یک پست را برای مشاهده جزئیات انتخاب کنید
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
