"use client";

import Card from "@/components/Card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, AreaChart, Area } from "recharts";
import { Users, TrendingUp, Award, Target, Star } from "lucide-react";

const kpis = [
  { name: "Иван", direction: "Body", load: 0.7, revenue: 120_000, rating: 4.8, avatar: "И" },
  { name: "Мария", direction: "Coworking", load: 0.6, revenue: 95_000, rating: 4.9, avatar: "М" },
  { name: "Олег", direction: "Coffee", load: 0.8, revenue: 75_000, rating: 4.7, avatar: "О" },
  { name: "Анна", direction: "Body", load: 0.65, revenue: 110_000, rating: 4.6, avatar: "А" },
];

const planFact = [
  { name: "Нед1", plan: 100, fact: 90 },
  { name: "Нед2", plan: 110, fact: 115 },
  { name: "Нед3", plan: 120, fact: 118 },
  { name: "Нед4", plan: 130, fact: 125 },
];

const efficiency = [
  { name: "Body", value: 78 },
  { name: "Coworking", value: 72 },
  { name: "Coffee", value: 81 },
];

const getLoadColor = (load: number) => {
  if (load >= 0.8) return "#10B981";
  if (load >= 0.6) return "#F59E0B";
  return "#EF4444";
};

const getDirectionColor = (direction: string) => {
  switch (direction) {
    case "Body": return "#6366F1";
    case "Coworking": return "#10B981";
    case "Coffee": return "#F59E0B";
    default: return "#6B7280";
  }
};

const totalEmployees = kpis.length;
const avgRating = kpis.reduce((sum, emp) => sum + emp.rating, 0) / kpis.length;
const totalRevenue = kpis.reduce((sum, emp) => sum + emp.revenue, 0);
const avgLoad = kpis.reduce((sum, emp) => sum + emp.load, 0) / kpis.length;

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Сотрудники</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Всего сотрудников</div>
          </div>
          <div className="text-2xl font-semibold">{totalEmployees}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <Star className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средний рейтинг</div>
          </div>
          <div className="text-2xl font-semibold">{avgRating.toFixed(1)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Общая выручка</div>
          </div>
          <div className="text-2xl font-semibold">{totalRevenue.toLocaleString("ru-RU")} ₽</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <Target className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средняя загрузка</div>
          </div>
          <div className="text-2xl font-semibold">{Math.round(avgLoad * 100)}%</div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>KPI сотрудников</div>
        <div className="space-y-3">
          {kpis.map((row) => {
            const loadColor = getLoadColor(row.load);
            const directionColor = getDirectionColor(row.direction);
            return (
              <div
                key={row.name}
                className="flex items-center gap-4 p-3 rounded-lg"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <div className="h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: directionColor + "20", color: directionColor }}>
                  {row.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{row.name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium">{row.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded" style={{ background: directionColor + "20", color: directionColor }}>
                      {row.direction}
                    </span>
                    <span className="text-zinc-500">{row.revenue.toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-500">Загрузка</span>
                      <span className="font-medium" style={{ color: loadColor }}>{Math.round(row.load * 100)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                      <div
                        className="h-full transition-all"
                        style={{ 
                          width: `${row.load * 100}%`,
                          background: loadColor,
                          borderRadius: 'inherit'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>План / Факт</div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: '#6366F1' }} />
                <span className="text-zinc-500">План</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-zinc-500">Факт</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planFact} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 12 }} />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="plan" fill="#6366F1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="fact" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Эффективность по направлениям</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiency} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 12 }} />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill="url(#colorEfficiency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}


