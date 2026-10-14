// Browser preview uses the same persistent-session contract; native resolves to
// the encrypted SecureStore implementation, never browser/local storage.
export const sessionStorage = {
  async getItem(key: string) { return typeof window === 'undefined' ? null : window.localStorage.getItem(key); },
  async setItem(key: string, value: string) { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); },
  async removeItem(key: string) { if (typeof window !== 'undefined') window.localStorage.removeItem(key); },
};
