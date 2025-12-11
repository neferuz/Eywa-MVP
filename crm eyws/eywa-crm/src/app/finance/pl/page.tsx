"use client";

import Card from "@/components/Card";
import { Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";

const colors = {
  income: "#10B981",
  expense: "#EF4444",
  profit: "#6366F1",
};

const expenseTable = [
  { category: "Аренда", amount: 60_000_000, percentage: 27 },
  { category: "Зарплаты", amount: 120_000_000, percentage: 54 },
  { category: "Расходники", amount: 25_000_000, percentage: 11 },
  { category: "Маркетинг", amount: 18_000_000, percentage: 8 },
];

const totalIncome = 1_000_000_000;
const totalExpense = expenseTable.reduce((sum, item) => sum + item.amount, 0);
const totalProfit = totalIncome - totalExpense;
const profitability = Math.round((totalProfit / totalIncome) * 100);

const currencyFormatter = new Intl.NumberFormat("ru-RU");

export default function PLPage() {
  return (
    <div className="finance-page">
      <div className="finance-page__header">
        <div>
          <h1>P&L · Прибыль и убыток</h1>
          <p>Структурный отчёт: доходы, расходы, прибыль, рентабельность</p>
        </div>
        <div className="finance-page__actions">
          <button className="finance-page__btn">
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button className="finance-page__btn">
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: colors.income + "20", color: colors.income }}>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Общий доход</div>
          </div>
          <div className="text-2xl font-semibold mb-1">{currencyFormatter.format(totalIncome)} сум</div>
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
          <div className="text-2xl font-semibold mb-1">{currencyFormatter.format(totalExpense)} сум</div>
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
          <div className="text-2xl font-semibold mb-1">{currencyFormatter.format(totalProfit)} сум</div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-medium">+18.3%</span>
            <span className="text-zinc-500">vs прошлый период</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Структура P&L</div>
        <div className="overflow-x-auto">
          <table className="finance-pl-table">
            <thead>
              <tr>
                <th>Статья</th>
                <th>Сумма, сум</th>
                <th>% от выручки</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">Выручка</td>
                <td className="font-semibold">{currencyFormatter.format(totalIncome)}</td>
                <td>100%</td>
              </tr>
              {expenseTable.map((row) => (
                <tr key={row.category}>
                  <td style={{ color: 'var(--foreground)' }}>− {row.category}</td>
                  <td style={{ color: colors.expense }}>{currencyFormatter.format(row.amount)}</td>
                  <td>{row.percentage}%</td>
                </tr>
              ))}
              <tr className="finance-pl-table__profit-row">
                <td className="font-medium">Прибыль</td>
                <td className="font-semibold">{currencyFormatter.format(totalProfit)}</td>
                <td className="font-medium">{profitability}%</td>
              </tr>
              <tr>
                <td>Рентабельность</td>
                <td colSpan={2}>
                  <div className="finance-pl-table__profit-bar">
                    <div
                      className="finance-pl-table__profit-bar-fill"
                      style={{
                        width: `${profitability}%`,
                        background: colors.profit,
                      }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


