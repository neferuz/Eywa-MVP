"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Card from "@/components/Card";
import Link from "next/link";
import Modal from "@/components/Modal";
import { CalendarCheck, Search, User, Plus, Filter, Trash2, AlertTriangle, Phone } from "lucide-react";
import { fetchClientsFromApi, createClient, deleteClient } from "@/lib/api";
import { toast } from "@pheralb/toast";

type ClientDirection = "Body" | "Coworking" | "Coffee" | "Pilates Reformer";
type ClientStatus = "Активный" | "Новый" | "Ушедший";

type Subscription = { name: string; validTill: string };

type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  contractNumber?: string | null;
  subscriptionNumber?: string | null;
  birthDate?: string | null;
  instagram?: string | null;
  source?: string;
  direction: ClientDirection;
  status: ClientStatus;
  subscriptions: Subscription[];
  visits: string[];
  activationDate?: string | null;
  contraindications?: string | null;
  coachNotes?: string | null;
};

const directionLabels: Record<ClientDirection, string> = {
  Body: "Body&mind",
  Coworking: "Коворкинг",
  Coffee: "Детская",
  "Pilates Reformer": "Pilates Reformer",
};

const statusTone: Record<ClientStatus, string> = {
  Новый: "rgba(59, 130, 246, 0.85)",
  Активный: "rgba(22, 163, 74, 0.85)",
  Ушедший: "rgba(220, 38, 38, 0.85)",
};

