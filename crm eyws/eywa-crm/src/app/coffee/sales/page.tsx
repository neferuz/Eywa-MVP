"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, Users, Filter, Calendar, Package } from "lucide-react";

const revenueData = [
  { name: "Пн", value: 12000 },
  { name: "Вт", value: 15000 },
  { name: "Ср", value: 18000 },
  { name: "Чт", value: 14000 },
  { name: "Пт", value: 22000 },
  { name: "Сб", value: 25000 },
  { name: "Вс", value: 19000 },
];

const topItems = [
  { name: "Капучино", value: 145, revenue: 29000 },
  { name: "Латте", value: 120, revenue: 26400 },
  { name: "Эспрессо", value: 98, revenue: 14700 },
  { name: "Чизкейк", value: 65, revenue: 18200 },
  { name: "Американо", value: 55, revenue: 11000 },
];

const salesByBarista = [
  { name: "Анна", value: 45000 },
  { name: "Иван", value: 38000 },
  { name: "Мария", value: 32000 },
];

export default function CoffeeSalesPage() {
  const [view, setView] = useState<"barista" | "days" | "items">("days");
  const [period, setPeriod] = useState("Неделя");

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.value, 0);
  const avgCheck = totalRevenue / revenueData.reduce((sum, item) => sum + item.value / 200, 0); // примерный расчет
  const totalItems = topItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA COFFEE · Продажи</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <select
              className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
              style={{ border: 'none' }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>Неделя</option>
              <option>Месяц</option>
              <option>Квартал</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Выручка</div>
          </div>
          <div className="text-2xl font-semibold">{totalRevenue.toLocaleString("ru-RU")} ₽</div>
          <div className="flex items-center gap-1.5 text-xs mt-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500">+12.5%</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средний чек</div>
          </div>
          <div className="text-2xl font-semibold">{Math.round(avgCheck)} ₽</div>
          <div className="flex items-center gap-1.5 text-xs mt-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500">+5.2%</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <Package className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Проданных позиций</div>
          </div>
          <div className="text-2xl font-semibold">{totalItems}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Бариста</div>
          </div>
          <div className="text-2xl font-semibold">{salesByBarista.length}</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>Вид:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === "barista" ? "font-medium" : ""}`}
              style={view === "barista" ? { background: '#6366F1' + "20", color: '#6366F1' } : { background: 'var(--muted)', color: 'var(--foreground)' }}
              onClick={() => setView("barista")}
            >
              По бариста
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === "days" ? "font-medium" : ""}`}
              style={view === "days" ? { background: '#6366F1' + "20", color: '#6366F1' } : { background: 'var(--muted)', color: 'var(--foreground)' }}
              onClick={() => setView("days")}
            >
              По дням
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === "items" ? "font-medium" : ""}`}
              style={view === "items" ? { background: '#6366F1' + "20", color: '#6366F1' } : { background: 'var(--muted)', color: 'var(--foreground)' }}
              onClick={() => setView("items")}
            >
              По позициям
            </button>
          </div>
        </div>

        {view === "days" && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {view === "barista" && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByBarista} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {view === "items" && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Топ-5 позиций по продажам</div>
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center font-semibold text-sm" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.value} продаж</div>
                  </div>
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.revenue.toLocaleString("ru-RU")} ₽</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Таблица продаж</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
                <tr>
                  <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Дата</th>
                  <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Бариста</th>
                  <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Сумма</th>
                  <th className="py-2" style={{ color: 'var(--foreground)' }}>Оплата</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "06.11", barista: "Анна", sum: 4500, pay: "Карта" },
                  { date: "06.11", barista: "Иван", sum: 3200, pay: "Наличные" },
                  { date: "05.11", barista: "Мария", sum: 2800, pay: "Онлайн" },
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>{row.date}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>{row.barista}</td>
                    <td className="py-2 pr-4 font-medium" style={{ color: 'var(--foreground)' }}>{row.sum.toLocaleString("ru-RU")} ₽</td>
                    <td className="py-2" style={{ color: 'var(--foreground)' }}>{row.pay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

