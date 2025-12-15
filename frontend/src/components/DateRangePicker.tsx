"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

const formatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        handleClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleOpen = () => {
    setOpen(true);
    setIsClosing(false);
  };

  return (
    <>
      {/* Затемнённый overlay с анимацией */}
      {open && (
        <div
          className={`fixed inset-0 z-30 transition-opacity duration-200 ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
          style={{ 
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={handleClose}
        />
      )}

      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={open ? handleClose : handleOpen}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            open ? "border-2" : "border"
          }`}
          style={{ 
            borderColor: open ? "var(--foreground)" : "var(--card-border)",
            color: "var(--foreground)",
            background: open ? "var(--panel)" : "transparent",
            opacity: open ? 1 : 0.5,
          }}
        >
          <Calendar className="h-4 w-4" />
          <span className="whitespace-nowrap">
            {value?.from && value?.to
              ? `${formatter.format(value.from)} - ${formatter.format(value.to)}`
              : value?.from
              ? formatter.format(value.from)
              : "Выберите даты"}
              </span>
        </button>

        {open && (
          <div
            className={`absolute right-0 mt-3 z-50 rounded-3xl shadow-2xl p-4 transition-all duration-200 ${
              isClosing ? "opacity-0 scale-95 translate-y-2" : "opacity-100 scale-100 translate-y-0"
            }`}
            style={{ 
              background: "var(--panel)", 
              border: "1px solid var(--card-border)",
              minWidth: "320px",
              transformOrigin: "top right",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <DayPicker
              mode="range"
              selected={value}
              onSelect={(range) => onChange(range ?? undefined)}
              numberOfMonths={1}
              weekStartsOn={1}
              styles={{
                root: { width: "100%" },
                months: { width: "100%" },
                month: { width: "100%" },
                caption: { 
                  color: "var(--foreground)", 
                  fontWeight: 600,
                  marginBottom: "1rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid var(--card-border)",
                },
                caption_label: { fontSize: "0.95rem" },
                nav: { marginTop: "-0.5rem" },
                head_cell: { 
                  color: "var(--muted-foreground)", 
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                },
                cell: { padding: "0.4rem" },
                day: { 
                  fontSize: "0.875rem", 
                  borderRadius: "10px",
                  transition: "all 0.2s",
                },
                day_selected: { 
                  background: "#6366F1", 
                  color: "#fff",
                  fontWeight: 600,
                },
                day_range_middle: { 
                  background: "rgba(99, 102, 241, 0.15)", 
                  color: "var(--foreground)",
                },
                day_range_start: {
                  background: "#6366F1",
                  color: "#fff",
                  fontWeight: 600,
                },
                day_range_end: { 
                  background: "#6366F1", 
                  color: "#fff",
                  fontWeight: 600,
                },
                day_outside: { 
                  color: "var(--muted-foreground)",
                  opacity: 0.4,
                },
              }}
              locale={undefined}
            />
            <div className="flex items-center justify-between pt-3 mt-3 text-xs" style={{ borderTop: "1px solid var(--card-border)" }}>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                style={{ color: "#EF4444" }}
                onClick={() => {
                  onChange(undefined);
                  handleClose();
                }}
              >
                Сбросить
              </button>
              <button
                type="button"
                className="px-4 py-1.5 rounded-lg font-semibold transition-colors hover:opacity-90"
                style={{ 
                  background: "#6366F1",
                  color: "#fff",
                }}
                onClick={handleClose}
              >
                Готово
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

