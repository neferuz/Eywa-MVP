"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Plus, Download, Calculator, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

type Payment = {
  id: string;
  employeeId: string;
  employeeName: string;
  salary: number;
  bonus: number;
  percentage: number;
  total: number;
  period: string;
  status: "paid" | "pending" | "overdue";
};

const MOCK: Payment[] = [
  { id: "p1", employeeId: "e1", employeeName: "Иван Петров", salary: 50000, bonus: 10000, percentage: 0, total: 60000, period: "Октябрь 2025", status: "paid" },
  { id: "p2", employeeId: "e2", employeeName: "Мария Сидорова", salary: 45000, bonus: 5000, percentage: 0, total: 50000, period: "Октябрь 2025", status: "paid" },
  { id: "p3", employeeId: "e4", employeeName: "Дмитрий Волков", salary: 50000, bonus: 0, percentage: 0, total: 50000, period: "Октябрь 2025", status: "pending" },
];

export default function StaffPaymentsPage() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("Октябрь 2025");

  const paid = MOCK.filter(p => p.status === "paid").length;
  const pending = MOCK.filter(p => p.status === "pending").length;
  const overdue = MOCK.filter(p => p.status === "overdue").length;
  const totalAmount = MOCK.reduce((sum, p) => sum + p.total, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "#10B981";
      case "pending": return "#F59E0B";
      case "overdue": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Выплачено";
      case "pending": return "Ожидает";
      case "overdue": return "Просрочено";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return CheckCircle;
      case "pending": return AlertCircle;
      case "overdue": return AlertCircle;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA STAFF · Зарплаты и начисления</h1>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            <Calculator className="h-4 w-4" /> Рассчитать автоматически
          </button>
          <button className="btn-outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Добавить выплату
          </button>
          <button className="btn-outline">
            <Download className="h-4 w-4" /> Экспорт
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Выплачено</div>
          </div>
          <div className="text-2xl font-semibold">{paid}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Ожидает</div>
          </div>
          <div className="text-2xl font-semibold">{pending}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Просрочено</div>
          </div>
          <div className="text-2xl font-semibold">{overdue}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Итого</div>
          </div>
          <div className="text-2xl font-semibold">{totalAmount.toLocaleString("ru-RU")} ₽</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <span className="text-xs text-zinc-500">Период</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>Октябрь 2025</option>
              <option>Сентябрь 2025</option>
              <option>Август 2025</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Сотрудник</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Оклад</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Бонус</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Процент</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Итого</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Период</th>
                <th className="py-3" style={{ color: 'var(--foreground)' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {MOCK.map((payment) => {
                const statusColor = getStatusColor(payment.status);
                const StatusIcon = getStatusIcon(payment.status);
                const initials = payment.employeeName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr
                    key={payment.id}
                    style={{
                      borderTop: "1px solid var(--card-border)",
                      background: payment.status === "overdue" ? "#EF4444" + "10" : undefined,
                    }}
                    className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
                          {initials}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{payment.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{payment.salary.toLocaleString("ru-RU")} ₽</td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{payment.bonus.toLocaleString("ru-RU")} ₽</td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{payment.percentage > 0 ? `${payment.percentage}%` : "-"}</td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{payment.total.toLocaleString("ru-RU")} ₽</span>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{payment.period}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="h-3.5 w-3.5" style={{ color: statusColor }} />
                        <span className="text-xs font-medium" style={{ color: statusColor }}>
                          {getStatusLabel(payment.status)}
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

      <Modal open={open} onClose={() => setOpen(false)} title="Добавить выплату">
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
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Период</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option>Октябрь 2025</option>
                <option>Сентябрь 2025</option>
                <option>Август 2025</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Оклад (₽)</label>
              <input
                type="number"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Бонус (₽)</label>
              <input
                type="number"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Процент (%)</label>
              <input
                type="number"
                step="0.01"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="0"
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


