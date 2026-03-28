import { createContext, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = String(++toastId);
      setToasts((prev) => [...prev, { id, type, message }]);
      const timer = setTimeout(() => {
        removeToast(id);
      }, 5000);
      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  const success = useCallback((message: string) => addToast("success", message), [addToast]);
  const warning = useCallback((message: string) => addToast("warning", message), [addToast]);
  const error = useCallback((message: string) => addToast("error", message), [addToast]);
  const info = useCallback((message: string) => addToast("info", message), [addToast]);

  useEffect(() => {
    function handleCustomEvent(e: Event) {
      const detail = (e as CustomEvent).detail as { type?: ToastType; message?: string } | undefined;
      if (detail?.type && detail?.message) {
        addToast(detail.type, detail.message);
      }
    }
    window.addEventListener("lendq:notification", handleCustomEvent);
    return () => window.removeEventListener("lendq:notification", handleCustomEvent);
  }, [addToast]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, warning, error, info }}>
      {children}
    </ToastContext.Provider>
  );
}
