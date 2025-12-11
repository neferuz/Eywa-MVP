"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Plus, Search, Filter, Edit, Dumbbell, Building2, Coffee, CheckCircle, Clock, XCircle } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  role: string;
  department: "Body" | "Coffee" | "Coworking";
  status: "active" | "vacation" | "fired";
  kpi: number;
  photo?: string;
};

const MOCK: Employee[] = [
  { id: "e1", name: "Иван Петров", role: "Тренер", department: "Body", status: "active", kpi: 85 },
  { id: "e2", name: "Мария Сидорова", role: "Бариста", department: "Coffee", status: "active", kpi: 92 },
  { id: "e3", name: "Анна Козлова", role: "Менеджер", department: "Coworking", status: "vacation", kpi: 78 },
  { id: "e4", name: "Дмитрий Волков", role: "Тренер", department: "Body", status: "active", kpi: 95 },
];

export default function StaffListPage() {
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("Все");
  const [role, setRole] = useState("Все");
  const [status, setStatus] = useState("Все");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    return MOCK.filter((e) => {
      const matchQ = !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.role.toLowerCase().includes(q.toLowerCase());
      const matchD = department === "Все" || e.department === department;
      const matchR = role === "Все" || e.role === role;
      const matchS = status === "Все" || e.status === status;
      return matchQ && matchD && matchR && matchS;
    });
  }, [q, department, role, status]);

  const active = MOCK.filter(e => e.status === "active").length;
  const vacation = MOCK.filter(e => e.status === "vacation").length;
  const fired = MOCK.filter(e => e.status === "fired").length;
  const avgKPI = MOCK.reduce((sum, e) => sum + e.kpi, 0) / MOCK.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#10B981";
      case "vacation": return "#F59E0B";
      case "fired": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Активен";
      case "vacation": return "Отпуск";
      case "fired": return "Уволен";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return CheckCircle;
      case "vacation": return Clock;
      case "fired": return XCircle;
      default: return CheckCircle;
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Body": return "#6366F1";
      case "Coffee": return "#F59E0B";
      case "Coworking": return "#10B981";
      default: return "#6B7280";
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case "Body": return Dumbbell;
      case "Coffee": return Coffee;
      case "Coworking": return Building2;
      default: return Building2;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA STAFF · Список сотрудников</h1>
        <button className="btn-outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Добавить сотрудника
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Активных</div>
          </div>
          <div className="text-2xl font-semibold">{active}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>В отпуске</div>
          </div>
          <div className="text-2xl font-semibold">{vacation}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <XCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Уволено</div>
          </div>
          <div className="text-2xl font-semibold">{fired}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <Filter className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средний KPI</div>
          </div>
          <div className="text-2xl font-semibold">{Math.round(avgKPI)}%</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              placeholder="Поиск по имени/роли"
              className="h-9 w-full pl-9 pr-3 text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Отдел</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option>Все</option>
              <option>Body</option>
              <option>Coffee</option>
              <option>Coworking</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Роль</span>
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Все</option>
              <option>Тренер</option>
              <option>Бариста</option>
              <option>Менеджер</option>
            </select>
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
              <option value="active">Активен</option>
              <option value="vacation">Отпуск</option>
              <option value="fired">Уволен</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Сотрудник</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Роль</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Отдел</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Статус</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>KPI</th>
                <th className="py-3" style={{ color: 'var(--foreground)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => {
                const statusColor = getStatusColor(employee.status);
                const StatusIcon = getStatusIcon(employee.status);
                const departmentColor = getDepartmentColor(employee.department);
                const DepartmentIcon = getDepartmentIcon(employee.department);
                const initials = employee.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                const kpiColor = employee.kpi >= 90 ? "#10B981" : employee.kpi >= 70 ? "#F59E0B" : "#EF4444";
                return (
                  <tr key={employee.id} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: departmentColor + "20", color: departmentColor }}>
                          {initials}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{employee.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{employee.role}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <DepartmentIcon className="h-3.5 w-3.5" style={{ color: departmentColor }} />
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: departmentColor + "20", color: departmentColor }}>
                          {employee.department}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="h-3.5 w-3.5" style={{ color: statusColor }} />
                        <span className="text-xs font-medium" style={{ color: statusColor }}>
                          {getStatusLabel(employee.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold" style={{ color: kpiColor }}>{employee.kpi}%</span>
                    </td>
                    <td className="py-3">
                      <button className="btn-outline text-xs" onClick={() => setSelected(employee)}>
                        <Edit className="h-3.5 w-3.5" /> Редактировать
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Добавить сотрудника">
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
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Роль</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option value="">Выберите роль</option>
                <option>Тренер</option>
                <option>Бариста</option>
                <option>Менеджер</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Отдел</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option value="">Выберите отдел</option>
                <option>Body</option>
                <option>Coffee</option>
                <option>Coworking</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Ставка (₽)</label>
              <input
                type="number"
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Редактировать: ${selected?.name}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Роль</label>
                <select
                  className="h-9 w-full px-3 text-sm"
                  style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                  defaultValue={selected.role}
                >
                  <option>Тренер</option>
                  <option>Бариста</option>
                  <option>Менеджер</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Ставка (₽)</label>
                <input
                  type="number"
                  className="h-9 w-full px-3 text-sm"
                  style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>График</label>
                <select
                  className="h-9 w-full px-3 text-sm"
                  style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                >
                  <option>Полный день</option>
                  <option>Сменный</option>
                  <option>Гибкий</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button className="btn-outline flex-1" onClick={() => setSelected(null)}>
                Отмена
              </button>
              <button
                className="btn-outline flex-1"
                style={{ background: '#10B981' + "20", color: '#10B981', borderColor: '#10B981' }}
                onClick={() => setSelected(null)}
              >
                Сохранить
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


