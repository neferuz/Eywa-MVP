"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, User, LogOut, Search, Menu, Zap, UserPlus, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import DateRangePicker from "@/components/DateRangePicker";
import { useTheme } from "@/components/ThemeProvider";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("admin@eywa.space");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  useEffect(() => {
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserEmail(user.email || "admin@eywa.space");
      } catch {
        // ignore
      }
    }
  }, []);

  // Закрываем выпадающее меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  };

  // Удалено: проверка логина теперь в LayoutWrapper
  const isDashboard = pathname === "/";
  const isScheduleLoadPage = pathname === "/schedule/load";
  const isTodayPage = pathname === "/dashboard/today";
  const isPaymentsPage = pathname === "/payments";
  const isPaymentsHistoryPage = pathname === "/payments/history";
  const isApplicationsPage = pathname === "/applications";
  const isApplicationDetailPage = pathname?.startsWith("/applications/") && pathname !== "/applications";
  const isMarketingTrafficPage = pathname === "/marketing/traffic";
  const isMarketingConversionsPage = pathname === "/marketing/conversions";
  const isMarketingROIPage = pathname === "/marketing/roi";
  const isBodyClientsPage = pathname === "/body/clients";
  const isBodyClientDetailPage = pathname?.startsWith("/body/clients/") ?? false;
  const isBodyServicesPage = pathname === "/body/services";
  const isBodyTrainersPage = pathname === "/body/trainers";
  const isBodyTrainerDetailPage = pathname?.startsWith("/body/trainers/") ?? false;
  const isBodySchedulePage = pathname === "/body/schedule";
  const isBodySubscriptionsPage = pathname === "/body/subscriptions";
  const isStaffListPage = pathname === "/staff/list";
  const isCoworkingPlacesPage = pathname === "/coworking/places";
  const isKidsServicesPage = pathname === "/kids/services";
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });

  const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formatDateRange = () => {
    if (!range?.from) return "";
    if (range.from && range.to) {
      return `${dateFormatter.format(range.from)} - ${dateFormatter.format(range.to)}`;
    }
    return dateFormatter.format(range.from);
  };

  const { theme } = useTheme();

  return (
    <header
      className="sticky top-0 z-20 w-full"
      style={{ 
        background: theme === "dark" 
          ? "rgba(31, 31, 31, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        isolation: "isolate"
      }}
    >
      <div className="flex flex-col gap-2.5 px-4 py-2.5 md:gap-4 md:px-6 md:py-4 lg:flex-row lg:items-center lg:gap-4">
        {isDashboard ? (
          <>
            {/* Dashboard header - title left, icons right (desktop) */}
            <div className="hidden lg:flex items-center w-full" style={{ justifyContent: "space-between" }}>
              {/* Title - left */}
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Дашборд</h1>
                <p className="text-xs text-zinc-500">Обзор статистики и ключевых метрик</p>
              </div>

              {/* Icons - right */}
              <div className="flex items-center gap-2 md:gap-3 shrink-0 lg:ml-auto">
                {/* Lightning with notification */}
                <button
                  className="relative h-10 w-10 rounded-lg flex items-center justify-center transition-all hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                  style={{ color: "var(--foreground)" }}
                  title="Quick actions"
                >
                  <Zap className="h-5 w-5" />
                  <span
                    className="absolute top-1 right-1 h-2 w-2 rounded-full"
                    style={{ background: "#000" }}
                  />
                </button>

                {/* Bell notifications */}
                <button
                  className="h-10 w-10 rounded-lg flex items-center justify-center transition-all hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                  style={{ color: "var(--foreground)" }}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </button>

                {/* Separator */}
                <div className="h-6 w-px" style={{ background: "var(--card-border)" }} />

                {/* Profile with dropdown */}
                <div className="profile-dropdown-container" style={{ position: "relative" }}>
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                      style={{
                        background: "var(--muted)",
                      }}
                    >
                      <User className="h-5 w-5" style={{ color: "var(--foreground)" }} />
                    </div>
                    <ChevronDown className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.6 }} />
                  </button>
                  {profileDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 0.5rem)",
                        right: 0,
                        minWidth: "200px",
                        borderRadius: "12px",
                        background: "var(--panel)",
                        border: "1px solid var(--card-border)",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                        zIndex: 1000,
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => {
                          handleLogout();
                          setProfileDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.75rem 1rem",
                          background: "transparent",
                          border: "none",
                          color: "#EF4444",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dashboard header - mobile */}
            <div className="w-full lg:hidden">
              {/* Title on mobile */}
              <div className="mb-3">
                <h1 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Дашборд</h1>
              </div>
              {/* Icons on mobile */}
              <div className="flex items-center justify-end gap-3">
                <button
                  className="relative h-10 w-10 rounded-lg flex items-center justify-center transition-all hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                  style={{ color: "var(--foreground)" }}
                >
                  <Zap className="h-5 w-5" />
                  <span
                    className="absolute top-1 right-1 h-2 w-2 rounded-full"
                    style={{ background: "#000" }}
                  />
                </button>
                <button
                  className="h-10 w-10 rounded-lg flex items-center justify-center transition-all hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                  style={{ color: "var(--foreground)" }}
                >
                  <Bell className="h-5 w-5" />
                </button>
                <div className="h-6 w-px" style={{ background: "var(--card-border)" }} />
                <div className="profile-dropdown-container" style={{ position: "relative" }}>
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                      style={{
                        background: "var(--muted)",
                      }}
                    >
                      <User className="h-5 w-5" style={{ color: "var(--foreground)" }} />
                    </div>
                    <ChevronDown className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.6 }} />
                  </button>
                  {profileDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 0.5rem)",
                        right: 0,
                        minWidth: "200px",
                        borderRadius: "12px",
                        background: "var(--panel)",
                        border: "1px solid var(--card-border)",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                        zIndex: 1000,
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => {
                          handleLogout();
                          setProfileDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.75rem 1rem",
                          background: "transparent",
                          border: "none",
                          color: "#EF4444",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Regular header for other pages */
          <>
        {/* Top row: Logo, burger, title (on mobile), and action buttons */}
        <div className="flex items-center justify-between gap-2 lg:flex-1 lg:justify-start lg:gap-3">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            {/* Burger menu button for mobile */}
              {!isDashboard && (
            <button
              onClick={onMenuClick}
              className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 hover:bg-black/[.04] dark:hover:bg-white/[.06] shrink-0"
              style={{ border: '1px solid var(--card-border)' }}
              aria-label="Открыть меню"
              title="Открыть меню"
            >
              <Menu className="h-5 w-5" style={{ color: 'var(--foreground)' }} />
            </button>
              )}

            {/* Title on mobile - compact version */}
            {isScheduleLoadPage && !isDashboard && (
              <div className="lg:hidden min-w-0 flex-1">
                <h1 className="text-sm font-semibold truncate">Расписание и бронирования</h1>
              </div>
            )}

            {/* Title on mobile for body client detail */}
            {isBodyClientDetailPage && !isDashboard && (
              <div className="lg:hidden min-w-0 flex-1">
                <h1 className="text-sm font-semibold truncate">Профиль клиента</h1>
              </div>
            )}

            {/* Title on mobile for body trainer detail */}
            {isBodyTrainerDetailPage && !isDashboard && (
              <div className="lg:hidden min-w-0 flex-1">
                <h1 className="text-sm font-semibold truncate">Профиль тренера</h1>
              </div>
            )}

            {/* Title on mobile for body schedule */}
            {isBodySchedulePage && !isDashboard && (
              <div className="lg:hidden min-w-0 flex-1">
                <h1 className="text-sm font-semibold truncate">EYWA BODY · Расписание</h1>
              </div>
            )}

            {/* Title on mobile for body subscriptions */}
            {isBodySubscriptionsPage && !isDashboard && (
              <div className="lg:hidden min-w-0 flex-1">
                <h1 className="text-sm font-semibold truncate">EYWA BODY · Абонементы</h1>
              </div>
            )}

            {/* Title on desktop - inline with logo */}
            {isScheduleLoadPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Расписание и бронирования</h1>
                <p className="text-xs text-zinc-500">Управляйте слотами, продлениями и оплатами в одном экране.</p>
              </div>
            )}

            {/* Title on desktop for payments history - inline with logo */}
            {isPaymentsHistoryPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>История оплат</h1>
                <p className="text-xs text-zinc-500">Список всех проведенных оплат и транзакций</p>
              </div>
            )}

            {/* Title on desktop for applications - inline with logo */}
            {isApplicationsPage && !isDashboard && !isApplicationDetailPage && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Канбан лидов</h1>
                <p className="text-xs text-zinc-500">Instagram и Telegram конвейер в одном экране</p>
              </div>
            )}

            {/* Title on desktop for body clients - inline with logo */}
            {isBodyClientsPage && !isDashboard && !isBodyClientDetailPage && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>EYWA BODY — Клиенты</h1>
                <p className="text-xs text-zinc-500">Оперативное управление клиентами и занятостью студии.</p>
              </div>
            )}

            {/* Title on desktop for body client detail - inline with logo */}
            {isBodyClientDetailPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Профиль клиента</h1>
                <p className="text-xs text-zinc-500">Карта клиента: договор, абонемент, визиты, заметки.</p>
              </div>
            )}

            {/* Title on desktop for body trainers - inline with logo */}
            {isBodyTrainersPage && !isDashboard && !isBodyTrainerDetailPage && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>EYWA BODY — Тренеры</h1>
                <p className="text-xs text-zinc-500">Команда специалистов по направлениям Body & Mind.</p>
              </div>
            )}

            {/* Title on desktop for body trainer detail - inline with logo */}
            {isBodyTrainerDetailPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Профиль тренера</h1>
                <p className="text-xs text-zinc-500">Карта тренера: контакты, направления, график, заметки.</p>
              </div>
            )}

            {/* Title on desktop for body schedule - inline with logo */}
            {isBodySchedulePage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>EYWA BODY · Расписание</h1>
                <p className="text-xs text-zinc-500">Аналитика загруженности и расписания занятий.</p>
              </div>
            )}

            {/* Title on desktop for body subscriptions - inline with logo */}
            {isBodySubscriptionsPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>EYWA BODY · Абонементы</h1>
                <p className="text-xs text-zinc-500">Управление абонементами клиентов.</p>
              </div>
            )}

            {/* Title on desktop for staff list - inline with logo */}
            {isStaffListPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Доступы и сотрудники</h1>
                <p className="text-xs text-zinc-500">Добавляйте сотрудников, настраивайте роли и доступ к страницам.</p>
              </div>
            )}

            {/* Title on desktop for body services - inline with logo */}
            {isBodyServicesPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>EYWA BODY · Услуги</h1>
                <p className="text-xs text-zinc-500">Создавайте, редактируйте и удаляйте услуги Body & Mind.</p>
              </div>
            )}

            {/* Title on desktop for coworking places - inline with logo */}
            {isCoworkingPlacesPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Капсулы и места</h1>
                <p className="text-xs text-zinc-500">Живой план посадочных зон: индивидуальные капсулы, командные пространства и ивент-зона. Обновляется вместе с CRM.</p>
              </div>
            )}

            {/* Title on desktop for kids services - inline with logo */}
            {isKidsServicesPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>KIDS услуги</h1>
                <p className="text-xs text-zinc-500">Управление услугами для детских программ. Добавляйте, редактируйте и удаляйте услуги.</p>
              </div>
            )}

            {/* Title on desktop for marketing traffic - inline with logo */}
            {isMarketingTrafficPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>EYWA MARKETING · Источники заявок</h1>
                <p className="text-xs text-zinc-500">Актуальные лиды по каналам из Telegram / Instagram.</p>
              </div>
            )}

            {/* Title on desktop for marketing conversions - inline with logo */}
            {isMarketingConversionsPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>EYWA MARKETING · Конверсии</h1>
                <p className="text-xs text-zinc-500">Воронка заявка → запись → визит → продажа по каналам.</p>
              </div>
            )}

            {/* Title on desktop for marketing ROI - inline with logo */}
            {isMarketingROIPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>EYWA MARKETING · ROI и эффективность</h1>
                <p className="text-xs text-zinc-500">Анализ возврата инвестиций и эффективности маркетинговых каналов.</p>
              </div>
            )}

            {/* Title on desktop for payments - inline with logo */}
            {isPaymentsPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Быстрая продажа услуг</h1>
                <p className="text-xs text-zinc-500">Выберите категорию, сформируйте чек и закрепите оплату за клиентом</p>
              </div>
            )}

          </div>

          {/* Action buttons - always visible on right */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0 lg:ml-auto">
            {/* Lightning with notification */}
            <button
              className="relative h-9 w-9 md:h-10 md:w-10 rounded-lg flex items-center justify-center transition-all hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              style={{ color: "var(--foreground)" }}
              title="Quick actions"
            >
              <Zap className="h-4 w-4 md:h-5 md:w-5" />
              <span
                className="absolute top-1 right-1 h-2 w-2 rounded-full"
                style={{ background: "#000" }}
              />
            </button>

            {/* Bell notifications */}
            <button
              className="h-9 w-9 md:h-10 md:w-10 rounded-lg flex items-center justify-center transition-all hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              style={{ color: "var(--foreground)" }}
              title="Notifications"
            >
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px" style={{ background: "var(--card-border)" }} />

            {/* Profile with dropdown */}
            <div className="profile-dropdown-container" style={{ position: "relative" }}>
              <button 
                className="flex items-center gap-2"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{ cursor: "pointer" }}
              >
                <div
                  className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    background: "var(--muted)",
                  }}
                >
                  <User className="h-4 w-4 md:h-5 md:w-5" style={{ color: "var(--foreground)" }} />
                </div>
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4" style={{ color: "var(--foreground)", opacity: 0.6 }} />
              </button>
              {profileDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 0.5rem)",
                    right: 0,
                    minWidth: "200px",
                    borderRadius: "12px",
                    background: "var(--panel)",
                    border: "1px solid var(--card-border)",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      background: "transparent",
                      border: "none",
                      color: "#EF4444",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>

        {isScheduleLoadPage && !isDashboard && (
          <div className="w-full lg:hidden">
            {/* Description only on mobile, title already shown above */}
            <p className="text-xs text-zinc-500">Управляйте слотами, продлениями и оплатами в одном экране.</p>
          </div>
        )}

        {isBodyClientDetailPage && !isDashboard && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">Профиль клиента</h1>
            <p className="text-xs text-zinc-500">Карта клиента: договор, абонемент, визиты, заметки.</p>
          </div>
        )}

        {isMarketingTrafficPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">EYWA MARKETING · Источники заявок</h1>
            <p className="text-xs text-zinc-500">Актуальные лиды по каналам из Telegram / Instagram.</p>
          </div>
        )}

        {isMarketingConversionsPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">EYWA MARKETING · Конверсии</h1>
            <p className="text-xs text-zinc-500">Воронка заявка → запись → визит → продажа по каналам.</p>
          </div>
        )}

        {isMarketingROIPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">EYWA MARKETING · ROI и эффективность</h1>
            <p className="text-xs text-zinc-500">Анализ возврата инвестиций и эффективности маркетинговых каналов.</p>
          </div>
        )}

        {isStaffListPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">Доступы и сотрудники</h1>
            <p className="text-xs text-zinc-500">Добавляйте сотрудников, настраивайте роли и доступ к страницам.</p>
          </div>
        )}

        {isCoworkingPlacesPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">Капсулы и места</h1>
            <p className="text-xs text-zinc-500">Живой план посадочных зон: индивидуальные капсулы, командные пространства и ивент-зона. Обновляется вместе с CRM.</p>
          </div>
        )}

        {isKidsServicesPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">KIDS услуги</h1>
            <p className="text-xs text-zinc-500">Управление услугами для детских программ. Добавляйте, редактируйте и удаляйте услуги.</p>
          </div>
        )}

        {isTodayPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && (
          <div className="w-full flex flex-col gap-2.5 md:gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-lg font-semibold break-words">Записи на сегодня</h1>
              <p className="text-xs text-zinc-500 hidden sm:block">Следите за статусом посещений и реагируйте мгновенно</p>
            </div>
          </div>
        )}

        {isPaymentsPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            {/* Description only on mobile, title already shown above */}
            <h1 className="text-base md:text-lg font-semibold break-words">Быстрая продажа услуг</h1>
            <p className="text-xs text-zinc-500">Выберите категорию, сформируйте чек и закрепите оплату за клиентом</p>
          </div>
        )}

        {isPaymentsHistoryPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">История оплат</h1>
            <p className="text-xs text-zinc-500">Список всех проведенных оплат и транзакций</p>
          </div>
        )}

        {isApplicationsPage && !isDashboard && !isScheduleLoadPage && !isApplicationDetailPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">Канбан лидов</h1>
            <p className="text-xs text-zinc-500">Instagram и Telegram конвейер в одном экране</p>
          </div>
        )}

        {isApplicationDetailPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && !isTodayPage && !isPaymentsPage && !isApplicationsPage && (
          <div className="w-full flex flex-col gap-2.5 md:gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-lg font-semibold break-words">Детали заявки</h1>
              <p className="text-xs text-zinc-500 hidden sm:block">Полная информация о заявке, история переписки и статус обработки</p>
            </div>
          </div>
        )}

        {isBodyClientsPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">EYWA BODY — Клиенты</h1>
            <p className="text-xs text-zinc-500">Оперативное управление клиентами и занятостью студии.</p>
          </div>
        )}


        {isBodyServicesPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">EYWA BODY · Услуги</h1>
            <p className="text-xs text-zinc-500">Создавайте, редактируйте и удаляйте услуги Body & Mind.</p>
          </div>
        )}

        {isBodyTrainersPage && !isDashboard && !isScheduleLoadPage && !isBodyTrainerDetailPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">EYWA BODY — Тренеры</h1>
            <p className="text-xs text-zinc-500">Команда специалистов по направлениям Body & Mind.</p>
          </div>
        )}

        {isBodySchedulePage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">EYWA BODY · Расписание</h1>
            <p className="text-xs text-zinc-500">Аналитика загруженности и расписания занятий.</p>
          </div>
        )}

        {isBodySubscriptionsPage && !isDashboard && !isScheduleLoadPage && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold break-words">EYWA BODY · Абонементы</h1>
            <p className="text-xs text-zinc-500">Управление абонементами клиентов.</p>
          </div>
        )}

        {isBodyTrainerDetailPage &&
          !isDashboard &&
          !isScheduleLoadPage &&
          !isTodayPage &&
          !isPaymentsPage &&
          !isApplicationsPage &&
          !isBodyClientsPage &&
          !isBodyClientDetailPage &&
          !isBodyServicesPage &&
          !isBodyTrainersPage &&
          !isBodySchedulePage &&
          !isStaffListPage && (
            <div className="w-full lg:hidden">
              <h1 className="text-base md:text-lg font-semibold break-words">Профиль тренера</h1>
              <p className="text-xs text-zinc-500">Карта тренера: контакты, направления, график, заметки.</p>
            </div>
          )}
    </header>
  );
}


