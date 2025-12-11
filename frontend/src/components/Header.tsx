"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Aperture, User, LogOut, Search } from "lucide-react";
import { DateRange } from "react-day-picker";
import DateRangePicker from "@/components/DateRangePicker";

export default function Header() {
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
  const isBodyClientsPage = pathname === "/body/clients";
  const isBodyClientDetailPage = pathname?.startsWith("/body/clients/") ?? false;
  const isBodyServicesPage = pathname === "/body/services";
  const isBodyTrainersPage = pathname === "/body/trainers";
  const isBodyTrainerDetailPage = pathname?.startsWith("/body/trainers/") ?? false;
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
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            border: '1px solid var(--card-border)'
          }}
        >
          <Aperture className="h-5 w-5 text-white" />
        </div>

        {isDashboard && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Общий обзор</h1>
              <p className="text-xs text-zinc-500">Ключевые цифры EYWA SPACE за сегодня.</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 lg:justify-end">
              <DateRangePicker value={range} onChange={setRange} />

              <div className="flex items-center relative w-full sm:w-auto sm:min-w-[280px]">
                <Search className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  placeholder="Поиск (клиент, занятость)..."
                  className="h-10 w-full sm:w-72 pl-10 pr-4 text-sm rounded-xl focus:outline-none"
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

        {isMarketingTrafficPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && !isTodayPage && !isPaymentsPage && !isApplicationsPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">EYWA MARKETING · Источники заявок</h1>
              <p className="text-xs text-zinc-500">Актуальные лиды по каналам из Telegram / Instagram.</p>
            </div>
          </div>
        )}

        {isMarketingConversionsPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && !isTodayPage && !isPaymentsPage && !isApplicationsPage && !isMarketingTrafficPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">EYWA MARKETING · Конверсии</h1>
              <p className="text-xs text-zinc-500">Воронка заявка → запись → визит → продажа по каналам.</p>
            </div>
          </div>
        )}

        {isScheduleLoadPage && !isDashboard && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Расписание и бронирования</h1>
              <p className="text-xs text-zinc-500">Управляйте слотами, продлениями и оплатами в одном экране.</p>
            </div>
          </div>
        )}

        {isStaffListPage && !isDashboard && !isScheduleLoadPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Доступы и сотрудники</h1>
              <p className="text-xs text-zinc-500">Добавляйте сотрудников, настраивайте роли и доступ к страницам.</p>
            </div>
          </div>
        )}

        {isCoworkingPlacesPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Капсулы и места</h1>
              <p className="text-xs text-zinc-500">Живой план посадочных зон: индивидуальные капсулы, командные пространства и ивент-зона. Обновляется вместе с CRM.</p>
            </div>
          </div>
        )}

        {isKidsServicesPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && !isCoworkingPlacesPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">KIDS услуги</h1>
              <p className="text-xs text-zinc-500">Управление услугами для детских программ. Добавляйте, редактируйте и удаляйте услуги.</p>
            </div>
          </div>
        )}

        {isTodayPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Записи на сегодня</h1>
              <p className="text-xs text-zinc-500">Следите за статусом посещений и реагируйте мгновенно</p>
            </div>
          </div>
        )}

        {isPaymentsPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && !isTodayPage && !isPaymentsHistoryPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Быстрая продажа услуг</h1>
              <p className="text-xs text-zinc-500">Выберите категорию, сформируйте чек и закрепите оплату за клиентом</p>
            </div>
          </div>
        )}

        {isPaymentsHistoryPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && !isTodayPage && !isPaymentsPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">История оплат</h1>
              <p className="text-xs text-zinc-500">Список всех проведенных оплат и транзакций</p>
            </div>
          </div>
        )}

        {isApplicationsPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && !isTodayPage && !isPaymentsPage && !isApplicationDetailPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Канбан лидов</h1>
              <p className="text-xs text-zinc-500">Instagram и Telegram конвейер в одном экране</p>
            </div>
          </div>
        )}

        {isApplicationDetailPage && !isDashboard && !isScheduleLoadPage && !isStaffListPage && !isTodayPage && !isPaymentsPage && !isApplicationsPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Детали заявки</h1>
              <p className="text-xs text-zinc-500">Полная информация о заявке, история переписки и статус обработки</p>
            </div>
          </div>
        )}

        {isBodyClientsPage && !isDashboard && !isScheduleLoadPage && !isTodayPage && !isPaymentsPage && !isApplicationsPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">EYWA BODY — Клиенты</h1>
              <p className="text-xs text-zinc-500">Оперативное управление клиентами и занятостью студии.</p>
            </div>
          </div>
        )}

        {isBodyClientDetailPage && !isDashboard && !isScheduleLoadPage && !isTodayPage && !isPaymentsPage && !isApplicationsPage && !isBodyClientsPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Профиль клиента</h1>
              <p className="text-xs text-zinc-500">Карта клиента: договор, абонемент, визиты, заметки.</p>
            </div>
          </div>
        )}

        {isBodyServicesPage && !isDashboard && !isScheduleLoadPage && !isTodayPage && !isPaymentsPage && !isApplicationsPage && !isBodyClientsPage && !isBodyClientDetailPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">EYWA BODY · Услуги</h1>
              <p className="text-xs text-zinc-500">Создавайте, редактируйте и удаляйте услуги Body & Mind.</p>
            </div>
          </div>
        )}

        {isBodyTrainersPage && !isDashboard && !isScheduleLoadPage && !isTodayPage && !isPaymentsPage && !isApplicationsPage && (
          <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">EYWA BODY — Тренеры</h1>
              <p className="text-xs text-zinc-500">Команда специалистов по направлениям Body & Mind.</p>
            </div>
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
          !isStaffListPage && (
            <div className="flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-lg font-semibold">Профиль тренера</h1>
                <p className="text-xs text-zinc-500">Карта тренера: контакты, направления, график, заметки.</p>
              </div>
            </div>
          )}

        <div className="ml-auto flex items-center gap-3">
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
    </header>
  );
}


