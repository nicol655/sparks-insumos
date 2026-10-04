import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export const SESSION_STORAGE_KEY = "sparks-backoffice-session";

type SessionState = {
  accessToken: string | null;
  mustChangePassword: boolean;
  hydrated: boolean;
  setSession: (accessToken: string, mustChangePassword: boolean) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
};

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function browserSessionStorage(): StateStorage {
  if (typeof window === "undefined") return memoryStorage;
  return sessionStorage;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      mustChangePassword: false,
      hydrated: false,
      setSession: (accessToken, mustChangePassword) => set({ accessToken, mustChangePassword }),
      clearSession: () => set({ accessToken: null, mustChangePassword: false }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(browserSessionStorage),
      skipHydration: true,
      partialize: (state) => ({
        accessToken: state.accessToken,
        mustChangePassword: state.mustChangePassword,
      }),
      onRehydrateStorage: () => () => {
        useSessionStore.getState().setHydrated(true);
      },
    },
  ),
);
