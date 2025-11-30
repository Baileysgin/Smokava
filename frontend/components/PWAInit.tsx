'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa';
import AddToHomePrompt from './AddToHomePrompt';

export default function PWAInit() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <AddToHomePrompt />;
}

