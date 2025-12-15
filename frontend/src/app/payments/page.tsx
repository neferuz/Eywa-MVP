"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { toast } from "@pheralb/toast";
import {
  Activity,
  CreditCard,
  Search,
  X,
  ChevronRight,
  Clock,
  CheckCircle,
  NotebookPen,
  Plus,
  Minus,
  User,
  Pencil,
  Trash2,
  Loader2,
  Phone,
} from "lucide-react";
import {
  PaymentService,
  PaymentServiceCategory,
  PaymentServiceCreate,
  PaymentServiceUpdate,
  fetchPaymentServices,
  fetchPaymentServiceCategories,
  createPaymentService,
  updatePaymentService,
  deletePaymentService,
  createPaymentServiceCategory,
  updatePaymentServiceCategory,
  deletePaymentServiceCategory,
  fetchClientsFromApi,
  createPayment,
} from "@/lib/api";

const currencyFormatter = new Intl.NumberFormat("ru-RU");

interface ServiceItem extends PaymentService {
  category?: PaymentServiceCategory;
}

interface ServiceCategoryWithServices extends PaymentServiceCategory {
  services: ServiceItem[];
}

const formatPrice = (price: number): string => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const parsePrice = (value: string): number => {
  return Number(value.replace(/\s/g, "")) || 0;
};

