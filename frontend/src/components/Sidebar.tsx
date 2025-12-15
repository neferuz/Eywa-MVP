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
  Settings,
  Zap,
  ArrowUpRight,
  Plus,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { fetchStaff, type StaffMember } from "@/lib/api";

type NavLeaf = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
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
  const isActive = (href: string) => pathname === href;
  const [openBody, setOpenBody] = useState<boolean>(false);
  const [openCoworking, setOpenCoworking] = useState<boolean>(false);
  const [openKids, setOpenKids] = useState<boolean>(false);
  const [openMarketing, setOpenMarketing] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hoverExpand, setHoverExpand] = useState<boolean>(false);
  const [openMembers, setOpenMembers] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<StaffMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const hoverTimer = useRef<number | null>(null);
  const { theme, snowEnabled, toggle, enableSnow } = useTheme();

  // Загрузка участников команды
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoadingMembers(true);
        const staff = await fetchStaff();
        setTeamMembers(staff.filter(m => m.is_active)); // Только активные участники
      } catch (error) {
        console.error("Ошибка загрузки участников:", error);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, []);

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
        {/* Header */}
        <div 
          className="px-4 py-5 flex items-center justify-between border-b"
          style={{ 
            background: "var(--panel)", 
            borderColor: "var(--card-border)" 
          }}
        >
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
              <Aperture className="h-4 w-4 text-white" />
            </div>
          <div className={`flex flex-col transition-all duration-300 leading-tight ${(!collapsed || hoverExpand) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none select-none'}`}>
              <span className="text-base font-bold" style={{ color: "var(--foreground)" }}>EYWA</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
                className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                style={{ 
                  background: "transparent",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--muted)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              title="Закрыть меню"
            >
                <X className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.6 }} />
            </button>
          )}
          <button
            onClick={toggleCollapsed}
              className="hidden lg:flex h-8 w-8 rounded-lg items-center justify-center transition-all"
              style={{ 
                background: "transparent",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--muted)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.6 }} /> : <PanelLeftClose className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.6 }} />}
          </button>
        </div>
      </div>

        {/* Navigation */}
        <nav 
          className="flex-1 overflow-y-auto px-3 py-4"
          style={{ background: "var(--panel)" }}
        >
          <div className="space-y-1">
            {/* Dashboard */}
        <Link
              href="/"
              className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
              style={{
                background: isActive("/") ? "var(--muted)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => !isActive("/") && (e.currentTarget.style.background = "var(--muted)")}
              onMouseLeave={(e) => !isActive("/") && (e.currentTarget.style.background = "transparent")}
              title="Dashboard"
        >
              <Home className="h-5 w-5 flex-shrink-0" />
              <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Dashboard</span>
        </Link>

            {/* Tasks */}
        <Link
              href="/applications"
              className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative`}
              style={{
                background: isActive("/applications") ? "var(--muted)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => !isActive("/applications") && (e.currentTarget.style.background = "var(--muted)")}
              onMouseLeave={(e) => !isActive("/applications") && (e.currentTarget.style.background = "transparent")}
              title="Заявки"
        >
              <Briefcase className="h-5 w-5 flex-shrink-0" />
              <span className={`truncate transition-all duration-200 flex-1 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Заявки</span>
              {(!collapsed || hoverExpand) && (
                <span 
                  className="h-5 w-5 rounded-full text-xs font-semibold flex items-center justify-center"
                  style={{ 
                    background: "var(--muted)", 
                    color: "var(--foreground)",
                    opacity: 0.8
                  }}
                >
                  2
                </span>
              )}
        </Link>

            {/* Activity */}
        <Link
              href="/schedule/load"
              className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
              style={{
                background: isActive("/schedule/load") ? "var(--muted)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => !isActive("/schedule/load") && (e.currentTarget.style.background = "var(--muted)")}
              onMouseLeave={(e) => !isActive("/schedule/load") && (e.currentTarget.style.background = "transparent")}
              title="Активность"
        >
              <BarChart3 className="h-5 w-5 flex-shrink-0" />
              <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Активность</span>
        </Link>

            {/* Customers */}
        <Link
          href="/body/clients"
              className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
              style={{
                background: isActive("/body/clients") ? "var(--muted)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => !isActive("/body/clients") && (e.currentTarget.style.background = "var(--muted)")}
              onMouseLeave={(e) => !isActive("/body/clients") && (e.currentTarget.style.background = "transparent")}
          title="Клиенты"
        >
              <Users className="h-5 w-5 flex-shrink-0" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Клиенты</span>
        </Link>

            {/* Trainers */}
        <Link
          href="/body/trainers"
              className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
              style={{
                background: isActive("/body/trainers") ? "var(--muted)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => !isActive("/body/trainers") && (e.currentTarget.style.background = "var(--muted)")}
              onMouseLeave={(e) => !isActive("/body/trainers") && (e.currentTarget.style.background = "transparent")}
          title="Тренеры"
        >
              <Dumbbell className="h-5 w-5 flex-shrink-0" />
          <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Тренеры</span>
        </Link>

            {/* Payments */}
        <Link
              href="/payments"
              className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
              style={{
                background: isActive("/payments") ? "var(--muted)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => !isActive("/payments") && (e.currentTarget.style.background = "var(--muted)")}
              onMouseLeave={(e) => !isActive("/payments") && (e.currentTarget.style.background = "transparent")}
              title="Оплаты"
        >
              <CreditCard className="h-5 w-5 flex-shrink-0" />
              <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Оплаты</span>
        </Link>

            {/* Payment History */}
        <Link
              href="/payments/history"
              className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
              style={{
                background: isActive("/payments/history") ? "var(--muted)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => !isActive("/payments/history") && (e.currentTarget.style.background = "var(--muted)")}
              onMouseLeave={(e) => !isActive("/payments/history") && (e.currentTarget.style.background = "transparent")}
              title="История оплат"
        >
              <History className="h-5 w-5 flex-shrink-0" />
              <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>История оплат</span>
        </Link>

            {/* Settings */}
            <Link
              href="/staff/list"
              className={`group flex items-center ${collapsed && !hoverExpand ? 'justify-center gap-0' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
              style={{
                background: isActive("/staff/list") ? "var(--muted)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => !isActive("/staff/list") && (e.currentTarget.style.background = "var(--muted)")}
              onMouseLeave={(e) => !isActive("/staff/list") && (e.currentTarget.style.background = "transparent")}
              title="Настройки"
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Настройки</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-4 border-t" style={{ borderColor: "var(--card-border)" }} />

          {/* Projects Section */}
          <div className="mb-4">
            <div className={`flex items-center justify-between mb-2 px-3 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0'}`}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--foreground)", opacity: 0.6 }}>Направления</h3>
            </div>
            <div className="space-y-1">
              {/* Body&mind */}
        <button
                className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: openBody ? "var(--muted)" : "transparent",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => !openBody && (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={(e) => !openBody && (e.currentTarget.style.background = "transparent")}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenBody((v) => !v); }}
          title={bodyGroup.label}
        >
          <span className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 flex-shrink-0" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{bodyGroup.label}</span>
          </span>
                {(!collapsed || hoverExpand) && (openBody ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openBody && (
                <div className="ml-4 space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--card-border)" }}>
            {bodyGroup.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                      style={{
                        color: "var(--foreground)",
                        opacity: isActive(item.href) ? 1 : 0.7,
                        fontWeight: isActive(item.href) ? 600 : 400,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={(e) => !isActive(item.href) && (e.currentTarget.style.opacity = "0.7")}
                title={item.label}
              >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

              {/* Коворкинг */}
        <button
                className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: openCoworking ? "var(--muted)" : "transparent",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => !openCoworking && (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={(e) => !openCoworking && (e.currentTarget.style.background = "transparent")}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenCoworking((v) => !v); }}
          title={coworkingGroup.label}
        >
          <span className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 flex-shrink-0" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{coworkingGroup.label}</span>
          </span>
                {(!collapsed || hoverExpand) && (openCoworking ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openCoworking && (
                <div className="ml-4 space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--card-border)" }}>
            {coworkingGroup.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                      style={{
                        color: "var(--foreground)",
                        opacity: isActive(item.href) ? 1 : 0.7,
                        fontWeight: isActive(item.href) ? 600 : 400,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={(e) => !isActive(item.href) && (e.currentTarget.style.opacity = "0.7")}
                title={item.label}
              >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

              {/* KIDS */}
        <button
                className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: openKids ? "var(--muted)" : "transparent",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => !openKids && (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={(e) => !openKids && (e.currentTarget.style.background = "transparent")}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenKids((v) => !v); }}
          title={kidsGroup.label}
        >
          <span className="flex items-center gap-3">
                  <Heart className="h-5 w-5 flex-shrink-0" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{kidsGroup.label}</span>
          </span>
                {(!collapsed || hoverExpand) && (openKids ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openKids && (
                <div className="ml-4 space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--card-border)" }}>
            {kidsGroup.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                      style={{
                        color: "var(--foreground)",
                        opacity: isActive(item.href) ? 1 : 0.7,
                        fontWeight: isActive(item.href) ? 600 : 400,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={(e) => !isActive(item.href) && (e.currentTarget.style.opacity = "0.7")}
                title={item.label}
              >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

              {/* Маркетинг */}
        <button
                className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: openMarketing ? "var(--muted)" : "transparent",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => !openMarketing && (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={(e) => !openMarketing && (e.currentTarget.style.background = "transparent")}
          onClick={() => { if (collapsed && !hoverExpand) return; setOpenMarketing((v) => !v); }}
          title={marketingGroup.label}
        >
          <span className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 flex-shrink-0" />
            <span className={`truncate transition-all duration-200 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{marketingGroup.label}</span>
          </span>
                {(!collapsed || hoverExpand) && (openMarketing ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>
        {(!collapsed || hoverExpand) && openMarketing && (
                <div className="ml-4 space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--card-border)" }}>
            {marketingGroup.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                      style={{
                        color: "var(--foreground)",
                        opacity: isActive(item.href) ? 1 : 0.7,
                        fontWeight: isActive(item.href) ? 600 : 400,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={(e) => !isActive(item.href) && (e.currentTarget.style.opacity = "0.7")}
                title={item.label}
              >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
            </div>
        </div>

          {/* Divider */}
          <div className="my-4 border-t" style={{ borderColor: "var(--card-border)" }} />

          {/* Members Section */}
          <div>
            <div className={`flex items-center justify-between mb-2 px-3 ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0'}`}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--foreground)", opacity: 0.6 }}>Участники</h3>
              {(!collapsed || hoverExpand) && (
                <button 
                  className="h-6 w-6 rounded-lg flex items-center justify-center transition-colors" 
                  title={openMembers ? "Скрыть участников" : "Показать участников"}
                  onClick={() => setOpenMembers(!openMembers)}
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--muted)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {openMembers ? (
                    <ChevronUp className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.6 }} />
                  ) : (
                    <Plus className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.6 }} />
                  )}
                </button>
              )}
            </div>
            {/* Выпадающий список участников с анимацией */}
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openMembers ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-2 pt-2">
                {loadingMembers ? (
                  <div className="px-3 py-2 text-xs" style={{ color: "var(--foreground)", opacity: 0.6 }}>Загрузка...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="px-3 py-2 text-xs" style={{ color: "var(--foreground)", opacity: 0.6 }}>Нет участников</div>
                ) : (
                  teamMembers.map((member) => {
                    const initials = member.name 
                      ? member.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : member.email.slice(0, 2).toUpperCase();
                    
                    const roleLabel = 
                      member.role === "super_admin" ? "Супер Админ"
                      : member.role === "admin" ? "Админ"
                      : "Менеджер";
                    
                    const roleColor =
                      member.role === "super_admin" ? "#EF4444"
                      : member.role === "admin" ? "#F59E0B"
                      : "#0EA5E9";

                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${(!collapsed || hoverExpand) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        style={{ background: "transparent" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--muted)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <div className="relative flex-shrink-0">
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            style={{ background: roleColor }}
                          >
                            {initials}
                          </div>
                          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-[#1F1F1F]" />
                        </div>
                        {(!collapsed || hoverExpand) && (
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{member.name || member.email}</div>
                            <div className="text-xs truncate" style={{ color: "var(--foreground)", opacity: 0.6 }}>{roleLabel}</div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Footer with rounded bottom corners */}
        <div 
          className="border-t px-3 py-3 rounded-b-2xl"
          style={{ 
            background: "var(--panel)", 
            borderColor: "var(--card-border)" 
          }}
        >
          <button
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ 
              background: "transparent",
              color: "var(--foreground)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--muted)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            onClick={() => {
              if (theme === "light") {
                enableSnow();
              } else {
                toggle();
              }
            }}
            title={theme === "light" ? "Включить снег" : "Переключить тему"}
          >
            {theme === "light" ? <Sun className="h-5 w-5 flex-shrink-0" /> : <Moon className="h-5 w-5 flex-shrink-0" />}
            {(!collapsed || hoverExpand) && (
              <span className="truncate">Тема: {theme === "light" ? "светлая" : "Снег"}</span>
            )}
          </button>
        </div>
    </aside>
    </>
  );
}
