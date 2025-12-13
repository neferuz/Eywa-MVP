"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  PiggyBank,
  Users,
  Activity,
  Briefcase,
  Megaphone,
  ChevronRight,
  ChevronDown,
  Dumbbell,
  Sun,
  Moon,
  Building2,
  CalendarClock,
  CreditCard,
  Globe,
  TrendingUp,
  Aperture,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  Percent,
  BarChart3,
  List,
  ArrowUpDown,
  FolderTree,
  KanbanSquare,
  Heart,
  History,
  X,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

type NavLeaf = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavLeaf[];
};

const bodyGroup: NavGroup = {
  label: "Body&mind",
  icon: Dumbbell,
  children: [
    { href: "/body/services", label: "Услуги", icon: Briefcase },
    { href: "/body/schedule", label: "Аналитика загруженности", icon: Activity },
    { href: "/body/subscriptions", label: "Абонементы", icon: PiggyBank },
  ],
};

const coworkingGroup: NavGroup = {
  label: "Коворкинг",
  icon: Building2,
  children: [
    { href: "/coworking/places", label: "Услуги", icon: MapPin },
  ],
};

const kidsGroup: NavGroup = {
  label: "KIDS",
  icon: Heart,
  children: [
    { href: "/kids/services", label: "Услуги", icon: Briefcase },
  ],
};

const marketingGroup: NavGroup = {
  label: "Маркетинг",
  icon: Megaphone,
  children: [
    { href: "/marketing/traffic", label: "Источники заявок", icon: Globe },
    { href: "/marketing/conversions", label: "Конверсии", icon: Percent },
    { href: "/marketing/roi", label: "ROI", icon: TrendingUp },
  ],
};

