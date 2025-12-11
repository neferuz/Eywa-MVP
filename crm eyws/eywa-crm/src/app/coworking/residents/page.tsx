"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Plus, Search, Filter, User, Phone, CheckCircle, XCircle, Calendar, DollarSign, FileText, AlertCircle } from "lucide-react";

type Resident = {
  id: string;
  name: string;
  phone: string;
  tariff: string;
  status: "active" | "ended" | "pending";
  until: string;
};

const MOCK: Resident[] = [
  { id: "r1", name: "Иван Петров", phone: "+7 900 000-00-01", tariff: "Месячный Open Space", status: "active", until: "2025-12-01" },
  { id: "r2", name: "Мария Сидорова", phone: "+7 900 000-00-02", tariff: "Кабинет на 2", status: "active", until: "2025-11-20" },
  { id: "r3", name: "Анна Козлова", phone: "+7 900 000-00-03", tariff: "Дневной тариф", status: "ended", until: "2025-10-30" },
  { id: "r4", name: "Дмитрий Волков", phone: "+7 900 000-00-04", tariff: "Месячный Premium", status: "pending", until: "2025-11-08" },
];

export default function CoworkingResidentsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Все");
  const [open, setOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  const filtered = useMemo(() => {
    return MOCK.filter((r) => {
      const matchQ = !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.phone.includes(q);
      const matchS = status === "Все" || r.status === status;
      return matchQ && matchS;
    });
  }, [q, status]);

  const totalResidents = MOCK.length;
  const activeResidents = MOCK.filter(r => r.status === "active").length;
  const endedResidents = MOCK.filter(r => r.status === "ended").length;
  const pendingResidents = MOCK.filter(r => r.status === "pending").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#10B981";
      case "ended": return "#6B7280";
      case "pending": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Активен";
      case "ended": return "Закончил";
      case "pending": return "Ожидает продление";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA COWORKING · Резиденты</h1>
        <button className="btn-outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Добавить клиента
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <User className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Всего резидентов</div>
          </div>
          <div className="text-2xl font-semibold">{totalResidents}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Активных</div>
          </div>
          <div className="text-2xl font-semibold">{activeResidents}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6B7280' + "20", color: '#6B7280' }}>
              <XCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Закончили</div>
          </div>
          <div className="text-2xl font-semibold">{endedResidents}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Ожидают продление</div>
          </div>
          <div className="text-2xl font-semibold">{pendingResidents}</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              placeholder="Поиск по имени/телефону"
              className="h-9 w-full pl-9 pr-3 text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Статус</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Все</option>
              <option value="active">Активные</option>
              <option value="ended">Закончившие</option>
              <option value="pending">Ожидают продление</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Имя</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Телефон</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Тариф</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Действует до</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Статус</th>
                <th className="py-3" style={{ color: 'var(--foreground)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const statusColor = getStatusColor(r.status);
                const initials = r.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
                          {initials}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{r.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        <span style={{ color: 'var(--foreground)' }}>{r.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span style={{ color: 'var(--foreground)' }}>{r.tariff}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span style={{ color: 'var(--foreground)' }}>
                          {new Date(r.until).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: statusColor + "20", color: statusColor }}>
                        {getStatusLabel(r.status)}
                      </span>
                    </td>
                    <td className="py-3">
                      <button className="btn-outline text-xs" onClick={() => setSelectedResident(r)}>
                        Карточка
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!selectedResident} onClose={() => setSelectedResident(null)} title={`Карточка клиента: ${selectedResident?.name}`}>
        {selectedResident && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-xs text-zinc-500 mb-1">Имя</div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedResident.name}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-xs text-zinc-500 mb-1">Телефон</div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedResident.phone}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-xs text-zinc-500 mb-1">Тариф</div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedResident.tariff}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-xs text-zinc-500 mb-1">Действует до</div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {new Date(selectedResident.until).toLocaleDateString("ru-RU")}
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
              <div className="text-xs text-zinc-500 mb-2">История оплат</div>
              <div className="text-sm text-zinc-500">Нет данных</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
              <div className="text-xs text-zinc-500 mb-2">Бронирования</div>
              <div className="text-sm text-zinc-500">Нет данных</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
              <div className="text-xs text-zinc-500 mb-2">Заметки администратора</div>
              <textarea
                className="w-full px-2 py-1 text-sm"
                style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}
                rows={3}
                placeholder="Добавить заметку..."
              />
            </div>
            <button className="btn-outline w-full" onClick={() => setSelectedResident(null)}>
              Закрыть
            </button>
          </div>
        )}
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Добавить клиента">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Имя</label>
              <input
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="Введите имя"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Телефон</label>
              <input
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="+7 900 000-00-00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Тариф</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option value="">Выберите тариф</option>
                <option>Дневной тариф</option>
                <option>Месячный Open Space</option>
                <option>Кабинет на 2</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Срок</label>
              <input
                type="date"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn-outline flex-1" onClick={() => setOpen(false)}>
              Отмена
            </button>
            <button
              className="btn-outline flex-1"
              style={{ background: '#10B981' + "20", color: '#10B981', borderColor: '#10B981' }}
              onClick={() => setOpen(false)}
            >
              Сохранить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

