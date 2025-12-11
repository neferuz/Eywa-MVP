"use client";

import { useState, useMemo } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Plus, Calendar, Filter, CheckCircle, Clock, AlertCircle, Plane, Heart, FileText } from "lucide-react";

type Vacation = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "vacation" | "sick" | "other";
  startDate: string;
  endDate: string;
  status: "approved" | "pending";
  days: number;
};

const MOCK: Vacation[] = [
  { id: "v1", employeeId: "e1", employeeName: "Иван Петров", type: "vacation", startDate: "2025-11-15", endDate: "2025-11-22", status: "approved", days: 7 },
  { id: "v2", employeeId: "e2", employeeName: "Мария Сидорова", type: "sick", startDate: "2025-11-10", endDate: "2025-11-12", status: "approved", days: 3 },
  { id: "v3", employeeId: "e4", employeeName: "Дмитрий Волков", type: "vacation", startDate: "2025-12-01", endDate: "2025-12-14", status: "pending", days: 14 },
];

export default function StaffVacationsPage() {
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Все");
  const [filterType, setFilterType] = useState("Все");

  const filtered = useMemo(() => {
    return MOCK.filter((v) => {
      const matchS = filterStatus === "Все" || v.status === filterStatus;
      const matchT = filterType === "Все" || v.type === filterType;
      return matchS && matchT;
    });
  }, [filterStatus, filterType]);

  const approved = MOCK.filter(v => v.status === "approved").length;
  const pending = MOCK.filter(v => v.status === "pending").length;
  const totalDays = MOCK.reduce((sum, v) => sum + v.days, 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "vacation": return "#10B981";
      case "sick": return "#EF4444";
      case "other": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "vacation": return "Отпуск";
      case "sick": return "Больничный";
      case "other": return "Другое";
      default: return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "vacation": return Plane;
      case "sick": return Heart;
      case "other": return FileText;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#10B981";
      case "pending": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Одобрено";
      case "pending": return "Ожидание";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return CheckCircle;
      case "pending": return Clock;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA STAFF · Отпуска и отсутствия</h1>
        <button className="btn-outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Добавить отпуск
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Одобрено</div>
          </div>
          <div className="text-2xl font-semibold">{approved}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Ожидает</div>
          </div>
          <div className="text-2xl font-semibold">{pending}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Всего дней</div>
          </div>
          <div className="text-2xl font-semibold">{totalDays}</div>
        </Card>
      </div>

      {pending > 0 && (
        <Card style={{ background: '#F59E0B' + "10", border: '1px solid #F59E0B' + "40" }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>У вас {pending} запрос(ов) на одобрение</div>
              <div className="text-xs text-zinc-500">Требуется ваше внимание</div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Статус</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option>Все</option>
              <option value="approved">Одобрено</option>
              <option value="pending">Ожидание</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Тип</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option>Все</option>
              <option value="vacation">Отпуск</option>
              <option value="sick">Больничный</option>
              <option value="other">Другое</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Сотрудник</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Тип</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Даты</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Дней</th>
                <th className="py-3" style={{ color: 'var(--foreground)' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((vacation) => {
                const typeColor = getTypeColor(vacation.type);
                const TypeIcon = getTypeIcon(vacation.type);
                const statusColor = getStatusColor(vacation.status);
                const StatusIcon = getStatusIcon(vacation.status);
                const initials = vacation.employeeName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={vacation.id} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
                          {initials}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{vacation.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="h-3.5 w-3.5" style={{ color: typeColor }} />
                        <span className="text-xs font-medium" style={{ color: typeColor }}>
                          {getTypeLabel(vacation.type)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>
                      {new Date(vacation.startDate).toLocaleDateString("ru-RU")} - {new Date(vacation.endDate).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{vacation.days}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="h-3.5 w-3.5" style={{ color: statusColor }} />
                        <span className="text-xs font-medium" style={{ color: statusColor }}>
                          {getStatusLabel(vacation.status)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Добавить отпуск">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Сотрудник</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option value="">Выберите сотрудника</option>
                <option>Иван Петров</option>
                <option>Мария Сидорова</option>
                <option>Дмитрий Волков</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Тип</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option value="">Выберите тип</option>
                <option value="vacation">Отпуск</option>
                <option value="sick">Больничный</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Дата начала</label>
              <input
                type="date"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Дата окончания</label>
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


