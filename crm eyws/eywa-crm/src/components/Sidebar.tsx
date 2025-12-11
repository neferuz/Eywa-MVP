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
  Bot,
  Plus,
  ChevronRight,
  ChevronDown,
  Dumbbell,
  Sun,
  Moon,
  Coffee,
  ShoppingCart,
  Building2,
  Calendar,
  CreditCard,
  Globe,
  UserPlus,
  TrendingUp,
  Target,
  DollarSign,
  Plane,
  Aperture,
  PanelLeftClose,
  PanelLeftOpen,
  Baby,
  Layers,
  Flame,
  MapPin,
  Percent,
  BarChart3,
  List,
  ArrowUpDown,
  FolderTree,
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
    { href: "/body/clients", label: "Клиенты", icon: Users },
  ],
};

const coffeeGroup: NavGroup = {
  label: "Кофе",
  icon: Coffee,
  children: [
    { href: "/coffee/sales", label: "Продажи", icon: ShoppingCart },
    { href: "/coffee/activity", label: "Активность", icon: Flame },
    { href: "/coffee/kpi", label: "KPI и эффективность", icon: TrendingUp },
  ],
};

const coworkingGroup: NavGroup = {
  label: "Коворкинг",
  icon: Building2,
  children: [
    { href: "/coworking/places", label: "Места", icon: MapPin },
    { href: "/coworking/residents", label: "Резиденты", icon: Users },
    { href: "/coworking/income", label: "Доход", icon: CreditCard },
    { href: "/coworking/clients", label: "Клиенты", icon: UserPlus },
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

const kidsGroup: NavGroup = {
  label: "Детская",
  icon: Baby,
  children: [
    { href: "/kids", label: "Обзор", icon: Baby },
    { href: "/kids/attendance", label: "Посещаемость", icon: Users },
    { href: "/kids/revenue", label: "Выручка", icon: DollarSign },
  ],
};

const staffGroup: NavGroup = {
  label: "Сотрудники",
  icon: Users,
  children: [
    { href: "/staff/list", label: "Список сотрудников", icon: Users },
    { href: "/staff/kpi", label: "KPI и эффективность", icon: Target },
    { href: "/staff/schedule", label: "График и смены", icon: Calendar },
    { href: "/staff/payments", label: "Зарплаты и начисления", icon: DollarSign },
    { href: "/staff/vacations", label: "Отпуска и отсутствия", icon: Plane },
  ],
};

const financeGroup: NavGroup = {
  label: "Финансы",
  icon: DollarSign,
  children: [
    { href: "/finance/pl", label: "P&L", icon: BarChart3 },
    { href: "/finance/transactions", label: "Операции", icon: List },
    { href: "/finance/cashflow", label: "Cash Flow", icon: ArrowUpDown },
    { href: "/finance/categories", label: "Категории", icon: FolderTree },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;
  const isActive = (href: string) => pathname === href;
  const [openBody, setOpenBody] = useState<boolean>(false);
  const [openCoffee, setOpenCoffee] = useState<boolean>(false);
  const [openCoworking, setOpenCoworking] = useState<boolean>(false);
  const [openMarketing, setOpenMarketing] = useState<boolean>(false);
  const [openKids, setOpenKids] = useState<boolean>(false);
  const [openStaff, setOpenStaff] = useState<boolean>(false);
  const [openFinance, setOpenFinance] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hoverExpand, setHoverExpand] = useState<boolean>(false);
  const [logoSrc, setLogoSrc] = useState<string>("/logo1.png");
  const [logoError, setLogoError] = useState<boolean>(false);
  const hoverTimer = useRef<number | null>(null);
  const { theme, toggle } = useTheme();

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
    <aside
      className={`h-screen ${collapsed && !hoverExpand ? 'w-16' : 'w-64'} shrink-0 sticky top-0 transition-[width] duration-300 ease-in-out flex flex-col overflow-hidden min-h-0`}
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
            {logoError ? (
              <div
                className="h-full w-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
              >
                <Aperture className="h-4 w-4 text-white" />
              </div>
            ) : (
              <img
                src={logoSrc}
                alt="EYWA"
                className="h-full w-full object-cover"
                onError={() => {
                  if (logoSrc !== "/logo1.png") {
                    setLogoSrc("/logo1.png");
                  } else {
                    setLogoError(true);
                  }
                }}
              />
            )}
          </div>
          <div className={`flex flex-col transition-all duration-300 leading-tight ${(!collapsed || hoverExpand) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none select-none'}`}>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>EYWA SPACE</span>
            <span className="text-xs text-zinc-500">CRM Platform</span>
          </div>
        </div>
        <button
          onClick={toggleCollapsed}
          className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          style={{ border: '1px solid var(--card-border)', background: 'var(--muted)' }}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      <div style={{ borderTop: '1px solid var(--card-border)' }} />
      <nav className="px-2 pb-2 flex flex-col flex-1 min-h-0">
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

        {/* Расписание (загрузка) */}
        <Link
          href="/load"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/load") ? "font-medium" : ""
          }`}
          title="Расписание (загрузка)"
          style={
            isActive('/load')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <Activity className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Расписание (загрузка)</span>
        </Link>

        {/* Записи на сегодня */}
        <Link
          href="/dashboard/today"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/dashboard/today") ? "font-medium" : ""
          }`}
          title="Записи на сегодня"
          style={
            isActive('/dashboard/today')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <Calendar className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Записи на сегодня</span>
        </Link>

        {/* ИИ рекомендации */}
        <Link
          href="/ai"
          className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06] ${
            isActive("/ai") ? "font-medium" : ""
          }`}
          title="ИИ рекомендации"
          style={
            isActive('/ai')
              ? { background: 'var(--panel)', border: '1px solid var(--card-border)', boxShadow: 'inset 3px 0 0 0 #10B981' }
              : undefined
          }
        >
          <Bot className="h-4 w-4" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>ИИ рекомендации</span>
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

        {/* Body&mind group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
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

        {/* EYWA COFFEE group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenCoffee((v) => !v); }}
          title={coffeeGroup.label}
        >
          <span className="flex items-center gap-3">
            <coffeeGroup.icon className="h-4 w-4" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{coffeeGroup.label}</span>
          </span>
          {!collapsed && (openCoffee ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openCoffee && (
          <div className="ml-2 space-y-1 p-1" style={{ background: 'var(--group-bg)', border: '1px solid var(--group-border)', borderRadius: 14 }}>
            {coffeeGroup.children.map((item) => (
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
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
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

        {/* EYWA MARKETING group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
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

        {/* EYWA KIDS group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
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

        {/* EYWA STAFF group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenStaff((v) => !v); }}
          title={staffGroup.label}
        >
          <span className="flex items-center gap-3">
            <staffGroup.icon className="h-4 w-4" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{staffGroup.label}</span>
          </span>
          {!collapsed && (openStaff ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openStaff && (
          <div className="ml-2 space-y-1 p-1" style={{ background: 'var(--group-bg)', border: '1px solid var(--group-border)', borderRadius: 14 }}>
            {staffGroup.children.map((item) => (
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
                {(!collapsed || hoverExpand) && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </div>
        )}

        {/* Финансы group */}
        <button
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenFinance((v) => !v); }}
          title={financeGroup.label}
        >
          <span className="flex items-center gap-3">
            <financeGroup.icon className="h-4 w-4" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{financeGroup.label}</span>
          </span>
          {!collapsed && (openFinance ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openFinance && (
          <div className="ml-2 space-y-1 p-1" style={{ background: 'var(--group-bg)', border: '1px solid var(--group-border)', borderRadius: 14 }}>
            {financeGroup.children.map((item) => (
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
                {(!collapsed || hoverExpand) && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </div>
        )}
        </div>

        <div className="pt-2" style={{ borderTop: '1px solid var(--card-border)', background: 'var(--background)' }}>
          <button className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]" title="Новый отчёт">
            <Plus className="h-4 w-4" />
            {!collapsed && <span>Новый отчёт</span>}
          </button>

          <Link
            href="/integrations"
            className={`group mt-1 flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
            title="Интеграции"
            style={
              isActive('/integrations')
                ? {
                    background: 'var(--panel)',
                    border: '1px solid var(--card-border)',
                    boxShadow: 'inset 3px 0 0 0 #10B981',
                  }
                : { border: '1px solid var(--card-border)' }
            }
          >
            <Layers className="h-4 w-4" />
            {!collapsed && <span className="truncate">Интеграции</span>}
          </Link>

          <button
            className="w-full mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]"
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
  );
}


