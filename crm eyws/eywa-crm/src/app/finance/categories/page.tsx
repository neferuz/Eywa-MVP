"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { Plus, Search, Edit2, Trash2, FolderTree } from "lucide-react";

const colors = {
  income: "#10B981",
  expense: "#EF4444",
};

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  parent?: string;
  description?: string;
}

const INITIAL_CATEGORIES: Category[] = [
  // Доходы
  { id: "inc1", name: "Абонементы", type: "income", description: "Абонементы на занятия" },
  { id: "inc2", name: "Разовые визиты", type: "income", description: "Разовые посещения" },
  { id: "inc3", name: "Аренда", type: "income", description: "Аренда помещений и оборудования" },
  { id: "inc4", name: "Продажи Coffee", type: "income", description: "Продажи в кофейне" },
  { id: "inc5", name: "Персональные тренировки", type: "income", description: "Индивидуальные занятия" },
  { id: "inc6", name: "Event Zone", type: "income", description: "Аренда Event Zone" },
  // Расходы
  { id: "exp1", name: "Аренда", type: "expense", description: "Аренда помещений" },
  { id: "exp2", name: "Зарплаты", type: "expense", description: "Зарплаты сотрудников" },
  { id: "exp3", name: "Маркетинг", type: "expense", description: "Реклама и продвижение" },
  { id: "exp4", name: "Расходники", type: "expense", description: "Товары и материалы" },
  { id: "exp5", name: "Коммунальные", type: "expense", description: "Электричество, вода, интернет" },
  { id: "exp6", name: "Оборудование", type: "expense", description: "Покупка и обслуживание оборудования" },
  { id: "exp7", name: "Налоги", type: "expense", description: "Налоговые отчисления" },
];

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  const filteredCategories = INITIAL_CATEGORIES.filter((c) => {
    const matchesSearch = !search.trim() || 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const incomeCategories = filteredCategories.filter((c) => c.type === "income");
  const expenseCategories = filteredCategories.filter((c) => c.type === "expense");

  return (
    <div className="finance-page">
      <div className="finance-page__header">
        <div>
          <h1>Категории</h1>
          <p>Справочник статей доходов и расходов</p>
        </div>
        <button className="finance-page__btn finance-page__btn--primary">
          <Plus className="h-4 w-4" />
          Добавить категорию
        </button>
      </div>

      <Card>
        <div className="finance-categories__filters">
          <div className="finance-categories__search">
            <Search className="finance-categories__search-icon" />
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="finance-categories__filter-group">
            <button
              className={`finance-categories__filter ${typeFilter === "all" ? "is-active" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              Все
            </button>
            <button
              className={`finance-categories__filter ${typeFilter === "income" ? "is-active" : ""}`}
              onClick={() => setTypeFilter("income")}
            >
              Доходы
            </button>
            <button
              className={`finance-categories__filter ${typeFilter === "expense" ? "is-active" : ""}`}
              onClick={() => setTypeFilter("expense")}
            >
              Расходы
            </button>
          </div>
        </div>

        <div className="finance-categories__grid">
          <div className="finance-categories__section">
            <div className="finance-categories__section-header" style={{ color: colors.income }}>
              <FolderTree className="h-4 w-4" />
              <span>Доходы ({incomeCategories.length})</span>
            </div>
            <div className="finance-categories__list">
              {incomeCategories.length === 0 ? (
                <div className="finance-categories__empty">Категории не найдены</div>
              ) : (
                incomeCategories.map((cat) => (
                  <div key={cat.id} className="finance-categories__item" style={{ borderLeftColor: colors.income }}>
                    <div className="finance-categories__item-content">
                      <div className="finance-categories__item-name">{cat.name}</div>
                      {cat.description && (
                        <div className="finance-categories__item-desc">{cat.description}</div>
                      )}
                    </div>
                    <div className="finance-categories__item-actions">
                      <button className="finance-categories__action-btn" title="Редактировать">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="finance-categories__action-btn" title="Удалить">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="finance-categories__section">
            <div className="finance-categories__section-header" style={{ color: colors.expense }}>
              <FolderTree className="h-4 w-4" />
              <span>Расходы ({expenseCategories.length})</span>
            </div>
            <div className="finance-categories__list">
              {expenseCategories.length === 0 ? (
                <div className="finance-categories__empty">Категории не найдены</div>
              ) : (
                expenseCategories.map((cat) => (
                  <div key={cat.id} className="finance-categories__item" style={{ borderLeftColor: colors.expense }}>
                    <div className="finance-categories__item-content">
                      <div className="finance-categories__item-name">{cat.name}</div>
                      {cat.description && (
                        <div className="finance-categories__item-desc">{cat.description}</div>
                      )}
                    </div>
                    <div className="finance-categories__item-actions">
                      <button className="finance-categories__action-btn" title="Редактировать">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="finance-categories__action-btn" title="Удалить">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

