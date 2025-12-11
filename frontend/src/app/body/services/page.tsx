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

type ServiceCategory = {
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

const directionLabels: Record<"Body" | "Coworking" | "Coffee", string> = {
  Body: "Body&mind",
  Coworking: "Coworking",
  Coffee: "Детская",
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

  const [categoriesList, setCategoriesList] = useState<ServiceCategory[]>([]);
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
          setCategoriesList(categoriesData);
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

  const categories: ServiceCategory[] = useMemo(() => {
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
      let updatedCategory: ServiceCategory;
      const newName = categoryForm.name.trim();
      
      if (editingCategoryId) {
        // Обновляем существующую категорию
        updatedCategory = await updateCategory(editingCategoryId, categoryForm);
      } else {
        // Если editingCategoryId нет, проверяем, есть ли категория с таким именем в БД
        const existing = categoriesList.find(c => c.name === newName);
        if (existing) {
          // Если категория с таким именем уже есть, обновляем её
          updatedCategory = await updateCategory(existing.id, categoryForm);
        } else {
          // Создаем новую категорию
          updatedCategory = await createCategory(categoryForm);
        }
      }
      
      // Обновляем список категорий
      try {
        const updated = await fetchCategories();
        setCategoriesList(updated);
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
        setCategoriesList(updated);
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
        <div className="body-services__form">
          <div className="body-services__form-grid">
            <label className="body-services__form-field">
              <span>Название</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например, Йога базовая"
              />
            </label>
            <label className="body-services__form-field">
              <span>Категория</span>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Выберите категорию</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="body-services__form-field">
              <span>Направление</span>
              <select
                value={form.direction || "Body"}
                onChange={(e) => setForm((prev) => ({ ...prev, direction: e.target.value as "Body" | "Coworking" | "Coffee" }))}
              >
                <option value="Body">Body&mind</option>
                <option value="Coworking">Coworking</option>
                <option value="Coffee">Детская</option>
              </select>
            </label>
            <label className="body-services__form-field">
              <span>Длительность</span>
              <input
                type="text"
                value={form.duration_minutes || ""}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, duration_minutes: e.target.value }));
                }}
                placeholder="Например: 60 мин, 1 месяц, 30 дней"
              />
            </label>
            <label className="body-services__form-field">
              <span>Стоимость (сум)</span>
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
                }}
                placeholder="Например: 100 000"
              />
            </label>
          </div>
          <label className="body-services__form-field">
            <span>Описание</span>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Добавьте краткое описание услуги"
              rows={3}
            />
          </label>
          <div className="body-services__form-actions">
            <button
              type="button"
              className="body-services__action-btn"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="button"
              className="body-services__action-btn body-services__action-btn--primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
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
        <div className="body-services__form">
          <div className="body-services__form-grid">
            <label className="body-services__form-field">
              <span>Название категории</span>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например, Yoga"
              />
            </label>
          </div>
          <div className="body-services__form-actions">
            <button
              type="button"
              className="body-services__action-btn"
              onClick={() => setIsCategoryModalOpen(false)}
              disabled={isCategorySubmitting}
            >
              Отмена
            </button>
            <button
              type="button"
              className="body-services__action-btn body-services__action-btn--primary"
              onClick={handleCategorySubmit}
              disabled={isCategorySubmitting}
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
