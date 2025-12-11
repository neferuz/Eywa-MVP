"use client";

import { useMemo, useState, useEffect } from "react";
import Card from "@/components/Card";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  Sparkles,
  User,
  BellRing,
  History,
  MessageSquare,
  RotateCw,
  Activity,
  WalletCards,
  X,
} from "lucide-react";

interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit: string;
  attendance30: number;
  engagement: "new" | "renewed" | "notRenewed";
  engagementLabel: string;
  subscription: { title: string; remaining: string; expires: string };
  nextVisit?: string;
  tags: string[];
  notes?: string;
  aiSignals: string[];
  payments: { date: string; item: string; amount: string }[];
  attendanceHistory: { date: string; status: "visited" | "missed" }[];
  upcoming: { when: string; service: string; room: string }[];
  past: { when: string; service: string; status: string }[];
  cancelled: { when: string; reason: string }[];
}

const CLIENTS: ClientProfile[] = [
  {
    id: "c1",
    name: "Иван Петров",
    phone: "+998 90 123 45 67",
    email: "ivan.petrov@example.com",
    lastVisit: "09.11",
    attendance30: 72,
    engagement: "new",
    engagementLabel: "новый",
    subscription: { title: "BODY · 12 занятий", remaining: "4 из 12", expires: "24.11" },
    nextVisit: "13 ноя · 10:00 · Body Mix",
    tags: ["Утренние", "Stretching"],
    notes: "Любит утренние занятия, предпочитает тренера Анну.",
    aiSignals: ["Высокая вовлеченность — посещает 3 раза/неделю", "Рекомендуется предложить персональную сессию"],
    payments: [
      { date: "08.10", item: "BODY · 12 занятий", amount: "2 000 000 сум" },
      { date: "02.09", item: "Персональная тренировка", amount: "300 000 сум" },
    ],
    attendanceHistory: [
      { date: "01.11", status: "visited" },
      { date: "03.11", status: "visited" },
      { date: "05.11", status: "missed" },
      { date: "07.11", status: "visited" },
      { date: "09.11", status: "visited" },
    ],
    upcoming: [
      { when: "13 ноя · 10:00", service: "Body Mix", room: "Зал 1" },
      { when: "15 ноя · 09:30", service: "Stretching", room: "Зал 1" },
    ],
    past: [
      { when: "09 ноя", service: "Йога · База", status: "✔ Посещено" },
      { when: "07 ноя", service: "Reformer", status: "✔ Посещено" },
    ],
    cancelled: [
      { when: "05 ноя", reason: "Поездка" },
    ],
  },
  {
    id: "c2",
    name: "Мария Сидорова",
    phone: "+998 90 123 45 67",
    email: "maria.sid@example.com",
    lastVisit: "02.11",
    attendance30: 65,
    engagement: "renewed",
    engagementLabel: "продлился",
    subscription: { title: "BODY · 8 занятий", remaining: "2 из 8", expires: "18.11" },
    nextVisit: "11 ноя · 19:00 · Barre",
    tags: ["Вечерние", "Барре"],
    notes: "После травмы колена предпочитает лёгкие нагрузки.",
    aiSignals: ["Риск паузы — пропустила 2 занятия", "Рекомендуется позвонить и предложить замену слота"],
    payments: [
      { date: "20.10", item: "BODY · 8 занятий", amount: "1 350 000 сум" },
    ],
    attendanceHistory: [
      { date: "28.10", status: "visited" },
      { date: "30.10", status: "missed" },
      { date: "02.11", status: "visited" },
      { date: "04.11", status: "missed" },
    ],
    upcoming: [
      { when: "11 ноя · 19:00", service: "Barre", room: "Зал 2" },
    ],
    past: [
      { when: "02 ноя", service: "Пилатес", status: "✔ Посещено" },
      { when: "30 окт", service: "Barre", status: "✖ Пропуск" },
    ],
    cancelled: [],
  },
  {
    id: "c3",
    name: "Дмитрий Волков",
    phone: "+998 90 123 45 67",
    lastVisit: "11.10",
    attendance30: 34,
    engagement: "notRenewed",
    engagementLabel: "не продлился",
    subscription: { title: "Reformers · 8 занятий", remaining: "6 из 8", expires: "05.12" },
    tags: ["Утро", "Reformer"],
    aiSignals: ["Падение вовлеченности — 1 посещение за месяц", "Рекомендуется персональный звонок"],
    payments: [
      { date: "01.10", item: "Reformer · 8", amount: "1 700 000 сум" },
    ],
    attendanceHistory: [
      { date: "10.10", status: "visited" },
      { date: "15.10", status: "missed" },
      { date: "24.10", status: "missed" },
    ],
    upcoming: [],
    past: [
      { when: "11 окт", service: "Reformer", status: "✔ Посещено" },
    ],
    cancelled: [
      { when: "15 окт", reason: "Болезнь" },
    ],
  },
  {
    id: "c4",
    name: "Алина Орлова",
    phone: "+998 90 123 45 67",
    lastVisit: "08.11",
    attendance30: 84,
    engagement: "renewed",
    engagementLabel: "продлился",
    subscription: { title: "BODY · 12 занятий", remaining: "9 из 12", expires: "12.12" },
    nextVisit: "10 ноя · 18:30 · Jazz-funk",
    tags: ["Вечерние", "Танцы"],
    aiSignals: ["Планирует продление — интересовалась абонементом", "Предложите пакет + индивидуальная"],
    payments: [
      { date: "05.11", item: "BODY · 12 занятий", amount: "2 000 000 сум" },
    ],
    attendanceHistory: [
      { date: "02.11", status: "visited" },
      { date: "04.11", status: "visited" },
      { date: "06.11", status: "visited" },
      { date: "08.11", status: "visited" },
    ],
    upcoming: [
      { when: "10 ноя · 18:30", service: "Jazz-funk", room: "Зал 1" },
      { when: "12 ноя · 20:00", service: "Body Mix", room: "Зал 1" },
    ],
    past: [
      { when: "08 ноя", service: "Jazz-funk", status: "✔ Посещено" },
    ],
    cancelled: [],
  },
];

