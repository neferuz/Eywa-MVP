"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import { Search, Download, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";

const colors = {
  income: "#10B981",
  expense: "#EF4444",
};

interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  direction: string;
  category: string;
  amount: number;
  description?: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "2025-11-10", type: "income", direction: "Body", category: "Абонемент", amount: 2_000_000, description: "Абонемент BODY · 12 занятий" },
  { id: "t2", date: "2025-11-10", type: "expense", direction: "Coffee", category: "Зарплаты", amount: -3_200_000, description: "Зарплата бариста" },
  { id: "t3", date: "2025-11-11", type: "income", direction: "Coworking", category: "Аренда", amount: 750_000, description: "Капсула 4 чел · 3 часа" },
  { id: "t4", date: "2025-11-11", type: "expense", direction: "Body", category: "Маркетинг", amount: -1_200_000, description: "Реклама в Instagram" },
  { id: "t5", date: "2025-11-11", type: "income", direction: "Coffee", category: "Продажи", amount: 185_000, description: "Продажи за день" },
  { id: "t6", date: "2025-11-12", type: "income", direction: "Body", category: "Разовое занятие", amount: 200_000, description: "Йога · База" },
  { id: "t7", date: "2025-11-12", type: "expense", direction: "Общее", category: "Аренда", amount: -60_000_000, description: "Аренда помещения" },
  { id: "t8", date: "2025-11-12", type: "income", direction: "Event Zone", category: "Аренда", amount: 500_000, description: "Event Zone — 1 час" },
];

const currencyFormatter = new Intl.NumberFormat("ru-RU");

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return INITIAL_TRANSACTIONS.filter((t) => {
      const matchesSearch = !search.trim() || 
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        t.direction.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesDirection = directionFilter === "all" || t.direction === directionFilter;
      return matchesSearch && matchesType && matchesDirection;
    });
  }, [search, typeFilter, directionFilter]);

  const uniqueDirections = useMemo(() => {
    return Array.from(new Set(INITIAL_TRANSACTIONS.map((t) => t.direction)));
  }, []);

  return (
    <div className="finance-page">
      <div className="finance-page__header">
        <div>
          <h1>Операции</h1>
          <p>Таблица всех финансовых транзакций</p>
        </div>
        <div className="finance-page__actions">
          <button className="finance-page__btn">
            <Download className="h-4 w-4" />
            Экспорт
          </button>
        </div>
      </div>

      <Card>
        <div className="finance-transactions__filters">
          <div className="finance-transactions__search">
            <Search className="finance-transactions__search-icon" />
            <input
              type="text"
              placeholder="Поиск по категории, направлению, описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="finance-transactions__filter-group">
            <button
              className={`finance-transactions__filter ${typeFilter === "all" ? "is-active" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              Все
            </button>
            <button
              className={`finance-transactions__filter ${typeFilter === "income" ? "is-active" : ""}`}
              onClick={() => setTypeFilter("income")}
            >
              <ArrowUpRight className="h-3.5 w-3.5" style={{ color: colors.income }} />
              Доход
            </button>
            <button
              className={`finance-transactions__filter ${typeFilter === "expense" ? "is-active" : ""}`}
              onClick={() => setTypeFilter("expense")}
            >
              <ArrowDownRight className="h-3.5 w-3.5" style={{ color: colors.expense }} />
              Расход
            </button>
          </div>
          <div className="finance-transactions__filter-group">
            <select
              className="finance-transactions__select"
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
            >
              <option value="all">Все направления</option>
              {uniqueDirections.map((dir) => (
                <option key={dir} value={dir}>{dir}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="finance-transactions__table-wrapper">
          <table className="finance-transactions__table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Направление</th>
                <th>Категория</th>
                <th>Описание</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="finance-transactions__empty">
                    Операции не найдены
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString("ru-RU")}</td>
                    <td>
                      <span
                        className="finance-transactions__type-badge"
                        style={{
                          background: (t.type === "income" ? colors.income : colors.expense) + "20",
                          color: t.type === "income" ? colors.income : colors.expense,
                        }}
                      >
                        {t.type === "income" ? "Доход" : "Расход"}
                      </span>
                    </td>
                    <td>{t.direction}</td>
                    <td>{t.category}</td>
                    <td style={{ color: "var(--muted-foreground)" }}>{t.description || "—"}</td>
                    <td
                      className="font-semibold"
                      style={{ color: t.type === "income" ? colors.income : colors.expense }}
                    >
                      {t.type === "income" ? "+" : ""}
                      {currencyFormatter.format(Math.abs(t.amount))} сум
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


