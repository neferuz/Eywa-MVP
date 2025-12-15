"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Clock,
  Activity,
  Layers,
  Repeat,
  Move,
  User,
  CircleDollarSign,
  Loader2,
  FileText,
} from "lucide-react";
import {
  BodyService,
  BodyServiceCreate,
  createBodyService,
  deleteBodyService,
  fetchBodyServices,
  updateBodyService,
  ServiceCategory,
  ServiceCategoryCreate,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api";

// UI shape for categories on the page (separate from API type)
type UiServiceCategory = {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  services: BodyService[];
};

const CATEGORY_PRESETS: Record<string, { icon: ComponentType<{ className?: string }>; accent: string }> = {
  Yoga: { icon: Activity, accent: "#3f7f73" },
  Pilates: { icon: Layers, accent: "#6279c7" },
  Reformer: { icon: Repeat, accent: "#6d4dbf" },
  Stretching: { icon: Move, accent: "#d97706" },
  "Персональные тренировки": { icon: User, accent: "#0f6df2" },
};

const getCategoryMeta = (name: string): { icon: ComponentType<{ className?: string }>; accent: string } => {
  // Используем одну иконку для всех категорий
  const defaultIcon = Activity;
  // Используем один цвет для всех категорий
  const defaultAccent = "#6366f1";
  return { icon: defaultIcon, accent: defaultAccent };
};

type ServiceForm = BodyServiceCreate;

const directionLabels: Record<"Body" | "Coworking" | "Coffee" | "Kids", string> = {
  Body: "Body&mind",
  Coworking: "Coworking",
  Coffee: "Детская",
  Kids: "Дети",
};

export default function BodyServicesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [services, setServices] = useState<BodyService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm & { priceDisplay: string }>({
    name: "",
    category: "",
    direction: "Body",
    duration_minutes: "",
    price: 0,
    priceDisplay: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoriesList, setCategoriesList] = useState<UiServiceCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [originalCategoryName, setOriginalCategoryName] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<ServiceCategoryCreate>({
    name: "",
    icon: null,
    accent: null,
  });
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const servicesData = await fetchBodyServices();
        setServices(servicesData);
        if (servicesData.length) {
          setExpandedCategories(new Set([servicesData[0].category]));
          setCategoryFilter("all");
        }
        
        // Загружаем категории отдельно, если не удалось - продолжаем без них
        try {
          const categoriesData = await fetchCategories();
          setCategoriesList(
            categoriesData.map((c) => {
              const meta = getCategoryMeta(c.name);
              return {
                id: c.id,
                name: c.name,
                icon: meta.icon,
                accent: meta.accent,
                services: [],
              };
            }),
          );
        } catch (catErr) {
          // Игнорируем ошибку загрузки категорий - работаем без них
          console.warn("Не удалось загрузить категории:", catErr);
          setCategoriesList([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить услуги");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories: UiServiceCategory[] = useMemo(() => {
    // Группируем услуги по категориям
    const grouped = new Map<string, BodyService[]>();
    services.forEach((svc) => {
      const key = svc.category || "Без направления";
      grouped.set(key, [...(grouped.get(key) ?? []), svc]);
    });

    // Создаем массив категорий из услуг
    const serviceCategories = Array.from(grouped.entries()).map(([name, items]) => {
      const dbCategory = categoriesList.find(c => c.name === name);
      const meta = getCategoryMeta(name);
      if (dbCategory) {
        return {
          id: dbCategory.id,
          name: dbCategory.name,
          icon: meta.icon, // Всегда используем одну иконку
          accent: meta.accent, // Всегда используем один цвет
          services: items,
        };
      }
      return {
        id: name,
        name,
        icon: meta.icon,
        accent: meta.accent,
        services: items,
      };
    });

    // Добавляем категории из БД, которых нет в услугах
    const categoryNamesFromServices = new Set(serviceCategories.map(c => c.name));
    const dbCategoriesWithoutServices = categoriesList
      .filter(c => !categoryNamesFromServices.has(c.name))
      .map(dbCategory => {
        const meta = getCategoryMeta(dbCategory.name);
        return {
          id: dbCategory.id,
          name: dbCategory.name,
          icon: meta.icon, // Всегда используем одну иконку
          accent: meta.accent, // Всегда используем один цвет
          services: [] as BodyService[],
        };
      });

    // Объединяем категории из услуг и категории из БД
    return [...serviceCategories, ...dbCategoriesWithoutServices];
  }, [services, categoriesList]);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories
      .map((cat) => {
        const filteredServices = cat.services.filter((svc) => {
          const matchesSearch =
            !term ||
            svc.name.toLowerCase().includes(term) ||
            (svc.description ?? "").toLowerCase().includes(term);
          const matchesCategory = categoryFilter === "all" || cat.id === categoryFilter;
          const matchesDirection = directionFilter === "all" || svc.direction === directionFilter;
          return matchesSearch && matchesCategory && matchesDirection;
        });
        return { ...cat, services: filteredServices };
      })
      .filter((cat) => {
        // Показываем категорию, если:
        // 1. В ней есть услуги после фильтрации, ИЛИ
        // 2. Это категория из БД (есть в categoriesList) и она соответствует фильтру категорий
        const matchesCategoryFilter = categoryFilter === "all" || cat.id === categoryFilter;
        const isFromDb = categoriesList.some(c => c.id === cat.id);
        return (cat.services.length > 0) || (isFromDb && matchesCategoryFilter);
      });
  }, [categories, categoryFilter, directionFilter, search, categoriesList]);

  // Объединяем категории из БД и категории из услуг для выбора
  const categoryOptions = useMemo(() => {
    const dbCategories = categoriesList.map((c) => c.name);
    const serviceCategories = categories.map((c) => c.name);
    // Объединяем и убираем дубликаты
    const allCategories = [...new Set([...dbCategories, ...serviceCategories])];
    return allCategories.sort();
  }, [categories, categoriesList]);

  const totalServices = services.length;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Функция для форматирования числа с пробелами
  const formatPrice = (value: number | string): string => {
    if (!value && value !== 0) return "";
    const numStr = String(value).replace(/\s/g, "");
    if (!numStr) return "";
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("ru-RU").replace(/,/g, " ");
  };

  // Функция для парсинга отформатированного числа
  const parsePrice = (value: string): number => {
    const cleaned = value.replace(/\s/g, "");
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name: "",
      category: categoryOptions[0] ?? "",
      direction: "Body",
      duration_minutes: "",
      price: 0,
      priceDisplay: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service: BodyService) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      category: service.category,
      direction: service.direction,
      duration_minutes: String(service.duration_minutes || ""),
      price: service.price,
      priceDisplay: formatPrice(service.price),
      description: service.description ?? "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (service: BodyService) => {
    if (!window.confirm(`Удалить услугу «${service.name}»?`)) return;
    try {
      await deleteBodyService(service.id);
      setServices((prev) => prev.filter((s) => s.id !== service.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить услугу");
    }
  };

  const openCreateCategoryModal = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: "", icon: null, accent: null });
    setOriginalCategoryName(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: { id: string; name: string; icon?: string | ComponentType<{ className?: string }> | null; accent?: string | null }) => {
    // Проверяем, есть ли категория в БД по имени (более надежно, чем по id)
    const dbCategory = categoriesList.find(c => c.name === category.name);
    // Если категория в БД, используем её ID, иначе null (будет создана новая)
    const categoryId = dbCategory ? dbCategory.id : null;
    setEditingCategoryId(categoryId);
    // Сохраняем оригинальное имя категории для обновления услуг
    setOriginalCategoryName(category.name);
    
    setCategoryForm({
      name: category.name,
      icon: null, // Не сохраняем иконку
      accent: null, // Не сохраняем цвет
    });
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      setError("Заполните название категории");
      return;
    }
    setIsCategorySubmitting(true);
    setError(null);
    try {
      const newName = categoryForm.name.trim();
      
      if (editingCategoryId) {
        // Обновляем существующую категорию
        await updateCategory(editingCategoryId, categoryForm);
      } else {
        // Если editingCategoryId нет, проверяем, есть ли категория с таким именем в БД
        const existing = categoriesList.find(c => c.name === newName);
        if (existing) {
          // Если категория с таким именем уже есть, обновляем её
          await updateCategory(existing.id, categoryForm);
        } else {
          // Создаем новую категорию
          await createCategory(categoryForm);
        }
      }
      
      // Обновляем список категорий
      try {
        const updated = await fetchCategories();
        setCategoriesList(updated.map((c) => {
          const meta = getCategoryMeta(c.name);
          return { id: c.id, name: c.name, icon: meta.icon, accent: meta.accent, services: [] };
        }));
      } catch (fetchErr) {
        console.warn("Не удалось обновить список категорий:", fetchErr);
      }
      
      // Если название категории изменилось, обновляем услуги с этой категорией
      if (originalCategoryName && originalCategoryName !== newName) {
        // Обновляем услуги, которые используют старое название категории
        const servicesToUpdate = services.filter(s => s.category === originalCategoryName);
        for (const service of servicesToUpdate) {
          try {
            await updateBodyService(service.id, {
              ...service,
              category: newName,
            });
          } catch (err) {
            console.warn("Failed to update service category:", err);
          }
        }
      }
      
      // Перезагружаем услуги, чтобы обновить отображение
      try {
        const servicesData = await fetchBodyServices();
        setServices(servicesData);
      } catch (fetchErr) {
        console.warn("Не удалось обновить список услуг:", fetchErr);
      }
      
      setIsCategoryModalOpen(false);
      setEditingCategoryId(null);
      setOriginalCategoryName(null);
      setCategoryForm({ name: "", icon: null, accent: null });
    } catch (err) {
      console.error("Error saving category:", err);
      setError(err instanceof Error ? err.message : "Не удалось сохранить категорию");
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: { id: string; name: string }) => {
    if (!window.confirm(`Удалить категорию «${category.name}»? Все услуги в этой категории останутся без категории.`)) return;
    try {
      await deleteCategory(category.id);
      // Обновляем список категорий
      try {
        const updated = await fetchCategories();
        setCategoriesList(updated.map((c) => {
          const meta = getCategoryMeta(c.name);
          return { id: c.id, name: c.name, icon: meta.icon, accent: meta.accent, services: [] };
        }));
      } catch (fetchErr) {
        console.warn("Не удалось обновить список категорий:", fetchErr);
        // Удаляем из локального состояния
        setCategoriesList(prev => prev.filter(c => c.id !== category.id));
      }
      // Перезагружаем услуги, чтобы обновить отображение
      try {
        const servicesData = await fetchBodyServices();
        setServices(servicesData);
      } catch (fetchErr) {
        console.warn("Не удалось обновить список услуг:", fetchErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить категорию");
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      setError("Заполните название и направление");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const payload: BodyServiceCreate = {
      name: form.name.trim(),
      category: form.category.trim(),
      direction: form.direction || "Body",
      duration_minutes: String(form.duration_minutes || ""),
      price: form.price || 0,
      description: form.description?.trim() || null,
    };

    try {
      if (editingId) {
        const updated = await updateBodyService(editingId, payload);
        setServices((prev) => prev.map((svc) => (svc.id === editingId ? updated : svc)));
      } else {
        const created = await createBodyService(payload);
        setServices((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить услугу");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="body-services">
      <div className="body-services__header">
        <div className="body-services__header-left">
          <div className="body-services__chips">
            <div className="body-services__stat-chip">
              <span>Всего</span>
              <strong>{totalServices}</strong>
            </div>
            <div className="body-services__stat-chip body-services__stat-chip--muted">
              <span>Категорий</span>
              <strong>{categories.length}</strong>
            </div>
          </div>
        </div>
        <div className="body-services__header-right">
          <div className="body-services__header-buttons">
            <button className="body-services__add-btn" onClick={openCreateCategoryModal}>
              <Plus className="h-4 w-4" />
              Добавить категорию
            </button>
            <button type="button" className="payments-add-btn" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Добавить услугу
            </button>
          </div>
        </div>
      </div>

      <Card className="body-services__filters-card">
        <div className="body-services__filters">
          <div className="body-services__search">
            <Search className="body-services__search-icon" />
            <input
              type="text"
              placeholder="Поиск по названию или описанию"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="body-services__filter-group">
            <span className="body-services__filter-label">Категория:</span>
            <select
              className="body-services__select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Все</option>
              {categoryOptions.map((dir) => (
                <option key={dir} value={dir}>{dir}</option>
              ))}
            </select>
          </div>
          <div className="body-services__filter-group">
            <span className="body-services__filter-label">Направление:</span>
            <select
              className="body-services__select"
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="Body">Body&mind</option>
              <option value="Coworking">Coworking</option>
              <option value="Coffee">Детская</option>
            </select>
          </div>
        </div>
      </Card>

      {error && <div className="body-services__error">{error}</div>}
      {loading ? (
        <div className="body-services__empty">
          <Loader2 className="h-5 w-5 animate-spin" />
          Загрузка услуг...
        </div>
      ) : (
        <div className="body-services__categories">
          {filteredCategories.length === 0 ? (
            <div className="body-services__empty">
              <FileText className="h-4 w-4" />
              Услуги не найдены
            </div>
          ) : (
            filteredCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const Icon = category.icon;
              return (
                <Card key={category.id} className="body-services__category">
                  <div className="body-services__category-header-wrapper">
                  <button
                    className="body-services__category-header"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="body-services__category-title">
                      <div
                        className="body-services__category-icon"
                        style={{
                          borderColor: `${category.accent}33`,
                          color: category.accent,
                          background: `${category.accent}14`,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="body-services__category-text">
                        <span className="body-services__category-name">{category.name}</span>
                        <div className="body-services__category-meta">
                          <span>{category.services.length} услуг</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                    <div className="body-services__category-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="body-services__action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Передаем категорию с иконкой и акцентом
                          openEditCategoryModal({
                            id: category.id,
                            name: category.name,
                            icon: category.icon,
                            accent: category.accent,
                          });
                        }}
                        title="Редактировать категорию"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {(() => {
                        const dbCategory = categoriesList.find(c => c.name === category.name);
                        // Кнопку удаления показываем только если категория существует в БД
                        if (!dbCategory) {
                          return null;
                        }
                        return (
                          <button
                            className="body-services__action-btn body-services__action-btn--danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(dbCategory);
                            }}
                            title="Удалить категорию"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="body-services__category-content">
                      <div className="body-services__table-wrapper">
                        <table className="body-services__table">
                          <thead>
                            <tr>
                              <th>Название</th>
                              <th>Направление</th>
                              <th>Описание</th>
                              <th>Длительность</th>
                              <th>Стоимость</th>
                              <th>Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.services.map((service) => (
                              <tr key={service.id}>
                                <td className="body-services__service-name">{service.name}</td>
                                <td>
                                  <span className="body-services__direction-badge">
                                    {directionLabels[service.direction]}
                                  </span>
                                </td>
                                <td className="body-services__description">
                                  {service.description || "—"}
                                </td>
                                <td>
                                  <div className="body-services__duration">
                                    <Clock className="h-3.5 w-3.5" />
                                    {service.duration_minutes || "—"}
                                  </div>
                                </td>
                                <td>
                                  <div className="body-services__price">
                                    <CircleDollarSign className="h-3.5 w-3.5" />
                                    {service.price.toLocaleString("ru-RU")} сум
                                  </div>
                                </td>
                                <td>
                                  <div className="body-services__actions">
                                    <button
                                      className="body-services__action-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(service);
                                      }}
                                      title="Редактировать"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      className="body-services__action-btn body-services__action-btn--danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(service);
                                      }}
                                      title="Удалить"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Редактировать услугу" : "Добавить услугу"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Название</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например, Йога базовая"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Категория</span>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="">Выберите категорию</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Направление</span>
              <select
                value={form.direction || "Body"}
                onChange={(e) => setForm((prev) => ({ ...prev, direction: e.target.value as "Body" | "Coworking" | "Coffee" }))}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="Body">Body&mind</option>
                <option value="Coworking">Coworking</option>
                <option value="Coffee">Детская</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Длительность</span>
              <input
                type="text"
                value={form.duration_minutes || ""}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, duration_minutes: e.target.value }));
                }}
                placeholder="Например: 60 мин, 1 месяц, 30 дней"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Стоимость (сум)</span>
              <input
                type="text"
                value={form.priceDisplay}
                onChange={(e) => {
                  const input = e.target.value.replace(/\s/g, "");
                  // Разрешаем только цифры или пустую строку
                  if (input === "" || /^\d+$/.test(input)) {
                    const num = input === "" ? 0 : parseInt(input, 10);
                    setForm((prev) => ({
                      ...prev,
                      price: num,
                      priceDisplay: input === "" ? "" : formatPrice(input),
                    }));
                  }
                }}
                onBlur={(e) => {
                  // При потере фокуса форматируем значение, если оно не пустое
                  if (form.price > 0) {
                    setForm((prev) => ({
                      ...prev,
                      priceDisplay: formatPrice(prev.price),
                    }));
                  }
                  // Сбрасываем стили фокуса
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="Например: 100 000"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
              />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Описание</span>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Добавьте краткое описание услуги"
              rows={3}
              style={{
                width: "100%",
                borderRadius: "12px",
                border: "1.5px solid var(--card-border)",
                background: "var(--background)",
                color: "var(--foreground)",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                resize: "vertical",
                minHeight: "100px",
                lineHeight: "1.5",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--card-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: isSubmitting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = "var(--panel)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = "var(--muted)";
                }
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !form.name.trim() || !form.category.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "none",
                background: isSubmitting || !form.name.trim() || !form.category.trim()
                  ? "var(--muted)" 
                  : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: isSubmitting || !form.name.trim() || !form.category.trim()
                  ? "var(--muted-foreground)" 
                  : "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: isSubmitting || !form.name.trim() || !form.category.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSubmitting || !form.name.trim() || !form.category.trim()
                  ? "none" 
                  : "0 4px 12px rgba(99, 102, 241, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && form.name.trim() && form.category.trim()) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && form.name.trim() && form.category.trim()) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.25)";
                }
              }}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategoryId ? "Редактировать категорию" : "Добавить категорию"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Название категории</span>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например, Yoga"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              disabled={isCategorySubmitting}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: isCategorySubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: isCategorySubmitting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isCategorySubmitting) {
                  e.currentTarget.style.background = "var(--panel)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCategorySubmitting) {
                  e.currentTarget.style.background = "var(--muted)";
                }
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCategorySubmit}
              disabled={isCategorySubmitting || !categoryForm.name.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "none",
                background: isCategorySubmitting || !categoryForm.name.trim()
                  ? "var(--muted)" 
                  : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: isCategorySubmitting || !categoryForm.name.trim()
                  ? "var(--muted-foreground)" 
                  : "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: isCategorySubmitting || !categoryForm.name.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: isCategorySubmitting || !categoryForm.name.trim()
                  ? "none" 
                  : "0 4px 12px rgba(99, 102, 241, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (!isCategorySubmitting && categoryForm.name.trim()) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCategorySubmitting && categoryForm.name.trim()) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.25)";
                }
              }}
            >
              {isCategorySubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCategoryId ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
