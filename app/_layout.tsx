import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import { NotificationsProvider } from '@/lib/NotificationsContext';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/useAuthStore';

export {
  ErrorBoundary,
} from 'expo-router';

const queryClient = new QueryClient();

function useProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    // Используем setTimeout чтобы убедиться, что Root_layout срендерен и навигация доступна
    if (!token && !inAuthGroup) {
      setTimeout(() => router.replace('/(auth)/login'), 0);
    } else if (token && inAuthGroup) {
      setTimeout(() => router.replace('/'), 0);
    }
  }, [token, segments]);
}

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  
  useProtectedRoute();

  useEffect(() => {
    setColorScheme('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        <NotificationsProvider>
          <ThemeProvider value={NAV_THEME['dark']}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
            <PortalHost />
          </ThemeProvider>
        </NotificationsProvider>
      </FavoritesProvider>
    </QueryClientProvider>
  );
}
