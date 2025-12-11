"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Plus, Search, CreditCard, Users, Calendar, AlertCircle, TrendingDown, Clock } from "lucide-react";

type Row = { id: string; client: string; type: string; left: number; until: string; total: number };

const MOCK: Row[] = [
  { id: "a1", client: "Иван П.", type: "Body 12", left: 5, until: "2026-01-15", total: 12 },
  { id: "a2", client: "Мария С.", type: "Body 8", left: 2, until: "2025-12-01", total: 8 },
  { id: "a3", client: "Анна К.", type: "Body 12", left: 0, until: "2025-11-20", total: 12 },
  { id: "a4", client: "Дмитрий В.", type: "Body 8", left: 6, until: "2026-02-10", total: 8 },
];

export default function BodySubscriptionsPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const filtered = useMemo(() => MOCK.filter((r) => !q || r.client.toLowerCase().includes(q.toLowerCase())), [q]);

  const totalSubscriptions = MOCK.length;
  const activeSubscriptions = MOCK.filter(s => s.left > 0).length;
  const expiredSubscriptions = MOCK.filter(s => {
    const until = new Date(s.until);
    return until < new Date();
  }).length;
  const lowBalanceSubscriptions = MOCK.filter(s => s.left > 0 && s.left <= 2).length;

  const getLeftColor = (left: number, total: number) => {
    const percentage = (left / total) * 100;
    if (percentage <= 0) return "#6B7280"; // серый - закончился
    if (percentage <= 25) return "#EF4444"; // красный - мало осталось
    if (percentage <= 50) return "#F59E0B"; // оранжевый - средний остаток
    return "#10B981"; // зелёный - много осталось
  };

  const isExpiringSoon = (until: string) => {
    const untilDate = new Date(until);
    const now = new Date();
    const diffTime = untilDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (until: string) => {
    return new Date(until) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA BODY · Абонементы</h1>
        <button className="btn-outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Добавить абонемент
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Всего абонементов</div>
          </div>
          <div className="text-2xl font-semibold">{totalSubscriptions}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Активных</div>
          </div>
          <div className="text-2xl font-semibold">{activeSubscriptions}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Истекают скоро</div>
          </div>
          <div className="text-2xl font-semibold">{lowBalanceSubscriptions}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6B7280' + "20", color: '#6B7280' }}>
              <TrendingDown className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Истекших</div>
          </div>
          <div className="text-2xl font-semibold">{expiredSubscriptions}</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              placeholder="Поиск по клиенту"
              className="h-9 w-full pl-9 pr-3 text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Клиент</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Тип</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Остаток</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Окончание</th>
                <th className="py-3" style={{ color: 'var(--foreground)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const leftColor = getLeftColor(r.left, r.total);
                const expiringSoon = isExpiringSoon(r.until);
                const expired = isExpired(r.until);
                const untilDate = new Date(r.until);
                const initials = r.client.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
                          {initials}
                        </div>
                        <span style={{ color: 'var(--foreground)' }}>{r.client}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-[80px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-zinc-500">Осталось</span>
                            <span className="font-medium" style={{ color: leftColor }}>{r.left} / {r.total}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${(r.left / r.total) * 100}%`,
                                background: leftColor,
                                borderRadius: 'inherit'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" style={{ color: expired ? '#EF4444' : expiringSoon ? '#F59E0B' : 'var(--foreground)' }}>
                            {untilDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {expired && (
                            <span className="text-xs text-red-500">Истёк</span>
                          )}
                          {expiringSoon && !expired && (
                            <span className="text-xs text-amber-500">Скоро истечёт</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button className="btn-outline text-xs" onClick={() => setEdit(r)}>
                          Продлить
                        </button>
                        <button className="btn-outline text-xs">
                          Списать
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open || !!edit} onClose={() => { setOpen(false); setEdit(null); }} title={edit ? "Редактировать абонемент" : "Добавить абонемент"}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Клиент</label>
              <input
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="Выберите клиента"
                defaultValue={edit?.client || ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Тип абонемента</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                defaultValue={edit?.type || ""}
              >
                <option value="">Выберите тип</option>
                <option value="Body 8">Body 8</option>
                <option value="Body 12">Body 12</option>
                <option value="Body 16">Body 16</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Остаток занятий</label>
              <input
                type="number"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="0"
                defaultValue={edit?.left || ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Дата окончания</label>
              <input
                type="date"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                defaultValue={edit?.until || ""}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn-outline flex-1" onClick={() => { setOpen(false); setEdit(null); }}>
              Отмена
            </button>
            <button
              className="btn-outline flex-1"
              style={{ background: '#10B981' + "20", color: '#10B981', borderColor: '#10B981' }}
              onClick={() => { setOpen(false); setEdit(null); }}
            >
              <Plus className="h-4 w-4" /> Сохранить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


