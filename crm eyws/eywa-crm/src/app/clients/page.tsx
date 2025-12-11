"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import { Plus, Users, UserPlus, Search, Filter, Instagram, MessageCircle, UsersRound, Globe } from "lucide-react";
import Link from "next/link";
import { CLIENTS } from "@/data/clients";

type ClientStatus = "Активный" | "Новый" | "Ушедший";
type ClientDirection = "Body" | "Coworking" | "Coffee";

type Subscription = { name: string; validTill: string };
type Client = {
  id: string;
  name: string;
  phone: string;
  instagram?: string;
  source: "Instagram" | "Telegram" | "Рекомендации" | "Google";
  direction: ClientDirection;
  status: ClientStatus;
  subscriptions: Subscription[];
  visits: string[]; // ISO dates
  contraindications?: string;
  coachNotes?: string;
};

const MOCK_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Иван Петров",
    phone: "+7 900 123-45-67",
    instagram: "@ivan.fit",
    source: "Instagram",
    direction: "Body",
    status: "Активный",
    subscriptions: [{ name: "Body 12 занятий", validTill: "2026-01-15" }],
    visits: ["2025-11-02", "2025-11-05"],
    contraindications: "Нет",
    coachNotes: "Фокус на спине, избегать осевых нагрузок",
  },
  {
    id: "c2",
    name: "Мария Смирнова",
    phone: "+7 901 222-33-44",
    instagram: "@masha.space",
    source: "Рекомендации",
    direction: "Coworking",
    status: "Новый",
    subscriptions: [],
    visits: ["2025-11-01"],
    contraindications: "Аллергия на латекс",
    coachNotes: "—",
  },
  {
    id: "c3",
    name: "Олег Соколов",
    phone: "+7 999 111-22-33",
    instagram: "@oleg.coffee",
    source: "Google",
    direction: "Coffee",
    status: "Ушедший",
    subscriptions: [{ name: "Coffee клуб", validTill: "2025-08-01" }],
    visits: ["2025-06-10", "2025-07-02"],
    contraindications: "—",
    coachNotes: "—",
  },
];

export default function ClientsPage() {
  const [query, setQuery] = useState<string>("");
  const [direction, setDirection] = useState<"Все" | ClientDirection>("Все");
  const [status, setStatus] = useState<"Все" | ClientStatus>("Все");
  // просмотр теперь через отдельный маршрут /clients/[id]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CLIENTS.filter((c) => {
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        (c.instagram || "").toLowerCase().includes(q);
      const matchesDir = direction === "Все" || c.direction === direction;
      const matchesStatus = status === "Все" || c.status === status;
      return matchesQ && matchesDir && matchesStatus;
    });
  }, [query, direction, status]);

  const totalClients = CLIENTS.length;
  const activeClients = CLIENTS.filter(c => c.status === "Активный").length;
  const newClients = CLIENTS.filter(c => c.status === "Новый").length;

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case "Активный": return "#10B981";
      case "Новый": return "#6366F1";
      case "Ушедший": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getDirectionColor = (direction: ClientDirection) => {
    switch (direction) {
      case "Body": return "#6366F1";
      case "Coworking": return "#10B981";
      case "Coffee": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Instagram": return Instagram;
      case "Telegram": return MessageCircle;
      case "Рекомендации": return UsersRound;
      case "Google": return Globe;
      default: return Users;
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Клиенты</h1>
        <button className="btn-outline">
          <Plus className="h-4 w-4" />
          Добавить клиента
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Всего клиентов</div>
          </div>
          <div className="text-2xl font-semibold">{totalClients}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <UserPlus className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Активных</div>
          </div>
          <div className="text-2xl font-semibold">{activeClients}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <UserPlus className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Новых</div>
          </div>
          <div className="text-2xl font-semibold">{newClients}</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              placeholder="Поиск: имя, телефон, Instagram"
              className="h-9 w-full pl-9 pr-3 text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Направление</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
            >
              {(["Все", "Body", "Coworking", "Coffee"] as const).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Статус</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              {(["Все", "Активный", "Новый", "Ушедший"] as const).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Клиент</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Телефон</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Instagram</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Источник</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Направление</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Статус</th>
                <th className="py-3" style={{ color: 'var(--foreground)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const SourceIcon = getSourceIcon(c.source);
                const statusColor = getStatusColor(c.status);
                const directionColor = getDirectionColor(c.direction);
                const initials = getInitials(c.name);
                return (
                  <tr
                    key={c.id}
                    style={{ borderTop: "1px solid var(--card-border)" }}
                    className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: directionColor + "20", color: directionColor }}>
                          {initials}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{c.phone}</td>
                    <td className="py-3 pr-4">{c.instagram || "—"}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <SourceIcon className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{c.source}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: directionColor + "20", color: directionColor }}>
                        {c.direction}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: statusColor + "20", color: statusColor }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/clients/${c.id}`}
                        className="btn-outline text-xs"
                      >
                        Открыть
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* удалено модальное окно, используем /clients/[id] */}
    </div>
  );
}


