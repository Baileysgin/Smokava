'use client';

import { SmokeBackground } from './spooky-smoke-animation';

interface SmokeBackgroundWrapperProps {
  children: React.ReactNode;
  smokeColor?: string;
  className?: string;
}

/**
 * Wrapper component that adds a smoke background behind children
 * Use this to wrap page content for a full-screen animated smoke effect
 */
export const SmokeBackgroundWrapper: React.FC<SmokeBackgroundWrapperProps> = ({
  children,
  smokeColor = "#808080",
  className = "",
}) => {
  return (
    <div className={`relative min-h-screen w-full ${className}`}>
      <SmokeBackground smokeColor={smokeColor} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
