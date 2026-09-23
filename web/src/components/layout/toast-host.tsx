"use client";

import { Toast } from "@/components/primitives/toast";
import { useUiStore } from "@/lib/ui/store";

/** T081 · AC-5. Mounted once in the locale layout, above every overlay. */
export function ToastHost() {
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </>
  );
}
