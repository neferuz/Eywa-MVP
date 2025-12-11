"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Aperture, Calendar, Filter, User, LogOut } from "lucide-react";

const directions = ["Все", "Body", "Coworking", "Coffee"] as const;
const periods = ["День", "Неделя", "Месяц"] as const;

export default function Header() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;
  const [direction, setDirection] = useState<(typeof directions)[number]>("Все");
  const [period, setPeriod] = useState<(typeof periods)[number]>("Месяц");
  const [logoSrc, setLogoSrc] = useState("/logo1.png");
  const [logoFallback, setLogoFallback] = useState(false);

  return (
    <header
      className="sticky top-0 z-20 w-full backdrop-blur-sm"
      style={{ 
        background: "var(--panel)", 
        borderBottom: "1px solid var(--card-border)"
      }}
    >
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Logo */}
        {logoFallback ? (
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
            }}
          >
            <Aperture className="h-5 w-5 text-white" />
          </div>
        ) : (
          <img
            src={logoSrc}
            alt="EYWA"
            className="h-10 w-10 rounded-xl object-cover transition-all hover:scale-105"
            style={{ border: '1px solid var(--card-border)', background: 'var(--panel)' }}
            onError={() => {
              if (logoSrc !== '/logo1.png') {
                setLogoSrc('/logo1.png');
              } else {
                setLogoFallback(true);
              }
            }}
          />
        )}

        {/* Filters */}
        <div className="hidden lg:flex items-center gap-2.5 ml-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Filter className="h-4 w-4" style={{ color: 'var(--foreground)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Направление</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none font-medium cursor-pointer"
              style={{ color: 'var(--foreground)', border: 'none' }}
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
            >
              {directions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Calendar className="h-4 w-4" style={{ color: 'var(--foreground)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Период</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none font-medium cursor-pointer"
              style={{ color: 'var(--foreground)', border: 'none' }}
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              placeholder="Поиск (клиент, сотрудник)..."
              className="h-10 w-72 pl-10 pr-4 text-sm rounded-xl transition-all focus:w-80 focus:outline-none"
              style={{ 
                background: 'var(--muted)', 
                border: '1px solid var(--card-border)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          {/* Notifications */}
          <button
            className="relative h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            style={{ border: '1px solid var(--card-border)' }}
            aria-label="Уведомления"
            title="Уведомления"
          >
            <Bell className="h-4.5 w-4.5" style={{ color: 'var(--foreground)' }} />
            <span 
              className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
            >
              3
            </span>
          </button>

          {/* Profile */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all hover:scale-105 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              style={{ border: '1px solid var(--card-border)' }}
              title="Профиль"
            >
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                style={{ 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                }}
              >
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>Администратор</span>
                <span className="text-[10px] text-zinc-500 leading-tight">admin@eywa.space</span>
              </div>
            </button>
            
            <button
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 hover:bg-red-500/10"
              style={{ border: '1px solid var(--card-border)' }}
              title="Выход"
            >
              <LogOut className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


