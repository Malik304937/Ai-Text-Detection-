import { Capacitor } from '@capacitor/core';

const STORAGE_KEY_API_URL = 'ai_text_detective_custom_api_url';

// Default cloud backend URL for native Android APK connections
export const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  'https://ais-dev-fjbzq2mqzm6nhkiqf6u2a2-286157781165.asia-southeast1.run.app';

export function getCustomApiUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_API_URL) || '';
  } catch {
    return '';
  }
}

export function setCustomApiUrl(url: string): void {
  try {
    if (!url.trim()) {
      localStorage.removeItem(STORAGE_KEY_API_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_API_URL, url.trim().replace(/\/+$/, ''));
    }
  } catch (e) {
    console.error('Failed to set custom API url:', e);
  }
}

export function getApiEndpoint(endpointPath: string): string {
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;

  // If running as native Android/iOS Capacitor app
  if (Capacitor.isNativePlatform()) {
    const custom = getCustomApiUrl();
    if (custom) {
      return `${custom}${cleanPath}`;
    }
    return `${DEFAULT_BACKEND_URL}${cleanPath}`;
  }

  // Web platform: use relative path so it hits the same origin
  const custom = getCustomApiUrl();
  if (custom) {
    return `${custom}${cleanPath}`;
  }
  return cleanPath;
}

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}
