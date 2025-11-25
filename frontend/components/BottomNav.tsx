'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Wallet, Package, MapPin } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/feed', icon: Home, label: 'خانه' },
    { href: '/restaurants', icon: MapPin, label: 'رستوران‌ها' },
    { href: '/packages', icon: Package, label: 'پکیج‌ها' },
    { href: '/wallet', icon: Wallet, label: 'کیف پول' },
    { href: '/profile', icon: User, label: 'پروفایل' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-200/95 backdrop-blur-lg border-t border-accent-500/20 z-50">
      <div className="flex justify-around items-center px-2 py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/feed' && pathname === '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[60px] ${
                isActive
                  ? 'bg-accent-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-accent-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