const staffLink = { href: "/staff/list", label: "Сотрудники", icon: Users };

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  // Удалено: проверка логина теперь в LayoutWrapper
  const isActive = (href: string) => pathname === href;
  const [openBody, setOpenBody] = useState<boolean>(false);
  const [openCoworking, setOpenCoworking] = useState<boolean>(false);
  const [openKids, setOpenKids] = useState<boolean>(false);
  const [openMarketing, setOpenMarketing] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hoverExpand, setHoverExpand] = useState<boolean>(false);
  const hoverTimer = useRef<number | null>(null);
  const { theme, toggle } = useTheme();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (onClose && pathname) {
      onClose();
    }
  }, [pathname, onClose]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') : null;
    if (saved) setCollapsed(saved === '1');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const nv = !v;
      try { localStorage.setItem('sidebar-collapsed', nv ? '1' : '0'); } catch {}
      return nv;
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {onClose && (
        <div
          className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
      )}
      
      <aside
        className={`h-screen ${collapsed && !hoverExpand ? 'w-16' : 'w-64'} shrink-0 sticky top-0 transition-all duration-300 ease-in-out flex flex-col overflow-hidden min-h-0
          ${onClose ? 'lg:relative fixed lg:translate-x-0 lg:static pointer-events-auto' : ''}
          ${onClose ? (isOpen ? 'translate-x-0' : '-translate-x-full') : ''}
        `}
        style={{ background: "var(--background)", color: "var(--foreground)", borderRight: "1px solid var(--card-border)" }}
        onMouseEnter={() => {
          if (!collapsed) return;
          if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
          setHoverExpand(true);
        }}
        onMouseLeave={() => {
          if (!collapsed) return;
          if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
          hoverTimer.current = window.setTimeout(() => setHoverExpand(false), 180);
        }}
      >
      <div className="px-3 py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center" style={{ border: '1px solid var(--card-border)', background: 'var(--panel)' }}>
            <div
              className="h-full w-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
            >
              <Aperture className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className={`flex flex-col transition-all duration-300 leading-tight ${(!collapsed || hoverExpand) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none select-none'}`}>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>EYWA SPACE</span>
            <span className="text-xs text-zinc-500">CRM Platform</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              title="Закрыть меню"
              style={{ border: '1px solid var(--card-border)', background: 'var(--muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex h-8 w-8 rounded-lg items-center justify-center transition-all hover:scale-105"
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            style={{ border: '1px solid var(--card-border)', background: 'var(--muted)' }}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--card-border)' }} />
      <nav className="px-2 pb-2 flex flex-col flex-1 min-h-0 pt-2">
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 pb-20">
        {/* Общие показатели */}
        <Link
          href="/"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/") ? "font-medium" : ""
          }`}
          title="Общие показатели"
          style={
            isActive('/')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <Home className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Общие показатели</span>
        </Link>

        {/* Расписание */}
        <Link
          href="/schedule/load"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/schedule/load") ? "font-medium" : ""
          }`}
          title="Расписание"
          style={
            isActive('/schedule/load')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <CalendarClock className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Расписание</span>
        </Link>

        {/* Оплата */}
        <Link
          href="/payments"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/payments") ? "font-medium" : ""
          }`}
          title="Оплата"
          style={
            isActive('/payments')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <CreditCard className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Оплата</span>
        </Link>

        {/* История оплат */}
        <Link
          href="/payments/history"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/payments/history") ? "font-medium" : ""
          }`}
          title="История оплат"
          style={
            isActive('/payments/history')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <History className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>История оплат</span>
        </Link>

        {/* Заявки */}
        <Link
          href="/applications"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/applications") ? "font-medium" : ""
          }`}
          title="Заявки (канбан)"
          style={
            isActive('/applications')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <KanbanSquare className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Заявки (канбан)</span>
        </Link>

        {/* Клиенты */}
        <Link
          href="/body/clients"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/body/clients") ? "font-medium" : ""
          }`}
          title="Клиенты"
          style={
            isActive('/body/clients')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <Users className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Клиенты</span>
        </Link>

        {/* Тренеры */}
        <Link
          href="/body/trainers"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/body/trainers") ? "font-medium" : ""
          }`}
          title="Тренеры"
          style={
            isActive('/body/trainers')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <Users className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Тренеры</span>
        </Link>

        {/* Сотрудники */}
        <Link
          href={staffLink.href}
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive(staffLink.href) ? "font-medium" : ""
          }`}
          title={staffLink.label}
          style={
            isActive(staffLink.href)
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <staffLink.icon className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{staffLink.label}</span>
        </Link>

        {/* Body&mind group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors border ${
            openBody
              ? 'border-[var(--card-border)] bg-[var(--muted)] text-[var(--foreground)]'
              : 'border-[var(--card-border)]/60 bg-[var(--panel)]/45 text-[var(--foreground)]/70 hover:bg-[var(--panel)]/70 hover:text-[var(--foreground)]'
          }`}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenBody((v) => !v); }}
          title={bodyGroup.label}
        >
          <span className="flex items-center gap-3">
            <bodyGroup.icon className="h-4 w-4" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{bodyGroup.label}</span>
          </span>
          {!collapsed && (openBody ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openBody && (
          <div className="ml-2 space-y-1 p-1" style={{ background: 'var(--group-bg)', border: '1px solid var(--group-border)', borderRadius: 14 }}>
            {bodyGroup.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
                  isActive(item.href) ? "font-medium" : ""
                }`}
                title={item.label}
                style={
                  isActive(item.href)
                    ? {
                        background: 'var(--panel)',
                        border: '1px solid var(--card-border)',
                        boxShadow: 'inset 3px 0 0 0 #10B981',
                      }
                    : undefined
                }
              >
                <item.icon className="h-4 w-4" />
                <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* EYWA COWORKING group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors border ${
            openCoworking
              ? 'border-[var(--card-border)] bg-[var(--muted)] text-[var(--foreground)]'
              : 'border-[var(--card-border)]/60 bg-[var(--panel)]/45 text-[var(--foreground)]/70 hover:bg-[var(--panel)]/70 hover:text-[var(--foreground)]'
          }`}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenCoworking((v) => !v); }}
          title={coworkingGroup.label}
        >
          <span className="flex items-center gap-3">
            <coworkingGroup.icon className="h-4 w-4" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{coworkingGroup.label}</span>
          </span>
          {!collapsed && (openCoworking ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openCoworking && (
          <div className="ml-2 space-y-1 p-1" style={{ background: 'var(--group-bg)', border: '1px solid var(--group-border)', borderRadius: 14 }}>
            {coworkingGroup.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
                  isActive(item.href) ? "font-medium" : ""
                }`}
                title={item.label}
                style={
                  isActive(item.href)
                    ? {
                        background: 'var(--panel)',
                        border: '1px solid var(--card-border)',
                        boxShadow: 'inset 3px 0 0 0 #10B981',
                      }
                    : undefined
                }
              >
                <item.icon className="h-4 w-4" />
                <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* KIDS group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors border ${
            openKids
              ? 'border-[var(--card-border)] bg-[var(--muted)] text-[var(--foreground)]'
              : 'border-[var(--card-border)]/60 bg-[var(--panel)]/45 text-[var(--foreground)]/70 hover:bg-[var(--panel)]/70 hover:text-[var(--foreground)]'
          }`}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenKids((v) => !v); }}
          title={kidsGroup.label}
        >
          <span className="flex items-center gap-3">
            <kidsGroup.icon className="h-4 w-4" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{kidsGroup.label}</span>
          </span>
          {!collapsed && (openKids ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openKids && (
          <div className="ml-2 space-y-1 p-1" style={{ background: 'var(--group-bg)', border: '1px solid var(--group-border)', borderRadius: 14 }}>
            {kidsGroup.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
                  isActive(item.href) ? "font-medium" : ""
                }`}
                title={item.label}
                style={
                  isActive(item.href)
                    ? {
                        background: 'var(--panel)',
                        border: '1px solid var(--card-border)',
                        boxShadow: 'inset 3px 0 0 0 #10B981',
                      }
                    : undefined
                }
              >
                <item.icon className="h-4 w-4" />
                <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* EYWA MARKETING group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors border ${
            openMarketing
              ? 'border-[var(--card-border)] bg-[var(--muted)] text-[var(--foreground)]'
              : 'border-[var(--card-border)]/60 bg-[var(--panel)]/45 text-[var(--foreground)]/70 hover:bg-[var(--panel)]/70 hover:text-[var(--foreground)]'
          }`}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenMarketing((v) => !v); }}
          title={marketingGroup.label}
        >
          <span className="flex items-center gap-3">
            <marketingGroup.icon className="h-4 w-4" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{marketingGroup.label}</span>
          </span>
          {!collapsed && (openMarketing ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openMarketing && (
          <div className="ml-2 space-y-1 p-1" style={{ background: 'var(--group-bg)', border: '1px solid var(--group-border)', borderRadius: 14 }}>
            {marketingGroup.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
                  isActive(item.href) ? "font-medium" : ""
                }`}
                title={item.label}
                style={
                  isActive(item.href)
                    ? {
                        background: 'var(--panel)',
                        border: '1px solid var(--card-border)',
                        boxShadow: 'inset 3px 0 0 0 #10B981',
                      }
                    : undefined
                }
              >
                <item.icon className="h-4 w-4" />
                <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        </div>

        <div className="pt-2" style={{ borderTop: '1px solid var(--card-border)', background: 'var(--background)' }}>
          <button
            className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            onClick={toggle}
            title="Переключить тему"
          >
            <span className="flex items-center gap-3">
              {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {!collapsed && <span className="truncate">Тема: {theme === "light" ? "светлая" : "тёмная"}</span>}
            </span>
            {!collapsed && (
              <span className="inline-block h-4 w-8 rounded-full relative" style={{ border: '1px solid var(--card-border)' }}>
                <span
                  className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-current transition-all ${
                    theme === "dark" ? "right-0.5" : "left-0.5"
                  }`}
                />
              </span>
            )}
          </button>
        </div>
      </nav>
    </aside>
    </>
  );
}


