import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** مفتاح API مع تسمية */
export interface ApiKeyEntry {
  id: string;
  providerId: string;
  label: string;
  key: string;
  createdAt: string;
}

/** توكنات API للاستخدام الخارجي */
export interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsed?: string;
  permissions: ('chat' | 'compare' | 'pipeline' | 'agents' | 'dialogue')[];
}

/** مخزن مفاتيح API وتوكنات الوصول */
interface ApiKeyStore {
  /** مفاتيح API المتعددة لكل مزود */
  apiKeys: ApiKeyEntry[];
  tokens: ApiToken[];

  // مفاتيح API
  addApiKey: (providerId: string, label: string, key: string) => ApiKeyEntry;
  removeApiKey: (keyId: string) => void;
  getApiKey: (keyId: string) => ApiKeyEntry | undefined;
  getKeysByProvider: (providerId: string) => ApiKeyEntry[];
  getActualKey: (keyId: string) => string | undefined;

  // توكنات
  addToken: (token: ApiToken) => void;
  removeToken: (tokenId: string) => void;
  updateTokenLastUsed: (tokenId: string) => void;

  // --- Legacy compatibility ---
  /** @deprecated use apiKeys */
  keys: Record<string, string>;
  /** @deprecated */
  setKey: (providerId: string, key: string) => void;
  /** @deprecated */
  removeKey: (providerId: string) => void;
  /** @deprecated */
  getKey: (providerId: string) => string | undefined;
  /** @deprecated */
  hasKey: (providerId: string) => boolean;
}

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'wkp_';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set, get) => ({
      apiKeys: [],
      tokens: [],

      // --- Legacy (kept for backward compatibility) ---
      keys: {},
      setKey: (providerId, key) =>
        set((s) => ({ keys: { ...s.keys, [providerId]: key } })),
      removeKey: (providerId) =>
        set((s) => {
          const { [providerId]: _, ...rest } = s.keys;
          return { keys: rest };
        }),
      getKey: (providerId) => get().keys[providerId],
      hasKey: (providerId) => !!get().keys[providerId],

      // --- New multi-key system ---
      addApiKey: (providerId, label, key) => {
        const entry: ApiKeyEntry = {
          id: crypto.randomUUID(),
          providerId,
          label,
          key,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ apiKeys: [...s.apiKeys, entry] }));
        return entry;
      },
      removeApiKey: (keyId) =>
        set((s) => ({ apiKeys: s.apiKeys.filter((k) => k.id !== keyId) })),
      getApiKey: (keyId) => get().apiKeys.find((k) => k.id === keyId),
      getKeysByProvider: (providerId) =>
        get().apiKeys.filter((k) => k.providerId === providerId),
      getActualKey: (keyId) => get().apiKeys.find((k) => k.id === keyId)?.key,

      // --- Tokens ---
      addToken: (token) =>
        set((s) => ({ tokens: [...s.tokens, token] })),
      removeToken: (tokenId) =>
        set((s) => ({ tokens: s.tokens.filter((t) => t.id !== tokenId) })),
      updateTokenLastUsed: (tokenId) =>
        set((s) => ({
          tokens: s.tokens.map((t) =>
            t.id === tokenId ? { ...t, lastUsed: new Date().toISOString() } : t
          ),
        })),
    }),
    { name: 'wakil-plus-api-keys' }
  )
);
