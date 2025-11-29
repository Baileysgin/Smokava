'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { usePackageStore } from '@/store/packageStore';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  operatorId?: string;
  packageId?: string;
  redeemLogId: string;
  isGift?: boolean;
  restaurantName?: string;
}

export default function RatingModal({
  isOpen,
  onClose,
  restaurantId,
  operatorId,
  packageId,
  redeemLogId,
  isGift = false,
  restaurantName = 'رستوران'
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { submitRating } = usePackageStore();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('لطفا امتیاز خود را انتخاب کنید');
      return;
    }

    setSubmitting(true);
    try {
      await submitRating({
        restaurantId,
        operatorId,
        packageId,
        redeemLogId,
        rating,
        isGift
      });
      alert('امتیاز شما با موفقیت ثبت شد');
      setRating(0);
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'خطا در ثبت امتیاز');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-dark-200 border-2 border-accent-500/40 rounded-3xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2 text-white text-center">
          تجربه شما از این قلیون چطور بود؟
        </h2>
        <p className="text-gray-400 text-center mb-6 text-sm">
          {restaurantName}
        </p>

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-12 h-12 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-600'
                } transition-colors`}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-dark-100 hover:bg-dark-50 text-white rounded-xl py-3 font-semibold transition-all"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex-1 bg-gradient-to-l from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-dark-300 rounded-xl py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'در حال ثبت...' : 'ثبت امتیاز'}
          </button>
        </div>
      </div>
    </div>
  );
}
