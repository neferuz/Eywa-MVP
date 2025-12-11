"use client";

import { useMemo, useState, type ComponentType } from "react";
import Card from "@/components/Card";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Pencil,
  Archive,
  RotateCw,
  Clock,
  Activity,
  Layers,
  Repeat,
  Move,
  User,
  CircleDollarSign,
} from "lucide-react";

type ServiceStatus = "active" | "archived";

interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  status: ServiceStatus;
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  services: Service[];
}

const CATEGORIES: ServiceCategory[] = [
  {
    id: "yoga",
    name: "Yoga",
    icon: Activity,
    accent: "#3f7f73",
    services: [
      { id: "y1", name: "Йога базовая", duration: 60, price: 180000, status: "active" },
      { id: "y2", name: "Йога продвинутая", duration: 90, price: 230000, status: "active" },
      { id: "y3", name: "Йога новичков", duration: 60, price: 150000, status: "archived" },
    ],
  },
  {
    id: "pilates",
    name: "Pilates",
    icon: Layers,
    accent: "#6279c7",
    services: [
      { id: "p1", name: "Пилатес мат", duration: 60, price: 210000, status: "active" },
      { id: "p2", name: "Пилатес продв.", duration: 90, price: 260000, status: "active" },
    ],
  },
  {
    id: "reformer",
    name: "Reformer",
    icon: Repeat,
    accent: "#6d4dbf",
    services: [
      { id: "r1", name: "Reformer базовый", duration: 60, price: 250000, status: "active" },
      { id: "r2", name: "Reformer силовой", duration: 45, price: 240000, status: "active" },
      { id: "r3", name: "Reformer rehab", duration: 60, price: 260000, status: "active" },
      { id: "r4", name: "Reformer интенсив", duration: 90, price: 320000, status: "active" },
    ],
  },
  {
    id: "stretching",
    name: "Stretching",
    icon: Move,
    accent: "#d97706",
    services: [
      { id: "s1", name: "Растяжка", duration: 45, price: 160000, status: "active" },
    ],
  },
  {
    id: "personal",
    name: "Персональные тренировки",
    icon: User,
    accent: "#0f6df2",
    services: [
      { id: "pt1", name: "Персональная Body&Mind", duration: 60, price: 320000, status: "active" },
      { id: "pt2", name: "Персональная Reformer", duration: 60, price: 360000, status: "active" },
    ],
  },
];

export default function BodyServicesPage() {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["yoga"]));

  const allServices = useMemo(() => {
    return CATEGORIES.flatMap((cat) => cat.services);
  }, []);

  const totalServices = allServices.length;
  const activeServices = allServices.filter((s) => s.status === "active").length;

  const filteredCategories = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = CATEGORIES.map((cat) => {
      const services = cat.services.filter((s) => {
        const matchesSearch = !term || s.name.toLowerCase().includes(term);
        const matchesDirection = directionFilter === "all" || cat.id === directionFilter;
        return matchesSearch && matchesDirection;
      });
      return { ...cat, services };
    }).filter((cat) => cat.services.length > 0);
    return filtered;
  }, [search, directionFilter]);

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

  const toggleServiceStatus = (categoryId: string, serviceId: string) => {
    // This would update the service status in a real app
    console.log("Toggle service status", categoryId, serviceId);
  };

  const uniqueDirections = useMemo(() => {
    return CATEGORIES.map((cat) => ({ id: cat.id, name: cat.name }));
  }, []);

  return (
    <div className="body-services">
      <div className="body-services__header">
        <div>
          <h1>EYWA BODY · Услуги</h1>
        </div>
        <button className="body-services__add-btn" onClick={() => console.log("Add service")}>
          <Plus className="h-4 w-4" />
          Добавить услугу
        </button>
      </div>

      <div className="body-services__stats">
        <div className="body-services__stat-chip">
          <span>Всего услуг</span>
          <strong>{totalServices}</strong>
        </div>
        <div className="body-services__stat-chip">
          <span>Активных</span>
          <strong>{activeServices}</strong>
        </div>
      </div>

      <Card>
        <div className="body-services__filters">
          <div className="body-services__search">
            <Search className="body-services__search-icon" />
            <input
              type="text"
              placeholder="Поиск по названию"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="body-services__filter-group">
            <span className="body-services__filter-label">Направление:</span>
            <select
              className="body-services__select"
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
            >
              <option value="all">Все</option>
              {uniqueDirections.map((dir) => (
                <option key={dir.id} value={dir.id}>{dir.name}</option>
              ))}
            </select>
          </div>
          <button className="body-services__advanced-btn">
            <Filter className="h-4 w-4" />
            Расширенные фильтры
          </button>
        </div>
      </Card>

      <div className="body-services__categories">
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const activeCount = category.services.filter((s) => s.status === "active").length;
          const Icon = category.icon;
          return (
            <Card key={category.id} className="body-services__category">
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
                      <span>{activeCount} активных</span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {isExpanded && (
                <div className="body-services__category-content">
                  <div className="body-services__table-wrapper">
                    <table className="body-services__table">
                      <thead>
                        <tr>
                          <th>Название</th>
                          <th>Длительность</th>
                          <th>Стоимость</th>
                          <th>Статус</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.services.map((service) => (
                          <tr key={service.id}>
                            <td className="body-services__service-name">{service.name}</td>
                            <td>
                              <div className="body-services__duration">
                                <Clock className="h-3.5 w-3.5" />
                                {service.duration} мин
                              </div>
                            </td>
                            <td>
                              <div className="body-services__price">
                                <CircleDollarSign className="h-3.5 w-3.5" />
                                {service.price.toLocaleString("ru-RU")} сум
                              </div>
                            </td>
                            <td>
                              <span className={`body-services__status body-services__status--${service.status}`}>
                                <span className="body-services__status-dot" />
                                {service.status === "active" ? "Активна" : "Архив"}
                              </span>
                            </td>
                            <td>
                              <div className="body-services__actions">
                                <button
                                  className="body-services__action-btn"
                                  onClick={() => console.log("Edit", service.id)}
                                  title="Редактировать"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Ред.
                                </button>
                                {service.status === "active" ? (
                                  <button
                                    className="body-services__action-btn"
                                    onClick={() => toggleServiceStatus(category.id, service.id)}
                                    title="Архивировать"
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                    Архив
                                  </button>
                                ) : (
                                  <button
                                    className="body-services__action-btn body-services__action-btn--activate"
                                    onClick={() => toggleServiceStatus(category.id, service.id)}
                                    title="Активировать"
                                  >
                                    <RotateCw className="h-3.5 w-3.5" />
                                    Активировать
                                  </button>
                                )}
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
        })}
      </div>
    </div>
  );
}
