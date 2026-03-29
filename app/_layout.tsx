import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import { NotificationsProvider } from '@/lib/NotificationsContext';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

export {
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme('dark');
  }, []);

  return (
    <FavoritesProvider>
      <NotificationsProvider>
        <ThemeProvider value={NAV_THEME['dark']}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
          <PortalHost />
        </ThemeProvider>
      </NotificationsProvider>
    </FavoritesProvider>
  );
}
