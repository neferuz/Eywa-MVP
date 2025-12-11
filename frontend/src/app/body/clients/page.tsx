"use client";

import { useMemo, useState, useEffect } from "react";
import Card from "@/components/Card";
import Link from "next/link";
import Modal from "@/components/Modal";
import { CalendarCheck, Search, User, Plus, Filter, Trash2, AlertTriangle } from "lucide-react";
import { fetchClientsFromApi, createClient, deleteClient } from "@/lib/api";
import { toast } from "@pheralb/toast";

type ClientDirection = "Body" | "Coworking" | "Coffee";
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
  Coworking: "Coworking (резиденты)",
  Coffee: "Детская",
};

const statusTone: Record<ClientStatus, string> = {
  Новый: "rgba(59, 130, 246, 0.85)",
  Активный: "rgba(22, 163, 74, 0.85)",
  Ушедший: "rgba(220, 38, 38, 0.85)",
};

export default function BodyClientsPage() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [directionFilter, setDirectionFilter] = useState<ClientDirection | null>(null);
  const [statusFilter, setStatusFilter] = useState<ClientStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientContract, setNewClientContract] = useState("");
  const [newClientSubscriptionNumber, setNewClientSubscriptionNumber] = useState("");
  const [newClientBirthDate, setNewClientBirthDate] = useState("");
  const [newClientSubscriptionValidTill, setNewClientSubscriptionValidTill] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const created = await createClient<ClientProfile>({
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        direction: "Body",
        status: "Новый",
        contractNumber: newClientContract.trim() || null,
        subscriptionNumber: newClientSubscriptionNumber.trim() || null,
        birthDate: newClientBirthDate || null,
        source: "Instagram",
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
      setNewClientSubscriptionValidTill("");
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

  return (
    <div className="body-clients">
      <div className="rounded-2xl bg-[var(--panel)] p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="body-clients__search">
              <Search className="body-clients__search-icon" />
              <input
                type="text"
                placeholder="Поиск по имени, телефону, абонементу"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="payments-add-btn"
              onClick={() => setIsAddClientOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Добавить клиента
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <Filter className="h-4 w-4" /> Направления
              </span>
              <div className="flex gap-2 flex-wrap">
                {(["Body", "Coworking", "Coffee"] as ClientDirection[]).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition ${
                      directionFilter === dir
                        ? "bg-[var(--foreground)] text-white border-transparent shadow-sm"
                        : "bg-transparent text-[var(--foreground)] border-[var(--card-border)] hover:border-[var(--foreground)]/50"
                    }`}
                    onClick={() => setDirectionFilter(directionFilter === dir ? null : dir)}
                  >
                    {directionLabels[dir]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Статус
              </span>
              <div className="flex gap-2 flex-wrap">
                {(["Активный", "Новый", "Ушедший"] as ClientStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition ${
                      statusFilter === st
                        ? "bg-[var(--foreground)] text-white border-transparent shadow-sm"
                        : "bg-transparent text-[var(--foreground)] border-[var(--card-border)] hover:border-[var(--foreground)]/50"
                    }`}
                    onClick={() => setStatusFilter(statusFilter === st ? null : st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                  <div className="body-clients__engagement" style={{ color: statusColor }}>
                    {client.status}
                  </div>
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
        <div className="body-clients__add-modal">
          <div className="body-clients__add-modal-grid">
            <div className="body-clients__add-field">
              <label>Имя клиента</label>
              <input
                type="text"
                placeholder="Например, Анна Смирнова"
                value={newClientName}
                onChange={(event) => setNewClientName(event.target.value)}
              />
              </div>
            <div className="body-clients__add-field">
              <label>Телефон</label>
              <input
                type="tel"
                placeholder="+998 90 000 00 00"
                value={newClientPhone}
                onChange={(event) => setNewClientPhone(event.target.value)}
              />
            </div>
            <div className="body-clients__add-field">
              <label>Номер договора</label>
              <input
                type="text"
                placeholder="Например, D-2024-015"
                value={newClientContract}
                onChange={(event) => setNewClientContract(event.target.value)}
              />
            </div>
            <div className="body-clients__add-field">
              <label>Номер абонемента</label>
              <input
                type="text"
                placeholder="Например, S-110045"
                value={newClientSubscriptionNumber}
                onChange={(event) => setNewClientSubscriptionNumber(event.target.value)}
              />
            </div>
            <div className="body-clients__add-field">
              <label>Дата рождения</label>
              <input
                type="date"
                value={newClientBirthDate}
                onChange={(event) => setNewClientBirthDate(event.target.value)}
              />
            </div>
            <div className="body-clients__add-field">
              <label>Срок абонемента (дата окончания)</label>
              <input
                type="date"
                value={newClientSubscriptionValidTill}
                onChange={(event) => setNewClientSubscriptionValidTill(event.target.value)}
              />
              <p className="body-clients__add-hint">
                Активация абонемента начинается с первого визита.
              </p>
            </div>
          </div>

          <div className="body-clients__add-actions">
            <button
              type="button"
              className="btn-outline body-clients__add-actions-secondary"
              onClick={() => setIsAddClientOpen(false)}
            >
              Отмена
              </button>
            <button
              type="button"
              className="btn-outline body-clients__add-actions-primary"
              onClick={handleAddClient}
            >
              Сохранить
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
