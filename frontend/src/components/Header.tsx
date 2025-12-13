"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Aperture, User, LogOut, Search, Menu } from "lucide-react";
import { DateRange } from "react-day-picker";
import DateRangePicker from "@/components/DateRangePicker";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("admin@eywa.space");
  
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

  return (
    <header
      className="sticky top-0 z-20 w-full backdrop-blur-sm"
      style={{ 
        background: "var(--panel)", 
        borderBottom: "1px solid var(--card-border)"
      }}
    >
      <div className="flex flex-col gap-2.5 px-4 py-2.5 md:gap-4 md:px-6 md:py-4 lg:flex-row lg:items-center lg:gap-4">
        {/* Top row: Logo, burger, title (on mobile), and action buttons */}
        <div className="flex items-center justify-between gap-2 lg:flex-1 lg:justify-start lg:gap-3">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            {/* Burger menu button for mobile */}
            <button
              onClick={onMenuClick}
              className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 hover:bg-black/[.04] dark:hover:bg-white/[.06] shrink-0"
              style={{ border: '1px solid var(--card-border)' }}
              aria-label="Открыть меню"
              title="Открыть меню"
            >
              <Menu className="h-5 w-5" style={{ color: 'var(--foreground)' }} />
            </button>
            
            <div
              className="h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 shrink-0"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                border: '1px solid var(--card-border)'
              }}
            >
              <Aperture className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>

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
                <h1 className="text-lg font-semibold">Расписание и бронирования</h1>
                <p className="text-xs text-zinc-500">Управляйте слотами, продлениями и оплатами в одном экране.</p>
              </div>
            )}

            {/* Title on desktop for payments history - inline with logo */}
            {isPaymentsHistoryPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">История оплат</h1>
                <p className="text-xs text-zinc-500">Список всех проведенных оплат и транзакций</p>
              </div>
            )}

            {/* Title on desktop for applications - inline with logo */}
            {isApplicationsPage && !isDashboard && !isApplicationDetailPage && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">Канбан лидов</h1>
                <p className="text-xs text-zinc-500">Instagram и Telegram конвейер в одном экране</p>
              </div>
            )}

            {/* Title on desktop for body clients - inline with logo */}
            {isBodyClientsPage && !isDashboard && !isBodyClientDetailPage && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">EYWA BODY — Клиенты</h1>
                <p className="text-xs text-zinc-500">Оперативное управление клиентами и занятостью студии.</p>
              </div>
            )}

            {/* Title on desktop for body client detail - inline with logo */}
            {isBodyClientDetailPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">Профиль клиента</h1>
                <p className="text-xs text-zinc-500">Карта клиента: договор, абонемент, визиты, заметки.</p>
              </div>
            )}

            {/* Title on desktop for body trainers - inline with logo */}
            {isBodyTrainersPage && !isDashboard && !isBodyTrainerDetailPage && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">EYWA BODY — Тренеры</h1>
                <p className="text-xs text-zinc-500">Команда специалистов по направлениям Body & Mind.</p>
              </div>
            )}

            {/* Title on desktop for body trainer detail - inline with logo */}
            {isBodyTrainerDetailPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">Профиль тренера</h1>
                <p className="text-xs text-zinc-500">Карта тренера: контакты, направления, график, заметки.</p>
              </div>
            )}

            {/* Title on desktop for body schedule - inline with logo */}
            {isBodySchedulePage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">EYWA BODY · Расписание</h1>
                <p className="text-xs text-zinc-500">Аналитика загруженности и расписания занятий.</p>
              </div>
            )}

            {/* Title on desktop for body subscriptions - inline with logo */}
            {isBodySubscriptionsPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">EYWA BODY · Абонементы</h1>
                <p className="text-xs text-zinc-500">Управление абонементами клиентов.</p>
              </div>
            )}

            {/* Title on desktop for staff list - inline with logo */}
            {isStaffListPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">Доступы и сотрудники</h1>
                <p className="text-xs text-zinc-500">Добавляйте сотрудников, настраивайте роли и доступ к страницам.</p>
              </div>
            )}

            {/* Title on desktop for body services - inline with logo */}
            {isBodyServicesPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">EYWA BODY · Услуги</h1>
                <p className="text-xs text-zinc-500">Создавайте, редактируйте и удаляйте услуги Body & Mind.</p>
              </div>
            )}

            {/* Title on desktop for coworking places - inline with logo */}
            {isCoworkingPlacesPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">Капсулы и места</h1>
                <p className="text-xs text-zinc-500">Живой план посадочных зон: индивидуальные капсулы, командные пространства и ивент-зона. Обновляется вместе с CRM.</p>
              </div>
            )}

            {/* Title on desktop for kids services - inline with logo */}
            {isKidsServicesPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">KIDS услуги</h1>
                <p className="text-xs text-zinc-500">Управление услугами для детских программ. Добавляйте, редактируйте и удаляйте услуги.</p>
              </div>
            )}

            {/* Title on desktop for marketing traffic - inline with logo */}
            {isMarketingTrafficPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">EYWA MARKETING · Источники заявок</h1>
                <p className="text-xs text-zinc-500">Актуальные лиды по каналам из Telegram / Instagram.</p>
              </div>
            )}

            {/* Title on desktop for marketing conversions - inline with logo */}
            {isMarketingConversionsPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">EYWA MARKETING · Конверсии</h1>
                <p className="text-xs text-zinc-500">Воронка заявка → запись → визит → продажа по каналам.</p>
              </div>
            )}

            {/* Title on desktop for marketing ROI - inline with logo */}
            {isMarketingROIPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">EYWA MARKETING · ROI и эффективность</h1>
                <p className="text-xs text-zinc-500">Анализ возврата инвестиций и эффективности маркетинговых каналов.</p>
              </div>
            )}

            {/* Title on desktop for payments - inline with logo */}
            {isPaymentsPage && !isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">Быстрая продажа услуг</h1>
                <p className="text-xs text-zinc-500">Выберите категорию, сформируйте чек и закрепите оплату за клиентом</p>
              </div>
            )}

            {/* Title on desktop for dashboard - inline with logo */}
            {isDashboard && (
              <div className="hidden lg:flex flex-col min-w-0">
                <h1 className="text-lg font-semibold">Общий обзор</h1>
                <p className="text-xs text-zinc-500">Ключевые цифры EYWA SPACE за сегодня.</p>
              </div>
            )}

            {/* Dashboard controls on desktop - after title */}
            {isDashboard && (
              <div className="hidden lg:flex items-center gap-4 flex-1">
                <DateRangePicker value={range} onChange={setRange} />
                <div className="flex items-center relative w-full sm:w-auto sm:min-w-[280px]">
                  <Search className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    placeholder="Поиск (клиент, занятость)..."
                    className="h-9 md:h-10 w-full sm:w-72 pl-10 pr-4 text-sm rounded-xl focus:outline-none"
                    style={{
                      background: "var(--muted)",
                      border: "1px solid var(--card-border)",
                      color: "var(--foreground)",
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons - always visible on right */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0 lg:ml-auto">
            <button
              className="relative h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              style={{ border: '1px solid var(--card-border)' }}
              aria-label="Уведомления"
              title="Уведомления"
            >
              <Bell className="h-4 w-4 md:h-4.5 md:w-4.5" style={{ color: 'var(--foreground)' }} />
              <span 
                className="absolute -top-0.5 -right-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
              >
                3
              </span>
            </button>

            {/* Profile - icon only on mobile, full on desktop */}
            <button
              className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              style={{ border: '1px solid var(--card-border)' }}
              title="Профиль"
            >
              <div 
                className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                style={{ 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                }}
              >
                <User className="h-3.5 w-3.5 text-white" />
              </div>
            </button>

            {/* Profile - full version on desktop */}
            <div className="hidden md:flex items-center gap-2">
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
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>Администратор</span>
                  <span className="text-[10px] text-zinc-500 leading-tight">{userEmail}</span>
                </div>
              </button>
              
              <button
                onClick={handleLogout}
                className="h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 hover:bg-red-500/10"
                style={{ border: '1px solid var(--card-border)' }}
                title="Выход"
              >
                <LogOut className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {isDashboard && (
          <div className="w-full lg:hidden">
            <h1 className="text-base md:text-lg font-semibold truncate">Общий обзор</h1>
            <p className="text-xs text-zinc-500">Ключевые цифры EYWA SPACE за сегодня.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mt-2.5">
              <DateRangePicker value={range} onChange={setRange} />
              <div className="flex items-center relative w-full sm:w-auto sm:min-w-[280px]">
                <Search className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  placeholder="Поиск (клиент, занятость)..."
                  className="h-9 md:h-10 w-full sm:w-72 pl-10 pr-4 text-sm rounded-xl focus:outline-none"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--card-border)",
                    color: "var(--foreground)",
                  }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

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

      </div>
    </header>
  );
}


