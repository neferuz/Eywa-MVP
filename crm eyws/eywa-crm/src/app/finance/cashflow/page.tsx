"use client";

import Card from "@/components/Card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, CreditCard, Wallet } from "lucide-react";

const colors = {
  income: "#10B981",
  expense: "#EF4444",
};

const series = [
  { name: "01.11", card: 6_200_000, cash: 3_800_000, transfer: 2_500_000, writeoff: 1_200_000, expense: 8_200_000 },
  { name: "02.11", card: 7_400_000, cash: 4_100_000, transfer: 3_000_000, writeoff: 900_000, expense: 9_100_000 },
  { name: "03.11", card: 8_900_000, cash: 5_200_000, transfer: 4_600_000, writeoff: 1_400_000, expense: 10_500_000 },
  { name: "04.11", card: 7_200_000, cash: 4_000_000, transfer: 3_800_000, writeoff: 1_100_000, expense: 8_800_000 },
  { name: "05.11", card: 8_100_000, cash: 4_600_000, transfer: 4_100_000, writeoff: 1_500_000, expense: 11_200_000 },
  { name: "06.11", card: 9_500_000, cash: 5_000_000, transfer: 5_000_000, writeoff: 1_300_000, expense: 9_500_000 },
  { name: "07.11", card: 8_300_000, cash: 4_700_000, transfer: 4_300_000, writeoff: 1_200_000, expense: 10_800_000 },
  { name: "08.11", card: 9_800_000, cash: 5_400_000, transfer: 4_900_000, writeoff: 1_600_000, expense: 12_000_000 },
  { name: "09.11", card: 7_200_000, cash: 4_200_000, transfer: 4_200_000, writeoff: 1_300_000, expense: 9_300_000 },
  { name: "10.11", card: 8_600_000, cash: 4_900_000, transfer: 4_900_000, writeoff: 1_500_000, expense: 10_600_000 },
  { name: "11.11", card: 10_200_000, cash: 5_600_000, transfer: 5_300_000, writeoff: 1_300_000, expense: 11_500_000 },
  { name: "12.11", card: 7_600_000, cash: 4_300_000, transfer: 5_000_000, writeoff: 1_200_000, expense: 9_700_000 },
  { name: "13.11", card: 9_100_000, cash: 5_000_000, transfer: 5_700_000, writeoff: 1_400_000, expense: 10_900_000 },
];

const totalCard = series.reduce((sum, item) => sum + item.card, 0);
const totalCash = series.reduce((sum, item) => sum + item.cash, 0);
const totalTransfer = series.reduce((sum, item) => sum + item.transfer, 0);
const totalWriteoff = series.reduce((sum, item) => sum + item.writeoff, 0);
const totalExpense = series.reduce((sum, item) => sum + item.expense, 0);
const currentBalance = totalCard + totalCash + totalTransfer - totalExpense * 0.4;

const currencyFormatter = new Intl.NumberFormat("ru-RU");

export default function CashFlowPage() {
  return (
    <div className="finance-page">
      <div className="finance-page__header">
        <div>
          <h1>Cash Flow · Движение средств</h1>
          <p>Способы поступлений и расходные операции по направлениям</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59, 130, 246, 0.2)", color: "#3b82f6" }}>
              <Wallet className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Остаток</div>
          </div>
          <div className="text-2xl font-semibold mb-1">{currencyFormatter.format(currentBalance)} сум</div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-medium">+5.2%</span>
            <span className="text-zinc-500">vs вчера</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(2, 132, 199, 0.15)", color: "#0284c7" }}>
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Поступления</div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Карта</span>
              <strong style={{ color: 'var(--foreground)' }}>{currencyFormatter.format(totalCard)} сум</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Наличные</span>
              <strong style={{ color: 'var(--foreground)' }}>{currencyFormatter.format(totalCash)} сум</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Перечисления</span>
              <strong style={{ color: 'var(--foreground)' }}>{currencyFormatter.format(totalTransfer)} сум</strong>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: colors.expense + "20", color: colors.expense }}>
              <TrendingDown className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Списания</div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Списания</span>
              <strong style={{ color: 'var(--foreground)' }}>{currencyFormatter.format(totalWriteoff)} сум</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Расходы</span>
              <strong style={{ color: colors.expense }}>{currencyFormatter.format(totalExpense)} сум</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Динамика по поступлениям</div>
          <div className="flex items-center flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "#0284c7" }} />
              <span className="text-zinc-500">Карта</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "#fb923c" }} />
              <span className="text-zinc-500">Наличные</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "#8b5cf6" }} />
              <span className="text-zinc-500">Перечисление</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: colors.expense }} />
              <span className="text-zinc-500">Расход</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cfCard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cfCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cfTransfer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cfExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.expense} stopOpacity={0.25} />
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
                formatter={(value: number) => currencyFormatter.format(value) + " сум"}
              />
              <Area type="monotone" dataKey="card" stroke="#0284c7" strokeWidth={2} fill="url(#cfCard)" name="Карта" />
              <Area type="monotone" dataKey="cash" stroke="#fb923c" strokeWidth={2} fill="url(#cfCash)" name="Наличные" />
              <Area type="monotone" dataKey="transfer" stroke="#8b5cf6" strokeWidth={2} fill="url(#cfTransfer)" name="Перечисление" />
              <Area type="monotone" dataKey="expense" stroke={colors.expense} strokeWidth={2} fill="url(#cfExpense)" name="Расход" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Расходы по направлениям</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <th className="py-2 pr-4 text-left">Категория</th>
                <th className="py-2 pr-4 text-left">Сумма</th>
                <th className="py-2 pr-4 text-left">Комментарий</th>
                <th className="py-2 text-left">Дата</th>
              </tr>
            </thead>
            <tbody>
              {[
                { category: "Аренда", amount: 4_500_000, comment: "Центр EYWA", date: "12.11" },
                { category: "ФОТ", amount: 3_200_000, comment: "Тренеры BODY", date: "12.11" },
                { category: "Маркетинг", amount: 1_100_000, comment: "Performance Meta", date: "11.11" },
                { category: "Инвентарь", amount: 780_000, comment: "Обновление ковриков", date: "10.11" },
                { category: "Коммунальные", amount: 520_000, comment: "Ноябрь", date: "09.11" },
              ].map((row) => (
                <tr key={`${row.category}-${row.date}`} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td className="py-2 pr-4" style={{ color: 'var(--foreground)' }}>{row.category}</td>
                  <td className="py-2 pr-4 font-semibold" style={{ color: colors.expense }}>{currencyFormatter.format(row.amount)} сум</td>
                  <td className="py-2 pr-4 text-zinc-500">{row.comment}</td>
                  <td className="py-2 text-zinc-500">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

