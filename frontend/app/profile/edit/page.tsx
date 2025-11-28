'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';
// HEIC conversion will be dynamically imported

export default function ProfileEditPage() {
  const router = useRouter();
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (user) {
      setPhotoUrl(user.photoUrl || user.avatar || '');
      setUsername(user.username || '');
      setBio((user as any).bio || '');
      if (user.photoUrl || user.avatar) {
        setImagePreview(user.photoUrl || user.avatar || '');
      }
    }
  }, [isAuthenticated, router, user]);

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
      const convert = (heic2any as any).default || heic2any;

      if (!convert || typeof convert !== 'function') {
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
      // Validate file type (accept any image, including HEIC)
      if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
        setErrors({ ...errors, photo: 'فقط فایل‌های تصویری مجاز هستند' });
        return;
      }
      setImageFile(file);
      setErrors({ ...errors, photo: '' });
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
            // Fallback: use HEIC file directly
            console.warn('HEIC conversion failed, using original file');
            fileToProcess = file;
            setErrors({ ...errors, photo: 'تبدیل HEIC انجام نشد. فایل به صورت اصلی استفاده می‌شود.' });
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
        setErrors({ ...errors, photo: 'خطا در پردازش تصویر' });
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
    setImagePreview(photoUrl);
  };

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) {
      return 'شناسه کاربری الزامی است';
    }
    if (/\s/.test(value)) {
      return 'شناسه کاربری نمی‌تواند فاصله داشته باشد';
    }
    if (!/^[A-Za-z0-9_]+$/.test(value)) {
      return 'شناسه کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و خط زیر باشد';
    }
    return null;
  };

  const handleSave = async () => {
    if (!user?._id) return;

    setLoading(true);
    setErrors({});

    // Validate username
    const usernameError = validateUsername(username);
    if (usernameError) {
      setErrors({ username: usernameError });
      setLoading(false);
      return;
    }

    // Validate bio length
    if (bio.length > 200) {
      setErrors({ bio: 'بیوگرافی نمی‌تواند بیشتر از 200 کاراکتر باشد' });
      setLoading(false);
      return;
    }

    try {
      // Upload photo if changed
      if (imageFile && imagePreview) {
        try {
          await api.patch(`/users/${user._id}/profile-photo`, {
            photoUrl: imagePreview
          });
        } catch (error: any) {
          setErrors({ photo: error.response?.data?.message || 'خطا در آپلود عکس' });
          setLoading(false);
          return;
        }
      }

      // Update username if changed
      if (username !== (user.username || '')) {
        try {
          await api.patch(`/users/${user._id}/username`, { username });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'خطا در به‌روزرسانی شناسه کاربری';
          setErrors({ username: errorMsg });
          setLoading(false);
          return;
        }
      }

      // Update bio if changed
      if (bio !== ((user as any).bio || '')) {
        try {
          await api.patch(`/users/${user._id}/bio`, { bio });
        } catch (error: any) {
          setErrors({ bio: error.response?.data?.message || 'خطا در به‌روزرسانی بیوگرافی' });
          setLoading(false);
          return;
        }
      }

      // Refresh user data
      const userResponse = await api.get(`/users/${user._id}`);
      await updateUser(userResponse.data);

      // Show success and navigate back
      alert('تغییرات با موفقیت ذخیره شد');
      router.push('/profile');
    } catch (error: any) {
      console.error('Save error:', error);
      alert('خطایی در ذخیره تغییرات رخ داد');
    } finally {
      setLoading(false);
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
              <span className="text-accent-500">ویرایش پروفایل</span>
            </h2>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Photo */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-white">عکس پروفایل</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full border-2 border-accent-500 overflow-hidden flex-shrink-0 relative" style={{
              boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)'
            }}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-500/30 to-accent-600/20 flex items-center justify-center">
                  <User className="w-12 h-12 text-accent-400" strokeWidth={2} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block">
                <div className="border-2 border-dashed border-accent-500/30 rounded-xl p-4 text-center cursor-pointer hover:border-accent-500/50 transition-colors bg-dark-100/50">
                  <Upload className="w-6 h-6 text-accent-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-300 mb-1">تغییر عکس پروفایل</p>
                  <p className="text-xs text-gray-500">PNG, JPG, HEIC و سایر فرمت‌های تصویری</p>
                </div>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <button
                  onClick={removeImage}
                  className="mt-2 text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>حذف عکس جدید</span>
                </button>
              )}
              {errors.photo && (
                <p className="text-xs text-red-400 mt-2">{errors.photo}</p>
              )}
            </div>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-white">
            شناسه کاربری (ID)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors({ ...errors, username: '' });
            }}
            placeholder="مثال: user_ali"
            className="input w-full bg-dark-100 border-accent-500/30 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30"
          />
          {errors.username && (
            <p className="text-xs text-red-400 mt-2">{errors.username}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            فقط حروف انگلیسی، اعداد و خط زیر مجاز است
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-white">
            بیوگرافی
          </label>
          <textarea
            value={bio}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setBio(e.target.value);
                setErrors({ ...errors, bio: '' });
              }
            }}
            placeholder="درباره خودتان بنویسید..."
            rows={4}
            maxLength={200}
            className="input w-full bg-dark-100 border-accent-500/30 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            {errors.bio && (
              <p className="text-xs text-red-400">{errors.bio}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {bio.length}/200
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gradient-to-l from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-dark-300 rounded-xl py-3 px-6 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
