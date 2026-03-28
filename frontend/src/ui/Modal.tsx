import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-[480px]",
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => setVisible(true));
      const timer = setTimeout(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        first?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      previousFocusRef.current?.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onKeyDown={handleKeyDown}
    >
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative z-10 bg-surface flex flex-col transition-transform duration-200 ${
          visible ? "scale-100" : "scale-95"
        } ${
          isMobile
            ? "w-full h-full"
            : `w-full ${maxWidth} rounded-modal shadow-modal max-h-[90vh]`
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2
            id={titleId}
            className="font-heading text-lg font-bold text-text-primary"
          >
            {title}
          </h2>
          <button
            data-testid="modal-close"
            onClick={onClose}
            className="p-1 rounded-button text-text-muted hover:text-text-primary hover:bg-background transition-colors"
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-border">{footer}</div>
        )}
      </div>
    </div>
  );
}

export default Modal;
