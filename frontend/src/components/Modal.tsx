"use client";

import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
}>;

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const justOpenedRef = useRef(false);

  const handleClose = () => {
    // Предотвращаем закрытие сразу после открытия (защита от случайных кликов)
    if (justOpenedRef.current) {
      console.log("Modal just opened - preventing immediate close");
      return;
    }
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setIsVisible(false);
    }, 250);
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
      // Устанавливаем флаг, что модальное окно только что открылось
      justOpenedRef.current = true;
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 300); // Защита от закрытия в течение 300ms после открытия
      
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleClose();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [open, isVisible]);

  if (!isVisible && !open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        background: isClosing ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.5)", 
        backdropFilter: isClosing ? "blur(0px)" : "blur(12px)",
        WebkitBackdropFilter: isClosing ? "blur(0px)" : "blur(12px)",
        transition: "all 0.2s ease-out",
        opacity: isClosing ? 0 : 1,
        zIndex: 10000, // Очень высокий z-index, чтобы модальное окно было поверх всего, включая drawer (z-40)
      }}
      onClick={(e) => {
        // Закрываем модальное окно только при клике именно на overlay (не на дочерние элементы)
        if (e.target === e.currentTarget) {
          console.log("Modal overlay clicked - closing modal");
          handleClose();
        } else {
          console.log("Modal clicked but not on overlay - target:", e.target, "currentTarget:", e.currentTarget);
        }
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-2xl"
        style={{
          borderRadius: 24,
          background: "var(--panel)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: isClosing ? "modalSlideOut 0.25s cubic-bezier(0.4, 0, 1, 1) forwards" : "modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div 
            className="flex items-center justify-between px-6 py-5" 
            style={{ 
              borderBottom: "1px solid var(--card-border)",
              background: "var(--background)",
            }}
          >
            <div 
              className="text-xl font-semibold" 
              style={{ 
                color: 'var(--foreground)',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </div>
            <button
              aria-label="Закрыть"
              onClick={handleClose}
              className="h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ 
                border: '1px solid var(--card-border)', 
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--panel)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--muted)';
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ 
            padding: "1.5rem",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}


