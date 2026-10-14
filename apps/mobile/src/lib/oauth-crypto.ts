import { Platform } from 'react-native';
import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';

// Supabase uses WebCrypto for PKCE. Hermes may expose only part of that API.
// Fill only the missing methods needed for S256; never fall back to Math.random/plain.
export function prepareOAuthCrypto() {
  if (Platform.OS === 'web') return;
  if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
  if (!globalThis.crypto.getRandomValues) Object.defineProperty(globalThis.crypto, 'getRandomValues', { value: getRandomValues, configurable: true });
  if (!globalThis.crypto.subtle) Object.defineProperty(globalThis.crypto, 'subtle', { value: {}, configurable: true });
  if (!globalThis.crypto.subtle.digest) Object.defineProperty(globalThis.crypto.subtle, 'digest', { value: (algorithm: string, data: BufferSource) => {
    if (algorithm !== 'SHA-256') throw new Error('Unsupported digest');
    return digest(CryptoDigestAlgorithm.SHA256, data);
  }, configurable: true });
}
