import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'magobo_session_token';

/**
 * The session token is the mobile equivalent of the web's httpOnly
 * cookie — it must never be persisted in plain AsyncStorage/JS-readable
 * storage. `expo-secure-store` backs onto the OS Keychain (iOS) /
 * Keystore-encrypted prefs (Android).
 */
export async function saveSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}