export default function BodyClientsPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [directionFilter, setDirectionFilter] = useState<ClientDirection | null>(null);
  const [statusFilter, setStatusFilter] = useState<ClientStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  
  // Получаем direction из URL параметров
  const urlDirection = searchParams.get("direction") as ClientDirection | null;
  const shouldOpenAddModal = searchParams.get("addClient") === "true";
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientContract, setNewClientContract] = useState("");
  const [newClientSubscriptionNumber, setNewClientSubscriptionNumber] = useState("");
  const [newClientBirthDate, setNewClientBirthDate] = useState("");
  const [newClientDirection, setNewClientDirection] = useState<ClientDirection>(urlDirection || "Body");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Открываем модальное окно, если в URL есть параметр addClient
  useEffect(() => {
    if (shouldOpenAddModal) {
      setIsAddClientOpen(true);
      // Устанавливаем direction из URL, если есть
      if (urlDirection) {
        setNewClientDirection(urlDirection);
      }
      // Убираем параметр из URL
      const url = new URL(window.location.href);
      url.searchParams.delete("addClient");
      url.searchParams.delete("direction");
      window.history.replaceState({}, "", url.toString());
    }
  }, [shouldOpenAddModal, urlDirection]);
  
  useEffect(() => {
    const checkSidebarState = () => {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') : null;
      setSidebarCollapsed(saved === '1');
    };

    checkSidebarState();
    
    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      checkSidebarState();
    };

    // Проверяем состояние каждые 100ms для синхронизации
    const interval = setInterval(checkSidebarState, 100);
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClientsFromApi<ClientProfile>(
          {
            query: search || null,
            direction: directionFilter,
            status: statusFilter,
          },
          { cache: "no-store" },
        );
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, "ru"));
        setClients(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить клиентов");
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(load, 200);
    return () => clearTimeout(debounce);
  }, [search, directionFilter, statusFilter]);

  const firstSubscription = (client: ClientProfile) => client.subscriptions?.[0];
  const lastVisit = (client: ClientProfile) =>
    client.visits && client.visits.length
      ? new Date(client.visits[client.visits.length - 1]).toLocaleDateString("ru-RU")
      : "—";

  const filteredClients = useMemo(() => {
    return clients;
  }, [clients]);

  const handleAddClient = async () => {
    if (!newClientName.trim() || !newClientPhone.trim()) {
      toast.warning({
        text: "Заполните имя и телефон клиента",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      // Определяем direction: из URL параметра или из состояния формы
      const clientDirection: ClientDirection = urlDirection || newClientDirection || "Body";
      
      const payload = {
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        direction: clientDirection,
        status: "Новый",
        contractNumber: newClientContract.trim() || null,
        subscriptionNumber: newClientSubscriptionNumber.trim() || null,
        birthDate: newClientBirthDate?.trim() || null,
        source: "Instagram",
      };
      
      console.log("Creating client with payload:", payload);
      
      const created = await createClient<ClientProfile>(payload);
      
      console.log("Client created response:", created);
      console.log("Client created fields:", {
        id: created.id,
        contractNumber: created.contractNumber,
        subscriptionNumber: created.subscriptionNumber,
        birthDate: created.birthDate,
      });

      // Перезагружаем список клиентов
      const data = await fetchClientsFromApi<ClientProfile>(
        {
          query: search || null,
          direction: directionFilter,
          status: statusFilter,
        },
        { cache: "no-store" },
      );
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, "ru"));
      setClients(sorted);

      // Показываем уведомление об успехе
      toast.success({
        text: `Клиент "${newClientName.trim()}" успешно создан!`,
      });

      setIsAddClientOpen(false);
      setNewClientName("");
      setNewClientPhone("");
      setNewClientContract("");
      setNewClientSubscriptionNumber("");
      setNewClientBirthDate("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Не удалось создать клиента";
      setError(errorMessage);
      toast.error({
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setClientToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteClient(clientToDelete.id);
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setDeleteConfirmOpen(false);
      setClientToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить клиента");
    } finally {
      setIsDeleting(false);
    }
  };

  // Статистика
  const stats = useMemo(() => {
    const total = filteredClients.length;
    const active = filteredClients.filter((c) => c.status === "Активный").length;
    const newClients = filteredClients.filter((c) => c.status === "Новый").length;
    const left = filteredClients.filter((c) => c.status === "Ушедший").length;
    
    return {
      total,
      active,
      newClients,
      left,
    };
  }, [filteredClients]);

  return (
    <div className="body-clients" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Всего клиентов
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.total}</p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Активные
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.active}</p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Новые
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.newClients}</p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Ушедшие
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.left}</p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card style={{ padding: "1.25rem" }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="Поиск по имени, телефону, абонементу"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem 0.625rem 2.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  outline: "none",
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
            </div>
            <button
              type="button"
              onClick={() => setIsAddClientOpen(true)}
              style={{
                padding: "0.625rem 1rem",
                borderRadius: "8px",
                border: "1px solid transparent",
                background: "var(--foreground)",
                color: "var(--background)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <Plus className="h-4 w-4" />
              Добавить клиента
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                <Filter className="h-4 w-4" /> Направления
              </span>
              <div className="flex gap-2 flex-wrap">
                {(["Body", "Coworking", "Coffee", "Pilates Reformer"] as ClientDirection[]).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setDirectionFilter(directionFilter === dir ? null : dir)}
                    style={{
                      padding: "0.5rem 0.875rem",
                      borderRadius: "999px",
                      border: `1px solid ${directionFilter === dir ? "transparent" : "var(--card-border)"}`,
                      background: directionFilter === dir ? "var(--foreground)" : "transparent",
                      color: directionFilter === dir ? "var(--background)" : "var(--foreground)",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (directionFilter !== dir) {
                        e.currentTarget.style.borderColor = "var(--foreground)";
                        e.currentTarget.style.opacity = "0.7";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (directionFilter !== dir) {
                        e.currentTarget.style.borderColor = "var(--card-border)";
                        e.currentTarget.style.opacity = "1";
                      }
                    }}
                  >
                    {directionLabels[dir]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                Статус
              </span>
              <div className="flex gap-2 flex-wrap">
                {(["Активный", "Новый", "Ушедший"] as ClientStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === st ? null : st)}
                    style={{
                      padding: "0.5rem 0.875rem",
                      borderRadius: "999px",
                      border: `1px solid ${statusFilter === st ? "transparent" : "var(--card-border)"}`,
                      background: statusFilter === st ? "var(--foreground)" : "transparent",
                      color: statusFilter === st ? "var(--background)" : "var(--foreground)",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (statusFilter !== st) {
                        e.currentTarget.style.borderColor = "var(--foreground)";
                        e.currentTarget.style.opacity = "0.7";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (statusFilter !== st) {
                        e.currentTarget.style.borderColor = "var(--card-border)";
                        e.currentTarget.style.opacity = "1";
                      }
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground pb-3">Загружаем клиентов...</div>
      )}

      {!loading && filteredClients.length === 0 && (search || directionFilter || statusFilter) && (
        <div className="body-services__empty">
          <Search className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска или фильтры.
          </p>
        </div>
      )}

      {!loading && filteredClients.length === 0 && !search && !directionFilter && !statusFilter && (
        <div className="body-services__empty">
          <User className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Клиенты не найдены
          </p>
        </div>
      )}

      {!loading && filteredClients.length > 0 && (
        <section className={`body-clients__grid ${sidebarCollapsed ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {filteredClients.map((client) => {
          const sub = firstSubscription(client);
          const statusColor = statusTone[client.status];
          return (
            <Card
              key={client.id}
              className="body-clients__card"
              style={{ cursor: "pointer" }}
            >
              <div className="body-clients__card-head">
                <div className="body-clients__avatar">
                  <User className="h-4 w-4" />
                </div>
                <div className="body-clients__card-meta">
                  <div className="body-clients__card-name">{client.name}</div>
                  <span className="body-clients__card-phone">{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  {client.status !== "Новый" && (
                    <div className="body-clients__engagement" style={{ color: statusColor }}>
                      {client.status}
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label="Удалить клиента"
                    className="rounded-full border border-[var(--card-border)] bg-[var(--muted)] p-1 text-[var(--muted-foreground)] hover:text-red-600 hover:border-red-200 transition"
                    onClick={(event) => handleDeleteClick(client.id, client.name, event)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="body-clients__card-stats">
                <div>
                  <span>
                    Последний визит{" "}
                  <strong>{lastVisit(client)}</strong>
                  </span>
                </div>
                <div>
                  <span>
                    Направление{" "}
                  <strong>{directionLabels[client.direction]}</strong>
                  </span>
                </div>
                <div>
                  <span>
                    Номер договора{" "}
                  <strong>{client.contractNumber || "—"}</strong>
                  </span>
                </div>
              </div>

              <div className="body-clients__card-subscription">
                <div>
                  <span>{sub ? sub.name : "Без абонемента"}</span>
                  <span>до {sub?.validTill ? new Date(sub.validTill).toLocaleDateString("ru-RU") : "—"}</span>
                </div>
                <div className="body-clients__next-visit">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Активация {client.activationDate ? new Date(client.activationDate).toLocaleDateString("ru-RU") : "с первого визита"}
                </div>
              </div>

              <div className="body-clients__card-footer">
                <Link href={`/body/clients/${client.id}`} className="inline-flex items-center gap-2 text-[var(--foreground)]">
                  <span>Перейти в профиль</span>
                </Link>
              </div>
            </Card>
          );
        })}
        </section>
      )}

      <Modal
        open={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        title="Добавить клиента"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Имя клиента *
                </label>
                <div style={{ position: "relative" }}>
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="Например, Анна Смирнова"
                value={newClientName}
                onChange={(event) => setNewClientName(event.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.875rem 0.625rem 2.5rem",
                      borderRadius: "8px",
                      border: "1px solid var(--card-border)",
                      background: "var(--background)",
                      fontSize: "0.875rem",
                      color: "var(--foreground)",
                      outline: "none",
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
              />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Телефон *
                </label>
                <div style={{ position: "relative" }}>
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="tel"
                placeholder="+998 90 000 00 00"
                value={newClientPhone}
                onChange={(event) => setNewClientPhone(event.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.875rem 0.625rem 2.5rem",
                      borderRadius: "8px",
                      border: "1px solid var(--card-border)",
                      background: "var(--background)",
                      fontSize: "0.875rem",
                      color: "var(--foreground)",
                      outline: "none",
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
              />
            </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Номер договора
                </label>
              <input
                type="text"
                placeholder="Например, D-2024-015"
                value={newClientContract}
                onChange={(event) => setNewClientContract(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                    outline: "none",
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
              />
            </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Номер абонемента
                </label>
              <input
                type="text"
                placeholder="Например, S-110045"
                value={newClientSubscriptionNumber}
                onChange={(event) => setNewClientSubscriptionNumber(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                    outline: "none",
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
              />
            </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Дата рождения
                </label>
              <input
                type="date"
                value={newClientBirthDate}
                onChange={(event) => setNewClientBirthDate(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                    outline: "none",
                    transition: "all 0.2s ease",
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
              />
            </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Направление
                </label>
              <select
                value={newClientDirection}
                onChange={(event) => setNewClientDirection(event.target.value as ClientDirection)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                    outline: "none",
                    transition: "all 0.2s ease",
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
                <option value="Coworking">Коворкинг</option>
                <option value="Pilates Reformer">Pilates Reformer</option>
                <option value="Coffee">Детская</option>
              </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--card-border)", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setIsAddClientOpen(false)}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
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
              Отмена
              </button>
            <button
              type="button"
              onClick={handleAddClient}
              disabled={loading || !newClientName.trim() || !newClientPhone.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid transparent",
                background: loading || !newClientName.trim() || !newClientPhone.trim()
                  ? "#9ca3af"
                  : "var(--foreground)",
                color: loading || !newClientName.trim() || !newClientPhone.trim()
                  ? "#ffffff"
                  : "var(--background)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: loading || !newClientName.trim() || !newClientPhone.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: loading || !newClientName.trim() || !newClientPhone.trim() ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && newClientName.trim() && newClientPhone.trim()) {
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && newClientName.trim() && newClientPhone.trim()) {
                  e.currentTarget.style.opacity = "1";
                }
              }}
            >
              {loading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmOpen(false);
            setClientToDelete(null);
          }
        }}
        title="Подтверждение удаления"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
              <AlertTriangle className="h-6 w-6" style={{ color: "#EF4444" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Вы уверены, что хотите удалить клиента?
              </p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Клиент <strong>{clientToDelete?.name}</strong> будет удален. Это действие нельзя отменить.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
              }}
              onClick={() => {
                setDeleteConfirmOpen(false);
                setClientToDelete(null);
              }}
              disabled={isDeleting}
            >
              Отмена
            </button>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{
                background: isDeleting
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                boxShadow: isDeleting ? "none" : "0 4px 12px rgba(239, 68, 68, 0.25)",
              }}
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
