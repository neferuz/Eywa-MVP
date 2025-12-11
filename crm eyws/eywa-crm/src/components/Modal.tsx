"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
}>;

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.22)" }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="w-full max-w-2xl animate-in fade-in zoom-in"
        style={{
          borderRadius: 30,
          background: "var(--panel)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) ? (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--card-border)" }}>
            <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{title}</div>
            <button
              aria-label="Закрыть"
              onClick={onClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ border: '1px solid var(--card-border)', background: 'var(--muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}


