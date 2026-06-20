import { ClerkProvider, ClerkLoaded } from '@clerk/expo';
import { tokenCache } from '@/lib/token-cache';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={Platform.OS !== 'web' ? tokenCache : undefined}>
          <ClerkLoaded>
            <QueryClientProvider client={queryClient}>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="sign-in" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="nation/[code]" options={{ headerShown: false }} />
                <Stack.Screen name="discussions" options={{ headerShown: false }} />
                <Stack.Screen name="discussion/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
              </Stack>
            </QueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
