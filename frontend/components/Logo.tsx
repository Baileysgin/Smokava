'use client';

import { useState, useEffect } from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

// Logo file formats to try (in order)
// Will try all common variations and case-insensitive matches
const LOGO_FORMATS = [
  '/logo-icon.svg',  // Try SVG first (exists in public folder)
  '/logo.svg',       // Fallback to logo.svg
  '/logo-icon.webp',
  '/logo-icon.png',
  '/logo.webp',
  '/logo.svg',
  '/logo.png',
  '/Logo-Icon.webp',
  '/Logo-Icon.svg',
  '/Logo-Icon.png',
  '/Logo.webp',
  '/Logo.svg',
  '/Logo.png',
  '/LOGO.webp',
  '/LOGO.svg',
  '/LOGO.png',
  '/smokava-icon.webp',
  '/smokava-icon.svg',
  '/smokava-icon.png',
  '/smokava.webp',
  '/smokava.svg',
  '/smokava.png',
  '/Smokava-icon.webp',
  '/Smokava-icon.svg',
  '/Smokava-icon.png',
  '/Smokava.webp',
  '/Smokava.svg',
  '/Smokava.png',
  '/SMOKAVA.webp',
  '/SMOKAVA.svg',
  '/SMOKAVA.png',
  '/logo-icon.jpg',
  '/logo.jpg',
  '/Logo.jpg',
  '/smokava.jpg',
  '/Smokava.jpg'
];

// Fallback icon component (hookah/hose icon representation)
const FallbackIcon = ({ size = 48 }: { size?: number }) => {
  const gradientId1 = `purpleGradient-${size}`;
  const gradientId2 = `orangeGradient-${size}`;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Hookah base */}
        <ellipse
          cx="24"
          cy="36"
          rx="8"
          ry="4"
          fill={`url(#${gradientId1})`}
        />
        {/* Hookah stem */}
        <rect
          x="22"
          y="18"
          width="4"
          height="18"
          fill={`url(#${gradientId1})`}
        />
        {/* Bowl */}
        <circle
          cx="24"
          cy="16"
          r="3"
          fill={`url(#${gradientId1})`}
        />
        {/* Smoke */}
        <path
          d="M24 13 Q26 11 28 13 Q26 15 24 13"
          fill={`url(#${gradientId1})`}
          opacity="0.6"
        />
        {/* Hose */}
        <path
          d="M28 18 Q32 22 32 26 Q30 24 28 22"
          stroke={`url(#${gradientId1})`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Mouthpiece */}
        <circle
          cx="32"
          cy="26"
          r="2"
          fill={`url(#${gradientId2})`}
        />
        {/* Tongs */}
        <path
          d="M22 14 L18 10 M26 14 L30 10"
          stroke={`url(#${gradientId2})`}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={gradientId1} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d1b4e" />
            <stop offset="100%" stopColor="#8e24aa" />
          </linearGradient>
          <linearGradient id={gradientId2} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#ff7b47" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default function Logo({ variant = 'full', className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(true);
  const [imgSrc, setImgSrc] = useState(LOGO_FORMATS[0]);

  useEffect(() => {
    // Start with first format and try to load
    setImgSrc(LOGO_FORMATS[0]);
    setImageError(false); // Start as false, let onError/onLoad determine the actual state

    // Check if any logo file exists by trying to load the first one
    const checkLogo = () => {
      const img = new Image();
      let triedIndex = 0;

      const tryNext = () => {
        if (triedIndex < LOGO_FORMATS.length) {
          img.onload = () => {
            setImgSrc(LOGO_FORMATS[triedIndex]);
            setImageError(false);
          };
          img.onerror = () => {
            triedIndex++;
            if (triedIndex < LOGO_FORMATS.length) {
              img.src = LOGO_FORMATS[triedIndex];
            } else {
              setImageError(true);
            }
          };
          img.src = LOGO_FORMATS[triedIndex];
        }
      };

      tryNext();
    };

    checkLogo();
  }, []);

  if (variant === 'icon') {
    // For header: Display the actual logo image with fallback
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ minWidth: '40px', minHeight: '40px' }}>
        <img
          key={`logo-${imgSrc}`}
          src={imgSrc}
          alt="Smokava Logo"
          width={40}
          height={40}
          className="h-10 w-auto object-contain max-h-10"
          style={{ display: imageError ? 'none' : 'block' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const currentIndex = LOGO_FORMATS.indexOf(imgSrc);
            if (currentIndex < LOGO_FORMATS.length - 1) {
              // Try next format
              const nextSrc = LOGO_FORMATS[currentIndex + 1];
              setImgSrc(nextSrc);
              // Keep imageError true until we find a working image
            } else {
              // All formats failed, hide image and show fallback
              target.style.display = 'none';
              setImageError(true);
            }
          }}
          onLoad={() => {
            // Image loaded successfully!
            setImageError(false);
          }}
        />
        {imageError && (
          <div className="h-10 w-10 flex items-center justify-center flex-shrink-0 absolute inset-0 pointer-events-none">
            <span className="text-accent-500 font-bold text-xl">S</span>
          </div>
        )}
      </div>
    );
  }

  if (imageError) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <FallbackIcon size={80} />
        <h1 className="text-3xl font-bold text-white lowercase tracking-tight">
          smokava
        </h1>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <img
        src="/logo-icon.svg"
        alt="Smokava Logo"
        width={80}
        height={80}
        className="w-20 h-20 object-contain"
        onError={() => setImageError(true)}
      />
      <h1 className="text-3xl font-bold text-white lowercase tracking-tight">
        smokava
      </h1>
    </div>
  );
}