const PAYMENT_METHODS = [
  { id: "cash", label: "Наличные" },
  { id: "transfer", label: "Перевод" },
];

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [serviceCategories, setServiceCategories] = useState<ServiceCategoryWithServices[]>([]);
  const [categories, setCategories] = useState<PaymentServiceCategory[]>([]);
  const [services, setServices] = useState<PaymentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [extendMode, setExtendMode] = useState<{ clientId: string; clientName: string; serviceName: string } | null>(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<(ServiceItem & { category: PaymentServiceCategory }) | null>(null);
  const [drawerState, setDrawerState] = useState<"closed" | "open" | "closing">("closed");
  const [quantity, setQuantity] = useState(1);
  const [hours, setHours] = useState(1);
  const [paymentMethods, setPaymentMethods] = useState<{ [key: string]: number }>({});
  const [comment, setComment] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [allClients, setAllClients] = useState<any[]>([]);
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PaymentServiceCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<PaymentServiceCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    accent: "#6366F1",
  });
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    categoryId: 0,
    name: "",
    description: "",
    price: "",
    duration: "",
    hint: "",
  });

  // Load data from backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [categoriesData, servicesData, clientsData] = await Promise.all([
          fetchPaymentServiceCategories(),
          fetchPaymentServices(),
          fetchClientsFromApi<any>({}).catch(() => []), // Загружаем клиентов из базы
        ]);
        setCategories(categoriesData);
        setServices(servicesData);
        setAllClients(clientsData);

        // Проверяем query параметры для режима продления
        const clientId = searchParams.get("client_id");
        const serviceName = searchParams.get("service_name");
        let isExtendMode = false;

        if (clientId && serviceName) {
          isExtendMode = true;
          // Находим клиента
          const client = clientsData.find((c: any) => c.id === clientId || c.public_id === clientId);
          if (client) {
            setExtendMode({
              clientId: client.id || client.public_id,
              clientName: client.name || "Клиент",
              serviceName: serviceName,
            });
            setSelectedClientId(client.id || client.public_id);
            setClientName(client.name || "");
            setClientPhone(client.phone || "");
          }

          // Не выделяем услугу автоматически - пусть пользователь сам выберет
          // setHighlightedServiceId(null);

          // Очищаем URL от query параметров
          router.replace("/payments", { scroll: false });
        }

        // Group services by category
        // Если режим продления - фильтруем услуги в категории BODY (только абонементы)
        const grouped: ServiceCategoryWithServices[] = categoriesData.map((cat) => {
          let categoryServices = servicesData.filter((s) => s.category_id === cat.id);
          
          // Если режим продления и категория BODY - показываем только абонементы
          if (isExtendMode && (cat.name.toLowerCase() === "body" || cat.name.toLowerCase() === "bODY")) {
            categoryServices = categoryServices.filter((s) => {
              // Определяем абонемент по:
              // 1. Наличию слова "абонемент" в названии
              // 2. Наличию в duration числа больше 1 + "занят" (например "12 занятий")
              const hasAbonementInName = s.name.toLowerCase().includes("абонемент");
              
              // Проверяем duration на наличие числа больше 1 и слова "занят"
              let isAbonementByDuration = false;
              if (s.duration) {
                const durationLower = s.duration.toLowerCase();
                // Ищем паттерн типа "12 занятий", "8 занятий" и т.д.
                const match = durationLower.match(/(\d+)\s*занят/i);
                if (match) {
                  const count = parseInt(match[1], 10);
                  // Если больше 1 занятия - это абонемент
                  isAbonementByDuration = count > 1;
                }
              }
              
              // Показываем только абонементы
              return hasAbonementInName || isAbonementByDuration;
            });
          }
          
          return {
            ...cat,
            services: categoryServices,
          };
        });
        setServiceCategories(grouped);
      } catch (err) {
        console.error("Failed to load payment services:", err);
        // Fallback to empty state
        setServiceCategories([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams, router]);

  useEffect(() => {
    if (categories.length > 0 && newServiceData.categoryId === 0) {
      setNewServiceData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, newServiceData.categoryId]);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return serviceCategories;
    const result: ServiceCategoryWithServices[] = [];
    for (const category of serviceCategories) {
      const filteredServices = category.services.filter((service) =>
        service.name.toLowerCase().includes(term)
      );
      if (filteredServices.length) {
        result.push({ ...category, services: filteredServices });
      }
    }
    return result;
  }, [search, serviceCategories]);

  const handleSelectService = (service: ServiceItem, category: PaymentServiceCategory) => {
    setSelectedService({ ...service, category });
    setQuantity(1);
    setHours(1);
    setManualPrice("");
    setPaymentMethods({});
    setComment("");
    setClientSearch("");
    // В режиме продления не сбрасываем выбранного клиента
    if (!extendMode) {
      setSelectedClientId("");
      setClientName("");
      setClientPhone("");
    }
    setClientSearchResults([]);
    setShowClientSearch(false);
    setDrawerState("open");
  };

  useEffect(() => {
    if (clientSearch.trim().length > 0 && !selectedClientId) {
      const term = clientSearch.toLowerCase();
      const results = allClients.filter(
        (client) =>
          (client.name && client.name.toLowerCase().includes(term)) ||
          (client.phone && client.phone.toLowerCase().includes(term)) ||
          (client.instagram && client.instagram.toLowerCase().includes(term))
      );
      setClientSearchResults(results);
      setShowClientSearch(results.length > 0);
    } else {
      setClientSearchResults([]);
      setShowClientSearch(false);
    }
  }, [clientSearch, allClients, selectedClientId]);

  const handleSelectClient = (client: any) => {
    setSelectedClientId(client.id || client.public_id);
    setClientName(client.name || "");
    setClientPhone(client.phone || "");
    setClientSearch(""); // Очищаем поиск, чтобы скрыть результаты
    setShowClientSearch(false);
    setClientSearchResults([]);
  };

  const handleClearClient = () => {
    setSelectedClientId("");
    setClientName("");
    setClientPhone("");
    setClientSearch("");
    setShowClientSearch(false);
    setClientSearchResults([]);
  };

  const closeDrawer = () => {
    setDrawerState("closing");
    setTimeout(() => {
      setDrawerState("closed");
      setSelectedService(null);
    }, 220);
  };

  const visibleDrawer = drawerState !== "closed" && selectedService;

  // Парсим количество из duration (например, "12 занятий" -> 12)
  const parseQuantityFromDuration = (duration: string | null | undefined): number => {
    if (!duration) return 1;
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  const effectiveQuantity = selectedService
    ? selectedService.billing === "perHour"
      ? hours
      : selectedService.billing === "custom"
        ? 1
        : parseQuantityFromDuration(selectedService.duration) // Парсим из duration для perService
    : 0;

  const total = selectedService
    ? selectedService.billing === "custom"
      ? Number(manualPrice.replace(/\s/g, "")) || 0
      : selectedService.billing === "perHour"
        ? selectedService.price * hours
        : selectedService.price // Для perService цена уже указана за весь абонемент, не умножаем
    : 0;

  const formattedTotal = currencyFormatter.format(total);

  const handleCreateService = async () => {
    if (
      !newServiceData.categoryId ||
      !newServiceData.name.trim() ||
      !newServiceData.price.trim()
    ) {
      return;
    }
    try {
      const priceValue = parsePrice(newServiceData.price);
      const priceLabel = `${formatPrice(priceValue)} сум`;
      
      const payload: PaymentServiceCreate = {
        category_id: newServiceData.categoryId,
      name: newServiceData.name.trim(),
      price: priceValue,
        price_label: priceLabel,
        billing: "perService", // Значение по умолчанию
        hint: newServiceData.hint || null,
        description: newServiceData.description.trim() || null,
        duration: newServiceData.duration.trim() || null,
        trainer: null,
    };
      
      const created = await createPaymentService(payload);
      
      // Reload data
      const [categoriesData, servicesData] = await Promise.all([
        fetchPaymentServiceCategories(),
        fetchPaymentServices(),
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
      const grouped: ServiceCategoryWithServices[] = categoriesData.map((cat) => ({
        ...cat,
        services: servicesData.filter((s) => s.category_id === cat.id),
      }));
      setServiceCategories(grouped);
      
    closeCreateModal();
    setNewServiceData({
        categoryId: categoriesData[0]?.id || 0,
      name: "",
      description: "",
      price: "",
      duration: "",
      hint: "",
      });
    } catch (err) {
      console.error("Failed to create service:", err);
      alert("Не удалось создать услугу");
    }
  };

  const handleEditService = (service: ServiceItem) => {
    setEditingService(service);
    const category = categories.find((c) => c.id === service.category_id);
    setNewServiceData({
      categoryId: service.category_id,
      name: service.name,
      description: service.description || "",
      price: formatPrice(service.price),
      duration: service.duration || "",
      hint: service.hint || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateService = async () => {
    if (!editingService || !newServiceData.name.trim() || !newServiceData.price.trim()) {
      return;
    }
    try {
      const priceValue = parsePrice(newServiceData.price);
      const priceLabel = `${formatPrice(priceValue)} сум`;
      
      const payload: PaymentServiceUpdate = {
        category_id: newServiceData.categoryId,
        name: newServiceData.name.trim(),
        price: priceValue,
        price_label: priceLabel,
        billing: editingService?.billing || "perService", // Сохраняем существующее значение
        hint: newServiceData.hint || null,
        description: newServiceData.description.trim() || null,
        duration: newServiceData.duration.trim() || null,
        trainer: editingService?.trainer || null, // Сохраняем существующее значение
      };
      
      await updatePaymentService(editingService.public_id, payload);
      
      // Reload data
      const [categoriesData, servicesData] = await Promise.all([
        fetchPaymentServiceCategories(),
        fetchPaymentServices(),
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
      const grouped: ServiceCategoryWithServices[] = categoriesData.map((cat) => ({
        ...cat,
        services: servicesData.filter((s) => s.category_id === cat.id),
      }));
      setServiceCategories(grouped);
      
      closeEditModal();
    } catch (err) {
      console.error("Failed to update service:", err);
      alert("Не удалось обновить услугу");
    }
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;
    try {
      await deletePaymentService(deletingService.public_id);
      
      // Reload data
      const [categoriesData, servicesData] = await Promise.all([
        fetchPaymentServiceCategories(),
        fetchPaymentServices(),
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
      const grouped: ServiceCategoryWithServices[] = categoriesData.map((cat) => ({
        ...cat,
        services: servicesData.filter((s) => s.category_id === cat.id),
      }));
      setServiceCategories(grouped);
      
      closeDeleteModal();
    } catch (err) {
      console.error("Failed to delete service:", err);
      alert("Не удалось удалить услугу");
    }
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      alert("Заполните название категории");
      return;
    }
    setIsCategorySubmitting(true);
    try {
      if (editingCategory) {
        // Обновляем существующую категорию (сохраняем существующий цвет)
        await updatePaymentServiceCategory(editingCategory.public_id, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          accent: editingCategory.accent, // Сохраняем существующий цвет из БД
        });
      } else {
        // Создаем новую категорию (используем дефолтный цвет)
        await createPaymentServiceCategory({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          accent: "#6366F1", // Дефолтный цвет для новых категорий
        });
      }
      
      // Reload data
      const [categoriesData, servicesData] = await Promise.all([
        fetchPaymentServiceCategories(),
        fetchPaymentServices(),
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
      const grouped: ServiceCategoryWithServices[] = categoriesData.map((cat) => ({
        ...cat,
        services: servicesData.filter((s) => s.category_id === cat.id),
      }));
      setServiceCategories(grouped);
      
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", accent: "#6366F1" });
    } catch (err) {
      console.error("Failed to save category:", err);
      alert("Не удалось сохранить категорию");
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deletePaymentServiceCategory(deletingCategory.public_id);
      
      // Reload data
      const [categoriesData, servicesData] = await Promise.all([
        fetchPaymentServiceCategories(),
        fetchPaymentServices(),
      ]);
      setCategories(categoriesData);
      setServices(servicesData);
      const grouped: ServiceCategoryWithServices[] = categoriesData.map((cat) => ({
        ...cat,
        services: servicesData.filter((s) => s.category_id === cat.id),
      }));
      setServiceCategories(grouped);
      
      setIsCategoryDeleteModalOpen(false);
      setDeletingCategory(null);
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert("Не удалось удалить категорию");
    }
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewServiceData({
      categoryId: categories[0]?.id || 0,
      name: "",
      description: "",
      price: "",
      duration: "",
      hint: "",
    });
  };
  
  const openEditModal = (service: ServiceItem) => handleEditService(service);
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingService(null);
  };
  
  const openDeleteModal = (service: ServiceItem) => {
    setDeletingService(service);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingService(null);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Баннер для режима продления абонемента */}
      {extendMode && (
        <Card style={{ 
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
        }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <CreditCard className="h-5 w-5" style={{ color: "#fff" }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--foreground)", marginBottom: "0.25rem" }}>
                  Продление абонемента для {extendMode.clientName}
                </div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Выберите абонемент для продления из категории BODY
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setExtendMode(null);
                setHighlightedServiceId(null);
                setSelectedClientId("");
                setClientName("");
                setClientPhone("");
              }}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--background)";
              }}
            >
              Отменить
            </button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Услуги и оплаты</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Выберите услугу или добавьте новую позицию</p>
        </div>
        <button
          type="button"
          className="payments-add-btn"
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" />
          Добавить услугу
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
        </div>
      ) : (
      <section className="grid gap-5 xl:grid-cols-2">
        {filteredCategories.map((category) => (
          <Card
            key={category.id}
            className="space-y-4 overflow-hidden"
            style={{
              position: "relative",
              boxShadow: "0 30px 60px -45px rgba(15,23,42,0.45)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                <span className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "rgba(23,23,23,0.5)" }}>
                  Категория
                </span>
                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{category.name}</h2>
                  <p className="text-sm leading-snug" style={{ color: "var(--muted-foreground)" }}>{category.description || ""}</p>
              </div>
                <div className="flex items-center gap-1">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${category.accent}15, ${category.accent}25)`, 
                      border: "1px solid rgba(15,23,42,0.08)" 
                    }}
                  >
                    <Activity className="h-5 w-5" style={{ color: category.accent }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryForm({
                          name: category.name,
                          description: category.description || "",
                          accent: category.accent,
                        });
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                      title="Редактировать категорию"
                    >
                      <Pencil className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingCategory(category);
                        setIsCategoryDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                      title="Удалить категорию"
                    >
                      <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                    </button>
                  </div>
              </div>
            </div>

            <div className="space-y-2">
              {category.services.map((service) => {
                const isHighlighted = highlightedServiceId === service.public_id;
                return (
                  <div
                    key={service.public_id}
                    className="group w-full rounded-2xl px-4 py-3 flex items-center justify-between gap-4"
                  style={{
                    background: isHighlighted 
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)"
                      : "var(--background)",
                    border: isHighlighted 
                      ? "2px solid rgba(99, 102, 241, 0.4)"
                      : "1px solid var(--card-border)",
                    boxShadow: isHighlighted ? "0 4px 12px rgba(99, 102, 241, 0.15)" : "none",
                  }}
                  >
                    <button
                      onClick={() => handleSelectService(service, category)}
                      className="flex-1 flex items-center justify-between gap-4 text-left transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{service.name}</span>
                        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{service.price_label}</span>
                    {service.duration && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <Clock className="h-3 w-3 inline mr-1" style={{ verticalAlign: "middle" }} />
                        {service.duration}
                      </span>
                    )}
                    {service.hint && (
                      <span className="text-xs" style={{ color: "rgba(15, 118, 110, 0.8)" }}>{service.hint}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                    <span>Выбрать</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                        title="Редактировать"
                      >
                        <Pencil className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(service)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        {!filteredCategories.length && (
          <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <NotebookPen className="h-8 w-8" style={{ color: "var(--muted-foreground)" }} />
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Ничего не нашли</div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Попробуйте изменить запрос или очистите поле поиска.
            </p>
          </Card>
        )}
      </section>
      )}

      {visibleDrawer && selectedService ? (
        <>
          <div
            className={`calendar-drawer-overlay ${drawerState === "closing" ? "is-closing" : ""}`}
            onClick={closeDrawer}
          />
          <aside className={`calendar-drawer ${drawerState === "closing" ? "is-closing" : ""}`}>
            <div className="calendar-drawer__header" style={{ padding: "1.25rem 1.5rem" }}>
              <div>
                <p className="calendar-drawer__subtitle" style={{ color: "var(--muted-foreground)", fontSize: "0.6875rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                  {selectedService.category.name}
                </p>
                <h3 className="calendar-drawer__title" style={{ color: "var(--foreground)", fontSize: "1.125rem", fontWeight: 600, margin: "0.375rem 0 0 0" }}>
                  {selectedService.name}
                </h3>
              </div>
              <button 
                className="calendar-drawer__close" 
                onClick={closeDrawer} 
                aria-label="Закрыть"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <X className="h-4 w-4" style={{ color: "var(--foreground)" }} />
              </button>
            </div>

            <div className="calendar-drawer__content" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem", flex: 1, overflowY: "auto" }}>
              <div className="grid grid-cols-2 gap-2">
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border)",
                  background: "var(--muted)",
                }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Clock className="h-3.5 w-3.5" style={{ color: "#fff" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", marginBottom: "0.125rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Тариф</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedService.price_label}</div>
                </div>
                  </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border)",
                  background: "var(--muted)",
                }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <CreditCard className="h-3.5 w-3.5" style={{ color: "#fff" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", marginBottom: "0.125rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Итого</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formattedTotal} сум</div>
                  </div>
                </div>
              </div>
              {selectedService.duration && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border)",
                  background: "var(--muted)",
                }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Clock className="h-3.5 w-3.5" style={{ color: "#fff" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", marginBottom: "0.125rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Длительность</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedService.duration}</div>
                  </div>
                </div>
              )}

              <form 
                className="body-services__form" 
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!selectedService) return;
                  
                  const totalPaid = Object.values(paymentMethods).reduce((sum, val) => sum + val, 0);
                  if (totalPaid !== total) {
                    toast.error({
                      text: "Сумма оплаты не совпадает с итогом",
                    });
                    return;
                  }
                  
                  if (selectedService.billing === "custom" && !manualPrice) {
                    toast.warning({
                      text: "Укажите стоимость для услуги",
                    });
                    return;
                  }
                  
                  try {
                    const category = categories.find(c => c.id === selectedService.category_id);
                    await createPayment({
                      client_id: selectedClientId || null,
                      client_name: clientName || null,
                      client_phone: clientPhone || null,
                      service_id: selectedService.public_id,
                      service_name: selectedService.name,
                      service_category: category?.name || null,
                      total_amount: total,
                      cash_amount: paymentMethods.cash || 0,
                      transfer_amount: paymentMethods.transfer || 0,
                      quantity: effectiveQuantity,
                      hours: selectedService.billing === "perHour" ? hours : null,
                      comment: comment || null,
                      status: "completed",
                    });
                    
                    // Показываем уведомление об успехе
                    toast.success({
                      text: `Оплата на сумму ${formatPrice(total)} сум успешно создана!`,
                    });
                    
                    // Reset form
                    setQuantity(1);
                    setHours(1);
                    setManualPrice("");
                    setComment("");
                    setPaymentMethods({ cash: 0, transfer: 0 });
                    setSelectedClientId("");
                    setClientName("");
                    setClientPhone("");
                    closeDrawer();
                  } catch (err) {
                    console.error("Failed to create payment:", err);
                    toast.error({
                      text: "Не удалось сохранить оплату",
                    });
                  }
                }} 
                style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <div className="body-services__form-field">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <User className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                    Клиент
                  </span>
                  {!selectedClientId && (
                    <div style={{ position: "relative", width: "100%" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "10px",
                        border: "1.5px solid var(--card-border)",
                        background: "var(--background)",
                        transition: "all 0.2s ease",
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
                        <Search className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(event) => {
                            const value = event.target.value;
                            setClientSearch(value);
                            if (value.trim().length === 0) {
                              handleClearClient();
                          }
                        }}
                        onFocus={() => {
                          if (clientSearch.trim().length > 0 && clientSearchResults.length > 0) {
                            setShowClientSearch(true);
                          }
                        }}
                        placeholder="Поиск клиента или введите имя"
                          style={{
                            border: "none",
                            background: "transparent",
                            width: "100%",
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            outline: "none",
                          }}
                      />
                    </div>
                    {showClientSearch && clientSearchResults.length > 0 && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 0.5rem)",
                        left: 0,
                        right: 0,
                        maxHeight: "240px",
                        overflowY: "auto",
                        background: "var(--background)",
                        border: "1px solid var(--card-border)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        zIndex: 10,
                      }}>
                        {clientSearchResults.map((client) => (
                          <button
                            key={client.id || client.public_id}
                            type="button"
                            onClick={() => handleSelectClient(client)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.75rem 1rem",
                              border: "none",
                              borderBottom: "1px solid var(--card-border)",
                              background: "transparent",
                              width: "100%",
                              textAlign: "left",
                              cursor: "pointer",
                              transition: "background 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--muted)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <User className="h-4 w-4" style={{ color: "#fff" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {client.name || "Без имени"}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {client.phone || "—"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </div>

                {selectedClientId ? (
                  <div className="body-services__form-field">
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.875rem 1rem",
                      borderRadius: "12px",
                      border: "1px solid var(--card-border)",
                      background: "var(--muted)",
                      position: "relative",
                    }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
                      }}>
                        <User className="h-5 w-5" style={{ color: "#fff" }} />
                      </div>
                      <Link 
                        href={`/body/clients/${selectedClientId}`}
                        style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
                      >
                        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                          <div style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
                            Выбранный клиент
                          </div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {clientName || "Без имени"}
                          </div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Phone className="h-3.5 w-3.5" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {clientPhone || "—"}
                            </span>
                          </div>
                        </div>
                      </Link>
                      {/* Скрываем кнопку удаления в режиме продления */}
                      {!extendMode && (
                        <button
                          type="button"
                          onClick={handleClearClient}
                          title="Очистить выбор"
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            border: "none",
                            background: "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <X className="h-4 w-4" style={{ color: "#EF4444" }} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", margin: 0, padding: "0.5rem 0" }}>
                    Выберите клиента из результатов поиска. Добавление нового клиента скоро появится.
                  </p>
                )}

                {selectedService.billing === "custom" && (
                  <div className="body-services__form-field">
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CreditCard className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                      Стоимость услуги
                    </span>
                    <input
                      type="text"
                      value={manualPrice}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\s/g, "");
                        if (value === "" || /^\d+$/.test(value)) {
                          const num = value === "" ? "" : formatPrice(Number(value));
                          setManualPrice(num);
                        }
                      }}
                      placeholder="Введите сумму"
                      required
                    />
                  </div>
                )}
                {selectedService.billing === "perHour" && (
                  <div className="body-services__form-field">
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Clock className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                      Количество часов
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <button
                        type="button"
                        onClick={() => setHours((value) => Math.max(1, value - 1))}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: "1px solid var(--card-border)",
                          background: "var(--background)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--muted)";
                          e.currentTarget.style.borderColor = "var(--foreground)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--background)";
                          e.currentTarget.style.borderColor = "var(--card-border)";
                        }}
                      >
                        <Minus className="h-3.5 w-3.5" style={{ color: "var(--foreground)" }} />
                      </button>
                      <div style={{ 
                        width: "56px", 
                        textAlign: "center", 
                        fontSize: "0.8125rem", 
                        fontWeight: 600, 
                        color: "var(--foreground)",
                        padding: "0.5rem",
                        background: "var(--muted)",
                        borderRadius: "8px",
                      }}>{hours}</div>
                      <button
                        type="button"
                        onClick={() => setHours((value) => value + 1)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: "1px solid var(--card-border)",
                          background: "var(--background)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--muted)";
                          e.currentTarget.style.borderColor = "var(--foreground)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--background)";
                          e.currentTarget.style.borderColor = "var(--card-border)";
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" style={{ color: "var(--foreground)" }} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="body-services__form-field">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <CreditCard className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                    Метод оплаты
                  </span>
                  <div style={{ 
                    padding: "1rem", 
                    borderRadius: "12px", 
                    background: "var(--muted)", 
                    border: "1px solid var(--card-border)",
                    marginBottom: "0.75rem",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = paymentMethods[method.id] !== undefined;
                        const currentAmount = paymentMethods[method.id] || 0;
                        const hasAmount = currentAmount > 0;
                        const hasFullAmount = currentAmount === total;
                        
                        return (
                          <div
                            key={method.id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                              padding: "0.875rem",
                              borderRadius: "10px",
                              border: hasAmount ? "1.5px solid #6366F1" : "1px solid var(--card-border)",
                              background: hasAmount ? "rgba(99, 102, 241, 0.08)" : "var(--background)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.625rem",
                                  cursor: "pointer",
                                  minWidth: "100px",
                                  flexShrink: 0,
                                }}
                              >
                        <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // При включении метода, сумма остается 0
                                      setPaymentMethods((prev) => ({
                                        ...prev,
                                        [method.id]: 0,
                                      }));
                                    } else {
                                      // При выключении удаляем метод
                                      setPaymentMethods((prev) => {
                                        const newMethods = { ...prev };
                                        delete newMethods[method.id];
                                        return newMethods;
                                      });
                                    }
                                  }}
                                  style={{ 
                                    margin: 0, 
                                    cursor: "pointer", 
                                    accentColor: "#6366F1",
                                    width: "18px",
                                    height: "18px",
                                  }}
                        />
                                <span style={{ 
                                  fontSize: "0.875rem", 
                                  fontWeight: hasAmount ? 600 : 500, 
                                  color: "var(--foreground)",
                                  userSelect: "none",
                                }}>
                                  {method.label}
                                </span>
                      </label>
                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethods((prev) => ({
                                      ...prev,
                                      [method.id]: total,
                                    }));
                                  }}
                                  style={{
                                    marginLeft: "auto",
                                    padding: "0.5rem 0.875rem",
                                    borderRadius: "8px",
                                    border: "1px solid #6366F1",
                                    background: hasFullAmount ? "#6366F1" : "transparent",
                                    color: hasFullAmount ? "#fff" : "#6366F1",
                                    fontSize: "0.8125rem",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!hasFullAmount) {
                                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!hasFullAmount) {
                                      e.currentTarget.style.background = "transparent";
                                    }
                                  }}
                                >
                                  Вся сумма
                                </button>
                              )}
                  </div>
                            {isSelected && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <input
                                  type="text"
                                  value={currentAmount === 0 ? "" : formatPrice(currentAmount)}
                                  onChange={(event) => {
                                    const value = event.target.value.replace(/\s/g, "");
                                    if (value === "" || /^\d+$/.test(value)) {
                                      const num = value === "" ? 0 : Number(value);
                                      setPaymentMethods((prev) => ({
                                        ...prev,
                                        [method.id]: num,
                                      }));
                                    }
                                  }}
                                  placeholder="Или введите сумму вручную"
                                  style={{
                                    flex: 1,
                                    padding: "0.625rem 0.875rem",
                                    borderRadius: "8px",
                                    border: "1.5px solid var(--card-border)",
                                    background: "var(--background)",
                                    fontSize: "0.875rem",
                                    color: "var(--foreground)",
                                    outline: "none",
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
                                <span style={{ 
                                  fontSize: "0.75rem", 
                                  color: "var(--muted-foreground)",
                                  minWidth: "35px",
                                  textAlign: "right",
                                }}>
                                  сум
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                </div>

                    <div style={{
                      marginTop: "1rem",
                      padding: "0.875rem 1rem",
                      borderRadius: "10px",
                      background: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                          Оплачено:
                        </span>
                        <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--foreground)" }}>
                          {formatPrice(Object.values(paymentMethods).reduce((sum, val) => sum + val, 0))} сум
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                          К оплате:
                        </span>
                        <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--foreground)" }}>
                          {formatPrice(total)} сум
                        </span>
                      </div>
                      {Object.values(paymentMethods).reduce((sum, val) => sum + val, 0) !== total && (
                        <div style={{ 
                          marginTop: "0.75rem", 
                          padding: "0.625rem 0.75rem",
                          borderRadius: "8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <div style={{ 
                            width: "4px", 
                            height: "4px", 
                            borderRadius: "50%", 
                            background: "#EF4444",
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: "0.8125rem", color: "#EF4444", fontWeight: 500 }}>
                            Сумма не совпадает. Остаток: {formatPrice(Math.abs(total - Object.values(paymentMethods).reduce((sum, val) => sum + val, 0)))} сум
                          </span>
                        </div>
                      )}
                      {Object.values(paymentMethods).reduce((sum, val) => sum + val, 0) === total && Object.values(paymentMethods).filter(v => v > 0).length > 0 && (
                        <div style={{ 
                          marginTop: "0.75rem", 
                          padding: "0.625rem 0.75rem",
                          borderRadius: "8px",
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <CheckCircle className="h-3.5 w-3.5" style={{ color: "#10B981", flexShrink: 0 }} />
                          <span style={{ fontSize: "0.8125rem", color: "#10B981", fontWeight: 500 }}>
                            Сумма совпадает
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="body-services__form-field">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <NotebookPen className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                    Комментарий
                  </span>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Например: оплатил наличными, нужен чек"
                  />
                </div>

                <div className="body-services__form-actions">
                  <button
                    type="button"
                    className="body-services__action-btn"
                    onClick={closeDrawer}
                  >
                    Отменить
                  </button>
                  <button
                    type="submit"
                    className="body-services__action-btn body-services__action-btn--primary"
                    disabled={
                      (selectedService.billing === "custom" && !manualPrice) ||
                      Object.values(paymentMethods).reduce((sum, val) => sum + val, 0) !== total ||
                      Object.values(paymentMethods).filter(v => v > 0).length === 0
                    }
                  >
                    <CheckCircle className="h-4 w-4" />
                    Добавить в чек — {formattedTotal} сум
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </>
      ) : null}

      <Modal open={isCreateModalOpen} onClose={closeCreateModal} title="Добавление услуги">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Категория</span>
              <select
                value={newServiceData.categoryId}
                onChange={(event) =>
                  setNewServiceData((prev) => ({ ...prev, categoryId: Number(event.target.value) }))
                }
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
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Название услуги</span>
              <input
                type="text"
                value={newServiceData.name}
                onChange={(event) =>
                  setNewServiceData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Например, Stretching · разовое занятие"
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
                value={newServiceData.price}
                onChange={(event) => {
                  const value = event.target.value.replace(/\s/g, "");
                  if (value === "" || /^\d+$/.test(value)) {
                    const num = value === "" ? "" : formatPrice(Number(value));
                    setNewServiceData((prev) => ({ ...prev, price: num }));
                  }
                }}
                placeholder="200 000"
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
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Длительность</span>
              <input
                type="text"
                value={newServiceData.duration}
                onChange={(event) =>
                  setNewServiceData((prev) => ({ ...prev, duration: event.target.value }))
                }
                placeholder="12 занятий"
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
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Описание</span>
              <textarea
                value={newServiceData.description}
                onChange={(event) =>
                  setNewServiceData((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Кратко опишите услугу"
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
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
            <button
              type="button"
              onClick={closeCreateModal}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--panel)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--muted)";
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCreateService}
              disabled={!newServiceData.name.trim() || !newServiceData.price.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "none",
                background: !newServiceData.name.trim() || !newServiceData.price.trim() 
                  ? "var(--muted)" 
                  : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: !newServiceData.name.trim() || !newServiceData.price.trim() 
                  ? "var(--muted-foreground)" 
                  : "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: !newServiceData.name.trim() || !newServiceData.price.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: !newServiceData.name.trim() || !newServiceData.price.trim() 
                  ? "none" 
                  : "0 4px 12px rgba(99, 102, 241, 0.25)",
              }}
              onMouseEnter={(e) => {
                if (newServiceData.name.trim() && newServiceData.price.trim()) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (newServiceData.name.trim() && newServiceData.price.trim()) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.25)";
                }
              }}
            >
              Сохранить услугу
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={isEditModalOpen} onClose={closeEditModal} title="Редактирование услуги">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Категория</span>
              <select
                value={newServiceData.categoryId}
                onChange={(event) =>
                  setNewServiceData((prev) => ({ ...prev, categoryId: Number(event.target.value) }))
                }
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
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Название услуги</span>
              <input
                type="text"
                value={newServiceData.name}
                onChange={(event) =>
                  setNewServiceData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Например, Stretching · разовое занятие"
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
                value={newServiceData.price}
                onChange={(event) => {
                  const value = event.target.value.replace(/\s/g, "");
                  if (value === "" || /^\d+$/.test(value)) {
                    const num = value === "" ? "" : formatPrice(Number(value));
                    setNewServiceData((prev) => ({ ...prev, price: num }));
                  }
                }}
                placeholder="200 000"
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
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Длительность</span>
              <input
                type="text"
                value={newServiceData.duration}
                onChange={(event) =>
                  setNewServiceData((prev) => ({ ...prev, duration: event.target.value }))
                }
                placeholder="12 занятий"
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
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Описание</span>
              <textarea
                value={newServiceData.description}
                onChange={(event) =>
                  setNewServiceData((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Кратко опишите услугу"
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
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
            <button
              type="button"
              onClick={closeEditModal}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--panel)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--muted)";
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleUpdateService}
              disabled={!newServiceData.name.trim() || !newServiceData.price.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "none",
                background: !newServiceData.name.trim() || !newServiceData.price.trim() 
                  ? "var(--muted)" 
                  : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: !newServiceData.name.trim() || !newServiceData.price.trim() 
                  ? "var(--muted-foreground)" 
                  : "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: !newServiceData.name.trim() || !newServiceData.price.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: !newServiceData.name.trim() || !newServiceData.price.trim() 
                  ? "none" 
                  : "0 4px 12px rgba(99, 102, 241, 0.25)",
              }}
              onMouseEnter={(e) => {
                if (newServiceData.name.trim() && newServiceData.price.trim()) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (newServiceData.name.trim() && newServiceData.price.trim()) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.25)";
                }
              }}
            >
              Сохранить изменения
            </button>
          </div>
        </div>
      </Modal>
          
      <Modal open={isDeleteModalOpen} onClose={closeDeleteModal} title="Удаление услуги">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            Вы уверены, что хотите удалить услугу <strong>{deletingService?.name}</strong>? Это действие нельзя отменить.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button 
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ 
                background: "var(--muted)", 
                border: "1px solid var(--card-border)", 
                color: "var(--foreground)" 
              }}
              onClick={closeDeleteModal}
            >
              Отмена
            </button>
            <button
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ 
                background: "#EF4444", 
                color: "#fff",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
              }}
              onClick={handleDeleteService}
            >
              Удалить
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно редактирования категории */}
      <Modal
        open={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setCategoryForm({ name: "", description: "", accent: "#6366F1" });
        }}
        title={editingCategory ? "Редактировать категорию" : "Добавить категорию"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Название категории</span>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Например: Коворкинг"
                required
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
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Описание</span>
              <textarea
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Краткое описание категории"
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
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
            <button
              type="button"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
                setCategoryForm({ name: "", description: "", accent: "#6366F1" });
              }}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--panel)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--muted)";
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
              {editingCategory ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения удаления категории */}
      <Modal
        open={isCategoryDeleteModalOpen}
        onClose={() => {
          setIsCategoryDeleteModalOpen(false);
          setDeletingCategory(null);
        }}
        title="Удалить категорию?"
      >
        <div style={{ padding: "1.5rem" }}>
          <p style={{ marginBottom: "1.5rem", color: "var(--foreground)" }}>
            Вы уверены, что хотите удалить категорию <strong>"{deletingCategory?.name}"</strong>?
            {deletingCategory && serviceCategories.find(c => c.id === deletingCategory.id)?.services.length ? (
              <span style={{ display: "block", marginTop: "0.5rem", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                Внимание: в этой категории есть услуги. Они также будут удалены.
              </span>
            ) : null}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="body-services__action-btn"
              onClick={() => {
                setIsCategoryDeleteModalOpen(false);
                setDeletingCategory(null);
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              className="body-services__action-btn body-services__action-btn--primary"
              onClick={handleDeleteCategory}
              style={{ background: "#EF4444", color: "#fff" }}
            >
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
