'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/Logo';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed');
    } else {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Logo className="mb-4" />
        <p className="text-gray-400">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
