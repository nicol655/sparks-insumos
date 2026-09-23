import { create } from "zustand";

/**
 * Overlay state for the header and catalogue chrome (§03).
 *
 * A single slot rather than one boolean per panel: the design never shows two
 * overlays at once, and scroll locking, focus trapping and the Escape handler
 * all reduce to "is something open" when the state cannot express a conflict.
 *
 * Not persisted — reopening the cart drawer after a reload would be surprising.
 */
export type Overlay = "cart" | "search" | "menu" | "filters";

export type ToastItem = {
  id: string;
  message: string;
};

type UiState = {
  overlay: Overlay | null;
  toasts: ToastItem[];
  open: (overlay: Overlay) => void;
  close: () => void;
  toggle: (overlay: Overlay) => void;
  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;
};

let toastSeq = 0;

export const useUiStore = create<UiState>()((set) => ({
  overlay: null,
  toasts: [],
  open: (overlay) => set({ overlay }),
  close: () => set({ overlay: null }),
  toggle: (overlay) => set((state) => ({ overlay: state.overlay === overlay ? null : overlay })),
  pushToast: (message) =>
    set({
      toasts: [{ id: String(++toastSeq), message }],
    }),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** True while any overlay is up, so the page behind can be locked and inert. */
export function isOverlayOpen(overlay: Overlay | null): boolean {
  return overlay !== null;
}
