/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';
import { Toaster } from '@/components/ui/sonner';
import HamsterLoader from '@/components/HamsterLoader';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import OfflineLoader from '@/components/OfflineLoader';
import { WatermarkButton } from '@/components/WatermarkButton';

export default function App() {
  const { user, loading } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-chat-surface p-4">
        <HamsterLoader />
      </div>
    );
  }

  return (
    <ThemeProvider {...({ attribute: "class", defaultTheme: "system", enableSystem: true } as any)}>
      <div className="antialiased font-sans text-[#111b21] dark:text-gray-100 dark:bg-gray-900 min-h-screen">
        {isOffline && <OfflineLoader />}
        {user ? <Dashboard /> : <AuthPage />}
        <Toaster position="top-center" />
        <WatermarkButton />
      </div>
    </ThemeProvider>
  );
}
