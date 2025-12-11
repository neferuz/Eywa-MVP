"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Target, TrendingUp, Users, Eye, ArrowRight } from "lucide-react";

type KPIEmployee = {
  id: string;
  name: string;
  department: "Body" | "Coffee" | "Coworking";
  plan: number;
  fact: number;
  percentage: number;
  kpis: {
    name: string;
    value: number;
    target: number;
  }[];
};

const MOCK: KPIEmployee[] = [
  {
    id: "k1",
    name: "Иван Петров",
    department: "Body",
    plan: 100,
    fact: 85,
    percentage: 85,
    kpis: [
      { name: "Загрузка тренировок", value: 85, target: 100 },
      { name: "Retention", value: 78, target: 80 },
    ],
  },
  {
    id: "k2",
    name: "Мария Сидорова",
    department: "Coffee",
    plan: 100,
    fact: 92,
    percentage: 92,
    kpis: [
      { name: "Выручка", value: 120000, target: 100000 },
      { name: "Upsell", value: 15, target: 12 },
    ],
  },
  {
    id: "k3",
    name: "Анна Козлова",
    department: "Coworking",
    plan: 100,
    fact: 78,
    percentage: 78,
    kpis: [
      { name: "Продления", value: 45, target: 50 },
      { name: "Загрузка мест", value: 82, target: 85 },
    ],
  },
];

const KPI_CHART_DATA = [
  { week: "Неделя 1", value: 75 },
  { week: "Неделя 2", value: 82 },
  { week: "Неделя 3", value: 88 },
  { week: "Неделя 4", value: 85 },
];

export default function StaffKPIPage() {
  const [selected, setSelected] = useState<KPIEmployee | null>(null);

  const avgKPI = MOCK.reduce((sum, e) => sum + e.percentage, 0) / MOCK.length;
  const totalPlan = MOCK.reduce((sum, e) => sum + e.plan, 0);
  const totalFact = MOCK.reduce((sum, e) => sum + e.fact, 0);

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "#10B981";
    if (percentage >= 70) return "#F59E0B";
    return "#EF4444";
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Body": return "#6366F1";
      case "Coffee": return "#F59E0B";
      case "Coworking": return "#10B981";
      default: return "#6B7280";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA STAFF · KPI и эффективность</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <Target className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средний KPI</div>
          </div>
          <div className="text-2xl font-semibold">{Math.round(avgKPI)}%</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>План</div>
          </div>
          <div className="text-2xl font-semibold">{totalPlan}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Факт</div>
          </div>
          <div className="text-2xl font-semibold">{totalFact}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <Eye className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Выполнение</div>
          </div>
          <div className="text-2xl font-semibold">{Math.round((totalFact / totalPlan) * 100)}%</div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>KPI по неделям</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={KPI_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorKPI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="week" stroke="currentColor" tick={{ fontSize: 11 }} />
              <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--panel)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#6366F1" fillOpacity={1} fill="url(#colorKPI)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Таблица KPI</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Сотрудник</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>План</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Факт</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Выполнение</th>
                <th className="py-3" style={{ color: 'var(--foreground)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {MOCK.map((employee) => {
                const percentageColor = getPercentageColor(employee.percentage);
                const departmentColor = getDepartmentColor(employee.department);
                const initials = employee.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={employee.id} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: departmentColor + "20", color: departmentColor }}>
                          {initials}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{employee.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{employee.plan}</td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{employee.fact}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${employee.percentage}%`, background: percentageColor }}
                          />
                        </div>
                        <span className="text-xs font-semibold min-w-[40px]" style={{ color: percentageColor }}>
                          {employee.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <button className="btn-outline text-xs" onClick={() => setSelected(employee)}>
                        Детально <ArrowRight className="h-3.5 w-3.5 inline ml-1" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`KPI: ${selected?.name}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-xs text-zinc-500 mb-1">План</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{selected.plan}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-xs text-zinc-500 mb-1">Факт</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{selected.fact}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>Детальные показатели</div>
              <div className="space-y-3">
                {selected.kpis.map((kpi, idx) => {
                  const kpiPercentage = (kpi.value / kpi.target) * 100;
                  const kpiColor = kpiPercentage >= 100 ? "#10B981" : kpiPercentage >= 80 ? "#F59E0B" : "#EF4444";
                  return (
                    <div key={idx} className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{kpi.name}</span>
                        <span className="text-xs font-semibold" style={{ color: kpiColor }}>{Math.round(kpiPercentage)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(kpiPercentage, 100)}%`, background: kpiColor }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500">{kpi.value} / {kpi.target}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


