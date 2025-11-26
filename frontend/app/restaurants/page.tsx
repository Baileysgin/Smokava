'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MapPin, Star, Cigarette, Navigation } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import BottomNav from '@/components/BottomNav';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function RestaurantsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { restaurants, loading, fetchRestaurants } = useRestaurantStore();
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    fetchRestaurants();
  }, [isAuthenticated, router, fetchRestaurants]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center pb-20">
        <p className="text-gray-400">در حال بارگذاری...</p>
        <BottomNav />
      </div>
    );
  }

  if (showMap) {
    return (
      <div className="min-h-screen bg-dark-300 pb-20">
        <div className="sticky top-0 z-10 bg-dark-300/95 backdrop-blur-lg border-b border-accent-500/20 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-accent-500">رستوران‌های همکار</h2>
            <button
              onClick={() => setShowMap(false)}
              className="btn-secondary text-xs sm:text-sm px-3 py-2"
            >
              نمایش لیست
            </button>
          </div>
        </div>
        <div className="h-[calc(100vh-100px)]">
          <MapView restaurants={restaurants} />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'transparent' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-accent-500/20 p-4" style={{ backgroundColor: 'rgba(15, 15, 15, 0.7)' }}>
        <h2 className="text-2xl font-bold text-accent-500 text-center mb-1">
          رستوران‌های همکار
        </h2>
        <p className="text-center text-gray-400 text-sm">{restaurants.length} رستوران در نزدیکی شما</p>
      </div>

      {/* Map View Button */}
      <div className="px-4 py-4">
        <button
          onClick={() => setShowMap(true)}
          className="w-full border-2 border-accent-500/30 bg-accent-500/10 hover:bg-accent-500/20 text-accent-500 rounded-2xl py-6 flex items-center justify-center gap-2 transition-colors duration-200 font-semibold"
        >
          <Navigation className="w-5 h-5" />
          نمایش روی نقشه
        </button>
      </div>

      {/* Restaurant List */}
      <div className="px-4 space-y-4 pb-4">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant._id}
            className="bg-dark-100 border border-accent-500/20 rounded-3xl overflow-hidden hover:border-accent-500/40 transition-all duration-300"
          >
            {/* Image */}
            <div className="relative h-48">
              <img
                src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'}
                alt={restaurant.nameFa}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                {restaurant.popular && (
                  <span className="bg-accent-500 text-dark-300 px-3 py-1 rounded-full text-xs font-bold border-0">
                    محبوب
                  </span>
                )}
                {restaurant.accepted && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold border-0">
                    پذیرنده پکیج
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-1 text-white">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{restaurant.distance || 'نزدیک'}</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white mb-1 font-bold text-lg">{restaurant.nameFa}</h3>
                  <p className="text-gray-400 text-sm">{restaurant.addressFa}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent-500 text-accent-500" />
                  <span className="text-white font-semibold">{restaurant.rating || 4.5}</span>
                  <span className="text-gray-500 text-sm">({restaurant.reviews || 0})</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Cigarette className="w-4 h-4" />
                  <span className="text-sm">{restaurant.flavors || 10} طعم متنوع</span>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-l from-accent-500 to-gold-600 hover:from-gold-600 hover:to-accent-500 text-dark-300 rounded-xl py-3 font-semibold transition-all duration-200"
              >
                مشاهده منو و رزرو
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
