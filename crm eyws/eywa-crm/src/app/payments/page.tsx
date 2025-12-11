"use client";

import { useMemo, useState, useEffect } from "react";
import type { ComponentType, CSSProperties } from "react";
import Card from "@/components/Card";
import { CLIENTS } from "@/data/clients";
import {
  Building2,
  Dumbbell,
  Sparkles,
  Laptop,
  MoreHorizontal,
  CreditCard,
  Search,
  X,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  NotebookPen,
  Plus,
  Minus,
  UserPlus,
  User,
  Phone,
} from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("ru-RU");

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  billing: "perHour" | "perService" | "custom";
  hint?: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  accent: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  services: ServiceItem[];
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "coworking",
    name: "Коворкинг",
    description: "Гибкие капсулы и рабочие места для команд и индивидуальной работы",
    accent: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.25))",
    icon: Building2,
    services: [
      {
        id: "coworking-one",
        name: "Капсула 1 чел",
        price: 50000,
        priceLabel: "50 000 сум / час",
        billing: "perHour",
      },
      {
        id: "coworking-four",
        name: "Капсула 4 чел",
        price: 100000,
        priceLabel: "100 000 сум / час",
        billing: "perHour",
      },
      {
        id: "coworking-six",
        name: "Капсула 6 чел",
        price: 150000,
        priceLabel: "150 000 сум / час",
        billing: "perHour",
      },
    ],
  },
  {
    id: "event",
    name: "Event Zone",
    description: "Пространство для мероприятий и презентаций",
    accent: "linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(96, 165, 250, 0.3))",
    icon: Sparkles,
    services: [
      {
        id: "event-1h",
        name: "Event Zone — 1 час",
        price: 500000,
        priceLabel: "500 000 сум",
        billing: "perService",
      },
      {
        id: "event-2h",
        name: "Event Zone — 2 часа",
        price: 800000,
        priceLabel: "800 000 сум",
        billing: "perService",
      },
      {
        id: "event-4h",
        name: "Event Zone — 4 часа",
        price: 1000000,
        priceLabel: "1 000 000 сум",
        billing: "perService",
      },
    ],
  },
  {
    id: "body",
    name: "BODY",
    description: "Групповые занятия и абонементы для Body & Mind",
    accent: "linear-gradient(135deg, rgba(236, 72, 153, 0.18), rgba(244, 114, 182, 0.24))",
    icon: Dumbbell,
    services: [
      {
        id: "body-single",
        name: "Разовое занятие BODY",
        price: 200000,
        priceLabel: "200 000 сум",
        billing: "perService",
      },
      {
        id: "body-8",
        name: "Абонемент BODY — 8 занятий",
        price: 1350000,
        priceLabel: "1 350 000 сум",
        billing: "perService",
      },
      {
        id: "body-12",
        name: "Абонемент BODY — 12 занятий",
        price: 2000000,
        priceLabel: "2 000 000 сум",
        billing: "perService",
      },
    ],
  },
  {
    id: "reformer",
    name: "Reformers",
    description: "Продвинутые занятия на реформах",
    accent: "linear-gradient(135deg, rgba(249, 115, 22, 0.18), rgba(251, 191, 36, 0.24))",
    icon: Users,
    services: [
      {
        id: "ref-single",
        name: "Reformers — разовое",
        price: 250000,
        priceLabel: "250 000 сум",
        billing: "perService",
      },
      {
        id: "ref-8",
        name: "Reformers — абонемент 8",
        price: 1700000,
        priceLabel: "1 700 000 сум",
        billing: "perService",
      },
      {
        id: "ref-12",
        name: "Reformers — абонемент 12",
        price: 2500000,
        priceLabel: "2 500 000 сум",
        billing: "perService",
      },
    ],
  },
  {
    id: "personal",
    name: "Персональные тренировки",
    description: "Индивидуальная работа с тренером",
    accent: "linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(129, 140, 248, 0.28))",
    icon: Clock,
    services: [
      {
        id: "personal-body",
        name: "Персональная тренировка Body & Mind",
        price: 300000,
        priceLabel: "300 000 сум",
        billing: "perService",
      },
      {
        id: "personal-reformer",
        name: "Персональная тренировка Reformer",
        price: 400000,
        priceLabel: "400 000 сум",
        billing: "perService",
      },
    ],
  },
  {
    id: "equipment",
    name: "Аренда оборудования",
    description: "Дополнительные услуги для мероприятий и работы",
    accent: "linear-gradient(135deg, rgba(45, 212, 191, 0.18), rgba(14, 165, 233, 0.24))",
    icon: Laptop,
    services: [
      {
        id: "rent-laptop",
        name: "Аренда ноутбука",
        price: 50000,
        priceLabel: "50 000 сум / час",
        billing: "perHour",
      },
      {
        id: "rent-mic",
        name: "Аренда микрофона-петлички",
        price: 50000,
        priceLabel: "50 000 сум / час",
        billing: "perHour",
      },
    ],
  },
  {
    id: "custom",
    name: "Другое",
    description: "Добавьте услугу вручную и укажите стоимость",
    accent: "linear-gradient(135deg, rgba(148, 163, 184, 0.22), rgba(226, 232, 240, 0.3))",
    icon: MoreHorizontal,
    services: [
      {
        id: "custom-entry",
        name: "Ручной ввод",
        price: 0,
        priceLabel: "Своя стоимость",
        billing: "custom",
        hint: "Подходит для разовых услуг и спец-предложений",
      },
    ],
  },
];

