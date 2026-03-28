import { useContext, useEffect, useState } from "react";
import { ToastContext } from "./toastContext";
import { ToastMessage } from "./ToastMessage";

export function ToastContainer() {
  const ctx = useContext(ToastContext);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!ctx) return null;

  const positionClasses = isMobile
    ? "fixed bottom-20 left-1/2 -translate-x-1/2"
    : "fixed top-6 right-6";

  return (
    <div data-testid="toast-container" className={`${positionClasses} z-50 flex flex-col gap-2`}>
      {ctx.toasts.map((toast) => (
        <ToastMessage
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={ctx.removeToast}
        />
      ))}
    </div>
  );
}
