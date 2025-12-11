"use client";

import Card from "@/components/Card";
import { Download, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const colors = {
  income: "#10B981",
  expense: "#EF4444",
  profit: "#6366F1",
  body: "#6366F1",
  coworking: "#10B981",
  coffee: "#F59E0B",
};

const series = [
  { name: "Янв", income: 120, expense: 80, profit: 40 },
  { name: "Фев", income: 140, expense: 90, profit: 50 },
  { name: "Мар", income: 160, expense: 100, profit: 60 },
  { name: "Апр", income: 180, expense: 110, profit: 70 },
  { name: "Май", income: 210, expense: 120, profit: 90 },
  { name: "Июн", income: 190, expense: 115, profit: 75 },
];

const byDirection = [
  { name: "Body", value: 45, color: colors.body },
  { name: "Coworking", value: 30, color: colors.coworking },
  { name: "Coffee", value: 25, color: colors.coffee },
];

const expenseTable = [
  { category: "Аренда", amount: 60_000, percentage: 27 },
  { category: "Зарплаты", amount: 120_000, percentage: 54 },
  { category: "Расходники", amount: 25_000, percentage: 11 },
  { category: "Маркетинг", amount: 18_000, percentage: 8 },
];

const avgCheck = [
  { direction: "Body", value: 2500, change: "+5.2%" },
  { direction: "Coworking", value: 1200, change: "+2.1%" },
  { direction: "Coffee", value: 450, change: "-1.3%" },
];

const totalIncome = series.reduce((sum, item) => sum + item.income, 0) * 1000;
const totalExpense = series.reduce((sum, item) => sum + item.expense, 0) * 1000;
const totalProfit = totalIncome - totalExpense;

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Финансы</h1>
        <div className="flex items-center gap-2">
          <button className="btn-outline"><Download className="h-4 w-4" /> Excel</button>
          <button className="btn-outline"><Download className="h-4 w-4" /> PDF</button>
        </div>
      </div>

      {/* P&L (Прибыль и убыток) */}
      <Card>
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>P&L · Прибыль и убыток</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Статья</th>
                <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Сумма, ₽</th>
                <th className="py-2" style={{ color: 'var(--foreground)' }}>% от выручки</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "1px solid var(--card-border)" }}>
                <td className="py-2 pr-4">Выручка</td>
                <td className="py-2 pr-4 font-semibold">{totalIncome.toLocaleString("ru-RU")}</td>
                <td className="py-2">100%</td>
              </tr>
              {expenseTable.map((row) => (
                <tr key={row.category} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <td className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>− {row.category}</td>
                  <td className="py-2 pr-4" style={{ color: '#EF4444' }}>{row.amount.toLocaleString("ru-RU")}</td>
                  <td className="py-2">{row.percentage}%</td>
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid var(--card-border)" }}>
                <td className="py-2 pr-4 font-medium">Прибыль</td>
                <td className="py-2 pr-4 font-semibold">{totalProfit.toLocaleString("ru-RU")}</td>
                <td className="py-2 font-medium">{Math.round((totalProfit / totalIncome) * 100)}%</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--card-border)" }}>
                <td className="py-2 pr-4">Рентабельность</td>
                <td className="py-2 pr-4" colSpan={2}>
                  <div className="h-2.5 w-full rounded-full" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round((totalProfit / totalIncome) * 100)}%`, background: colors.profit }} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: colors.income + "20", color: colors.income }}>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Общий доход</div>
          </div>
          <div className="text-2xl font-semibold mb-1">{totalIncome.toLocaleString("ru-RU")} ₽</div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-medium">+12.5%</span>
            <span className="text-zinc-500">vs прошлый период</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: colors.expense + "20", color: colors.expense }}>
              <ArrowDownRight className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Общий расход</div>
          </div>
          <div className="text-2xl font-semibold mb-1">{totalExpense.toLocaleString("ru-RU")} ₽</div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span className="text-red-500 font-medium">+8.2%</span>
            <span className="text-zinc-500">vs прошлый период</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: colors.profit + "20", color: colors.profit }}>
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Прибыль</div>
          </div>
          <div className="text-2xl font-semibold mb-1">{totalProfit.toLocaleString("ru-RU")} ₽</div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-medium">+18.3%</span>
            <span className="text-zinc-500">vs прошлый период</span>
          </div>
        </Card>
      </div>

      {/* Cash Flow */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Cash Flow · Движение средств</div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: colors.income }} />
              <span className="text-zinc-500">Приход</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: colors.expense }} />
              <span className="text-zinc-500">Расход</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <div className="text-xs text-zinc-500 mb-1">Остаток на кассе</div>
            <div className="text-lg font-semibold">{(totalIncome - totalExpense * 0.6).toLocaleString("ru-RU")} ₽</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <div className="text-xs text-zinc-500 mb-1">Приход (за период)</div>
            <div className="text-lg font-semibold" style={{ color: colors.income }}>{totalIncome.toLocaleString("ru-RU")} ₽</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <div className="text-xs text-zinc-500 mb-1">Расход (за период)</div>
            <div className="text-lg font-semibold" style={{ color: colors.expense }}>{totalExpense.toLocaleString("ru-RU")} ₽</div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series.map((d, i) => ({
                name: d.name,
                in: d.income,
                out: d.expense,
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cfIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.income} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.income} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cfOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.expense} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.expense} stopOpacity={0} />
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
              <Area type="monotone" dataKey="in" stroke={colors.income} strokeWidth={2} fill="url(#cfIn)" name="Приход" />
              <Area type="monotone" dataKey="out" stroke={colors.expense} strokeWidth={2} fill="url(#cfOut)" name="Расход" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Доход / Расход / Прибыль</div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: colors.income }} />
                <span className="text-zinc-500">Доход</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: colors.expense }} />
                <span className="text-zinc-500">Расход</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: colors.profit }} />
                <span className="text-zinc-500">Прибыль</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.income} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.income} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.expense} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.expense} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.profit} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.profit} stopOpacity={0} />
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
                <Area type="monotone" dataKey="income" stroke={colors.income} strokeWidth={2} fill="url(#colorIncome)" name="Доход" />
                <Area type="monotone" dataKey="expense" stroke={colors.expense} strokeWidth={2} fill="url(#colorExpense)" name="Расход" />
                <Area type="monotone" dataKey="profit" stroke={colors.profit} strokeWidth={2} fill="url(#colorProfit)" name="Прибыль" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          </Card>
        </div>
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Распределение по направлениям</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={byDirection} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={100}
                >
                  {byDirection.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {byDirection.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Таблица расходов по категориям</div>
          <div className="space-y-3">
            {expenseTable.map((row) => (
              <div key={row.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.category}</span>
                  <span className="font-semibold">{row.amount.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                  <div
                    className="h-full transition-all"
                    style={{ 
                      width: `${row.percentage}%`,
                      background: colors.expense,
                      borderRadius: 'inherit'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средний чек по направлениям</div>
          <div className="space-y-3">
            {avgCheck.map((row) => {
              const isPositive = row.change.startsWith('+');
              return (
                <div key={row.direction} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                  <div>
                    <div className="text-sm font-medium mb-1">{row.direction}</div>
                    <div className="text-xs text-zinc-500">{row.value.toLocaleString("ru-RU")} ₽</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isPositive ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {row.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Операции и Категории */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Операции</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
                <tr>
                  <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Дата</th>
                  <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Тип</th>
                  <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Направление</th>
                  <th className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>Категория</th>
                  <th className="py-2" style={{ color: 'var(--foreground)' }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "2025-11-10", type: "Доход", dir: "Body", category: "Абонемент", amount: 45000 },
                  { date: "2025-11-10", type: "Расход", dir: "Coffee", category: "Зарплаты", amount: -32000 },
                  { date: "2025-11-11", type: "Доход", dir: "Coworking", category: "Аренда", amount: 75000 },
                  { date: "2025-11-11", type: "Расход", dir: "Body", category: "Маркетинг", amount: -12000 },
                  { date: "2025-11-11", type: "Доход", dir: "Coffee", category: "Продажи", amount: 18500 },
                ].map((t, idx) => (
                  <tr key={idx} style={{ borderTop: "1px solid var(--card-border)" }}>
                    <td className="py-2 pr-4">{new Date(t.date).toLocaleDateString("ru-RU")}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded`} style={{ background: (t.amount >= 0 ? colors.income : colors.expense) + "20", color: t.amount >= 0 ? colors.income : colors.expense }}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{t.dir}</td>
                    <td className="py-2 pr-4">{t.category}</td>
                    <td className="py-2 font-semibold" style={{ color: t.amount >= 0 ? colors.income : colors.expense }}>
                      {t.amount.toLocaleString("ru-RU")} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Категории (справочник)</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-zinc-500 mb-2">Доходы</div>
              <div className="flex flex-wrap gap-2">
                {["Абонементы", "Разовые визиты", "Аренда", "Продажи Coffee"].map((c) => (
                  <span key={c} className="text-xs px-2 py-1 rounded" style={{ background: colors.income + "20", color: colors.income, border: '1px solid var(--card-border)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-2">Расходы</div>
              <div className="flex flex-wrap gap-2">
                {["Аренда", "Зарплаты", "Маркетинг", "Расходники", "Коммунальные"].map((c) => (
                  <span key={c} className="text-xs px-2 py-1 rounded" style={{ background: colors.expense + "20", color: colors.expense, border: '1px solid var(--card-border)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


