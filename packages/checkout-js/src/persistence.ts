import type { PersistedCheckoutState, PersistenceAdapter } from "./types";

export function createMemoryPersistence(): PersistenceAdapter {
  const store = new Map<string, PersistedCheckoutState>();
  return {
    get(key) {
      return store.get(key) ?? null;
    },
    set(key, value) {
      store.set(key, { ...value });
    },
    remove(key) {
      store.delete(key);
    },
  };
}

/** sessionStorage adapter — stores only non-PII checkout resume data. */
export function createSessionStoragePersistence(
  storage?: Storage,
): PersistenceAdapter {
  const getStorage = (): Storage | null => {
    if (storage) return storage;
    try {
      if (typeof sessionStorage !== "undefined") return sessionStorage;
    } catch {
      /* private browsing / SSR */
    }
    return null;
  };

  return {
    get(key) {
      const s = getStorage();
      if (!s) return null;
      try {
        const raw = s.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as PersistedCheckoutState;
      } catch {
        return null;
      }
    },
    set(key, value) {
      const s = getStorage();
      if (!s) return;
      try {
        // Strip anything that could be PII or provider secrets
        const safe: PersistedCheckoutState = {
          sessionToken: value.sessionToken,
          eventSlug: value.eventSlug,
          cart: value.cart,
          discountCode: value.discountCode,
          phase: value.phase,
          buyerVerified: value.buyerVerified,
          purchaseId: value.purchaseId,
        };
        s.setItem(key, JSON.stringify(safe));
      } catch {
        /* quota / private mode */
      }
    },
    remove(key) {
      const s = getStorage();
      if (!s) return;
      try {
        s.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}