const engagementTone: Record<ClientProfile["engagement"], string> = {
  new: "rgba(59, 130, 246, 0.85)",
  renewed: "rgba(22, 163, 74, 0.85)",
  notRenewed: "rgba(220, 38, 38, 0.85)",
};

export default function BodyClientsPage() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [drawerState, setDrawerState] = useState<"closed" | "open" | "closing">("closed");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const checkSidebarState = () => {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') : null;
      setSidebarCollapsed(saved === '1');
    };

    checkSidebarState();
    
    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      checkSidebarState();
    };

    // Проверяем состояние каждые 100ms для синхронизации
    const interval = setInterval(checkSidebarState, 100);
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return CLIENTS;
    return CLIENTS.filter((client) =>
      [client.name, client.phone, client.subscription.title].some((field) =>
        field.toLowerCase().includes(term)
      )
    );
  }, [search]);

  const openClientDrawer = (client: ClientProfile) => {
    setSelectedClient(client);
    setDrawerState("open");
  };

  const closeDrawer = () => {
    setDrawerState("closing");
    setTimeout(() => {
      setDrawerState("closed");
      setSelectedClient(null);
    }, 220);
  };

  return (
    <div className="body-clients">
      <div className="body-clients__header">
        <div>
          <h1>EYWA BODY — Клиенты</h1>
          <p>Оперативное управление клиентами и занятостью студии.</p>
        </div>
        <div className="body-clients__search">
          <Search className="body-clients__search-icon" />
          <input
            type="text"
            placeholder="Поиск по имени, телефону или абонементу"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <section className={`body-clients__grid ${sidebarCollapsed ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {filteredClients.map((client) => {
          const engagementColor = engagementTone[client.engagement];
          return (
            <Card
              key={client.id}
              className="body-clients__card"
              style={{ cursor: "pointer" }}
              onClick={() => openClientDrawer(client)}
            >
              <div className="body-clients__card-head">
                <div className="body-clients__avatar">
                  <User className="h-4 w-4" />
                </div>
                <div className="body-clients__card-meta">
                  <div className="body-clients__card-name">{client.name}</div>
                  <span className="body-clients__card-phone">{client.phone}</span>
                </div>
                <div className="body-clients__engagement" style={{ color: engagementColor }}>
                  {client.engagementLabel}
                </div>
              </div>

              <div className="body-clients__card-stats">
                <div>
                  <span>Последний визит</span>
                  <strong>{client.lastVisit}</strong>
                </div>
                <div>
                  <span>Посещаемость (30д)</span>
                  <strong>{client.attendance30}%</strong>
                </div>
                <div>
                  <span>Абонемент</span>
                  <strong>{client.subscription.remaining}</strong>
                </div>
              </div>

              <div className="body-clients__card-subscription">
                <div>
                  <span>{client.subscription.title}</span>
                  <span>до {client.subscription.expires}</span>
                </div>
                {client.nextVisit && (
                  <div className="body-clients__next-visit">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    {client.nextVisit}
                  </div>
                )}
              </div>

              <div className="body-clients__card-actions">
                <button type="button" onClick={(event) => { event.stopPropagation(); }}>
                  <CalendarCheck className="h-4 w-4" />
                  Записать
                </button>
                <button type="button" onClick={(event) => { event.stopPropagation(); }}>
                  <BellRing className="h-4 w-4" />
                  Напомнить
                </button>
                <button type="button" onClick={(event) => { event.stopPropagation(); }}>
                  <History className="h-4 w-4" />
                  История
                </button>
                <button type="button" onClick={(event) => { event.stopPropagation(); }}>
                  <MessageSquare className="h-4 w-4" />
                  Комментарий
                </button>
              </div>
            </Card>
          );
        })}
      </section>

      {selectedClient && drawerState !== "closed" && (
        <>
          <div className={`calendar-drawer-overlay ${drawerState === "closing" ? "is-closing" : ""}`} onClick={closeDrawer} />
          <aside className={`calendar-drawer ${drawerState === "closing" ? "is-closing" : ""}`}>
            <div className="calendar-drawer__header">
              <div>
                <p className="calendar-drawer__subtitle">Клиент</p>
                <h3 className="calendar-drawer__title">{selectedClient.name}</h3>
              </div>
              <button className="calendar-drawer__close" onClick={closeDrawer} aria-label="Закрыть">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="calendar-drawer__content space-y-6">
              <section className="body-clients__drawer-section">
                <h4>Основная информация</h4>
                <div className="body-clients__drawer-grid">
                  <div><Phone className="h-3.5 w-3.5" />{selectedClient.phone}</div>
                  {selectedClient.email && <div><Mail className="h-3.5 w-3.5" />{selectedClient.email}</div>}
                  <div><Clock className="h-3.5 w-3.5" />Последний визит — {selectedClient.lastVisit}</div>
                  <div><Activity className="h-3.5 w-3.5" />Посещаемость (30д) — {selectedClient.attendance30}%</div>
                  <div><MapPin className="h-3.5 w-3.5" />Теги: {selectedClient.tags.join(", ")}</div>
                </div>
                {selectedClient.notes && <p className="body-clients__drawer-note">{selectedClient.notes}</p>}
              </section>

              <section className="body-clients__drawer-section">
                <h4>Абонементы и оплаты</h4>
                <div className="body-clients__drawer-subscription">
                  <div>
                    <span>{selectedClient.subscription.title}</span>
                    <strong>{selectedClient.subscription.remaining}</strong>
                    <span>действует до {selectedClient.subscription.expires}</span>
                  </div>
                  <RotateCw className="h-4 w-4" />
                </div>
                <div className="body-clients__drawer-payments">
                  {selectedClient.payments.map((payment) => (
                    <div key={payment.date}>
                      <span>{payment.date}</span>
                      <span>{payment.item}</span>
                      <strong>{payment.amount}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="body-clients__drawer-section">
                <h4>Посещаемость (30 дней)</h4>
                <div className="body-clients__drawer-attendance">
                  {selectedClient.attendanceHistory.map((entry) => (
                    <span
                      key={entry.date}
                      className={`body-clients__attendance-pill ${entry.status === "visited" ? "is-visited" : "is-missed"}`}
                    >
                      {entry.date}
                    </span>
                  ))}
                </div>
              </section>

              <section className="body-clients__drawer-section">
                <h4>AI сигналы</h4>
                <ul className="body-clients__drawer-ai">
                  {selectedClient.aiSignals.map((signal, index) => (
                    <li key={index}><Sparkles className="h-4 w-4" />{signal}</li>
                  ))}
                </ul>
              </section>

              <section className="body-clients__drawer-section">
                <h4>Записи</h4>
                <div className="body-clients__drawer-schedule">
                  <div>
                    <span>Предстоящие</span>
                    {selectedClient.upcoming.length ? (
                      selectedClient.upcoming.map((entry) => (
                        <div key={entry.when}><CalendarCheck className="h-3.5 w-3.5" />{entry.when} — {entry.service} ({entry.room})</div>
                      ))
                    ) : (
                      <div className="body-clients__drawer-empty">Нет записей</div>
                    )}
                  </div>
                  <div>
                    <span>Прошедшие</span>
                    {selectedClient.past.length ? (
                      selectedClient.past.map((entry) => (
                        <div key={entry.when}><CheckCircle2 className="h-3.5 w-3.5" />{entry.when} — {entry.service} ({entry.status})</div>
                      ))
                    ) : (
                      <div className="body-clients__drawer-empty">Нет данных</div>
                    )}
                  </div>
                  <div>
                    <span>Отменённые</span>
                    {selectedClient.cancelled.length ? (
                      selectedClient.cancelled.map((entry) => (
                        <div key={entry.when}><WalletCards className="h-3.5 w-3.5" />{entry.when} — {entry.reason}</div>
                      ))
                    ) : (
                      <div className="body-clients__drawer-empty">Нет отмен</div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="body-clients__drawer-actions">
              <button type="button" className="calendar-drawer__form-btn calendar-drawer__form-btn--submit">
                <CalendarCheck className="h-4 w-4" />Записать
              </button>
              <button type="button" className="calendar-drawer__form-btn">
                <RotateCw className="h-4 w-4" />Продлить абонемент
              </button>
              <button type="button" className="calendar-drawer__form-btn">
                <BellRing className="h-4 w-4" />Напоминание
              </button>
              <button type="button" className="calendar-drawer__form-btn">
                <WalletCards className="h-4 w-4" />Добавить оплату
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
