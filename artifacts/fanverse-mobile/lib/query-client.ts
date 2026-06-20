import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    if (/^\d+-/.test(hostname)) {
      const apiHost = hostname.replace(/^\d+-/, '8080-');
      return `${protocol}//${apiHost}`;
    }
    return 'http://localhost:8080';
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
}

export function apiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});