const PAYMENT_METHODS = [
  { id: "card", label: "Карта" },
  { id: "cash", label: "Наличные" },
  { id: "transfer", label: "Перевод" },
];

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<(ServiceItem & { category: ServiceCategory }) | null>(null);
  const [drawerState, setDrawerState] = useState<"closed" | "open" | "closing">("closed");
  const [quantity, setQuantity] = useState(1);
  const [hours, setHours] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [comment, setComment] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<typeof CLIENTS>([]);
  const [showClientSearch, setShowClientSearch] = useState(false);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return SERVICE_CATEGORIES;
    const result: ServiceCategory[] = [];
    for (const category of SERVICE_CATEGORIES) {
      const services = category.services.filter((service) =>
        service.name.toLowerCase().includes(term)
      );
      if (services.length) {
        result.push({ ...category, services });
      }
    }
    return result;
  }, [search]);

  const handleSelectService = (service: ServiceItem, category: ServiceCategory) => {
    setSelectedService({ ...service, category });
    setQuantity(1);
    setHours(1);
    setManualPrice("");
    setPaymentMethod("card");
    setComment("");
    setClientSearch("");
    setSelectedClientId("");
    setClientName("");
    setClientPhone("");
    setClientSearchResults([]);
    setShowClientSearch(false);
    setDrawerState("open");
  };

  useEffect(() => {
    if (clientSearch.trim().length > 0) {
      const term = clientSearch.toLowerCase();
      const results = CLIENTS.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          client.phone.toLowerCase().includes(term) ||
          (client.instagram && client.instagram.toLowerCase().includes(term))
      );
      setClientSearchResults(results);
      setShowClientSearch(results.length > 0);
    } else {
      setClientSearchResults([]);
      setShowClientSearch(false);
    }
  }, [clientSearch]);

  const handleSelectClient = (client: typeof CLIENTS[0]) => {
    setSelectedClientId(client.id);
    setClientName(client.name);
    setClientPhone(client.phone);
    setClientSearch(client.name);
    setShowClientSearch(false);
    setClientSearchResults([]);
  };

  const handleAddNewClient = () => {
    setSelectedClientId("");
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

  const effectiveQuantity = selectedService
    ? selectedService.billing === "perHour"
      ? hours
      : selectedService.billing === "custom"
        ? 1
        : quantity
    : 0;

  const total = selectedService
    ? selectedService.billing === "custom"
      ? Number(manualPrice.replace(/\s/g, "")) || 0
      : selectedService.price * effectiveQuantity
    : 0;

  const formattedTotal = currencyFormatter.format(total);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-medium" style={{ background: "var(--panel)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}>
              <CreditCard className="h-3.5 w-3.5" />
              Оплата и услуги
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Быстрая продажа услуг</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Выберите категорию, сформируйте чек и закрепите оплату за клиентом.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по услуге"
                className="rounded-2xl pl-10 pr-4 py-2 text-sm outline-none transition-all"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--card-border)",
                  color: "var(--foreground)",
                  boxShadow: "0 8px 20px -12px rgba(15, 23, 42, 0.25)",
                }}
              />
            </div>
          </div>
        </div>
      </header>

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
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "rgba(23,23,23,0.5)" }}>
                  Категория
                </span>
                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{category.name}</h2>
                <p className="text-sm leading-snug" style={{ color: "var(--muted-foreground)" }}>{category.description}</p>
              </div>
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{ background: category.accent, border: "1px solid rgba(15,23,42,0.08)" }}
              >
                <category.icon className="h-5 w-5" style={{ color: "rgba(23,23,23,0.65)" }} />
              </div>
            </div>

            <div className="space-y-2">
              {category.services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleSelectService(service, category)}
                  className="group w-full rounded-2xl px-4 py-3 flex items-center justify-between gap-4 text-left transition-all"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--card-border)",
                    color: "var(--foreground)",
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{service.name}</span>
                    <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{service.priceLabel}</span>
                    {service.hint && (
                      <span className="text-xs" style={{ color: "rgba(15, 118, 110, 0.8)" }}>{service.hint}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                    <span>Выбрать</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
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

      {visibleDrawer && selectedService && (
        <>
          <div
            className={`calendar-drawer-overlay ${drawerState === "closing" ? "is-closing" : ""}`}
            onClick={closeDrawer}
          />
          <aside className={`calendar-drawer ${drawerState === "closing" ? "is-closing" : ""}`}>
            <div className="calendar-drawer__header">
              <div>
                <p className="calendar-drawer__subtitle">{selectedService.category.name}</p>
                <h3 className="calendar-drawer__title">{selectedService.name}</h3>
              </div>
              <button className="calendar-drawer__close" onClick={closeDrawer} aria-label="Закрыть">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="calendar-drawer__content space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="calendar-drawer__badge">
                  <Clock className="calendar-drawer__badge-icon" />
                  <div>
                    <div className="calendar-drawer__badge-label">Тариф</div>
                    <div className="calendar-drawer__badge-value">{selectedService.priceLabel}</div>
                  </div>
                </div>
                <div className="calendar-drawer__badge">
                  <CreditCard className="calendar-drawer__badge-icon" />
                  <div>
                    <div className="calendar-drawer__badge-label">Итого к оплате</div>
                    <div className="calendar-drawer__badge-value">{formattedTotal} сум</div>
                  </div>
                </div>
              </div>

              <form className="calendar-drawer__form" onSubmit={(event) => event.preventDefault()}>
                <div className="calendar-drawer__form-group">
                  <label className="calendar-drawer__form-label">Клиент</label>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                        <input
                          className="calendar-drawer__form-input pl-10"
                          type="text"
                          value={clientSearch}
                          onChange={(event) => {
                            setClientSearch(event.target.value);
                            if (event.target.value.trim().length === 0) {
                              setSelectedClientId("");
                              setClientName("");
                              setClientPhone("");
                            }
                          }}
                          onFocus={() => {
                            if (clientSearch.trim().length > 0 && clientSearchResults.length > 0) {
                              setShowClientSearch(true);
                            }
                          }}
                          placeholder="Поиск клиента или введите имя"
                        />
                      </div>
                      {!selectedClientId && (
                        <button
                          type="button"
                          className="calendar-drawer__form-btn-icon"
                          onClick={handleAddNewClient}
                          title="Добавить нового клиента"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {showClientSearch && clientSearchResults.length > 0 && (
                      <div className="calendar-drawer__client-search-results">
                        {clientSearchResults.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className="calendar-drawer__client-search-item"
                            onClick={() => handleSelectClient(client)}
                          >
                            <User className="h-4 w-4" />
                            <div className="flex-1 text-left">
                              <div className="calendar-drawer__client-search-name">{client.name}</div>
                              <div className="calendar-drawer__client-search-phone">{client.phone}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedClientId ? (
                  <div className="calendar-drawer__form-group">
                    <div className="calendar-drawer__badge">
                      <User className="calendar-drawer__badge-icon" />
                      <div>
                        <div className="calendar-drawer__badge-label">Выбранный клиент</div>
                        <div className="calendar-drawer__badge-value">{clientName}</div>
                        <div className="calendar-drawer__badge-value text-xs" style={{ color: "var(--muted-foreground)" }}>{clientPhone}</div>
                      </div>
                      <button
                        type="button"
                        className="calendar-drawer__form-btn-icon"
                        onClick={() => {
                          setSelectedClientId("");
                          setClientName("");
                          setClientPhone("");
                          setClientSearch("");
                        }}
                        title="Очистить выбор"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="calendar-drawer__form-group">
                      <label className="calendar-drawer__form-label">Имя клиента</label>
                      <input
                        className="calendar-drawer__form-input"
                        type="text"
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        placeholder="Введите имя клиента"
                        required
                      />
                    </div>
                    <div className="calendar-drawer__form-group">
                      <label className="calendar-drawer__form-label">Телефон</label>
                      <input
                        className="calendar-drawer__form-input"
                        type="tel"
                        value={clientPhone}
                        onChange={(event) => setClientPhone(event.target.value)}
                        placeholder="+998 90 123 45 67"
                        required
                      />
                    </div>
                  </>
                )}

                {selectedService.billing === "custom" ? (
                  <div className="calendar-drawer__form-group">
                    <label className="calendar-drawer__form-label">Стоимость услуги</label>
                    <input
                      className="calendar-drawer__form-input"
                      type="number"
                      min={0}
                      step={10000}
                      value={manualPrice}
                      onChange={(event) => setManualPrice(event.target.value)}
                      placeholder="Введите сумму"
                      required
                    />
                  </div>
                ) : selectedService.billing === "perHour" ? (
                  <div className="calendar-drawer__form-group">
                    <label className="calendar-drawer__form-label">Количество часов</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="calendar-event__overview-control"
                        onClick={() => setHours((value) => Math.max(1, value - 1))}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-16 text-center text-sm font-semibold" style={{ color: "var(--foreground)" }}>{hours}</div>
                      <button
                        type="button"
                        className="calendar-event__overview-control"
                        onClick={() => setHours((value) => Math.min(12, value + 1))}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="calendar-drawer__form-group">
                    <label className="calendar-drawer__form-label">Количество</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="calendar-event__overview-control"
                        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-16 text-center text-sm font-semibold" style={{ color: "var(--foreground)" }}>{quantity}</div>
                      <button
                        type="button"
                        className="calendar-event__overview-control"
                        onClick={() => setQuantity((value) => Math.min(50, value + 1))}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="calendar-drawer__form-group">
                  <label className="calendar-drawer__form-label">Метод оплаты</label>
                  <div className="calendar-drawer__form-radio-group">
                    {PAYMENT_METHODS.map((method) => (
                      <label key={method.id} className="calendar-drawer__form-radio">
                        <input
                          type="radio"
                          name="payment-method"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                        />
                        <span>{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="calendar-drawer__form-group">
                  <label className="calendar-drawer__form-label">Комментарий</label>
                  <textarea
                    className="calendar-drawer__form-textarea"
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Например: оплатил наличными, нужен чек"
                  />
                </div>

                <div className="calendar-drawer__form-actions">
                  <button type="button" className="calendar-drawer__form-btn calendar-drawer__form-btn--cancel" onClick={closeDrawer}>
                    Отменить
                  </button>
                  <button
                    type="submit"
                    className="calendar-drawer__form-btn calendar-drawer__form-btn--submit"
                    onClick={() => {
                      // Здесь можно интегрировать логику оплаты или создания транзакции.
                      closeDrawer();
                    }}
                    disabled={selectedService.billing === "custom" && !manualPrice}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Добавить в чек — {formattedTotal} сум
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
