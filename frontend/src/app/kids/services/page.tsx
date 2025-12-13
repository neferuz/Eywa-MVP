"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Clock,
  CircleDollarSign,
  Loader2,
  FileText,
} from "lucide-react";
import {
  KidsService,
  KidsServiceCreate,
  createKidsService,
  deleteKidsService,
  fetchKidsServices,
  updateKidsService,
} from "@/lib/api";

export default function KidsServicesPage() {
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<KidsService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KidsServiceCreate & { priceDisplay: string }>({
    name: "",
    category: "",
    direction: "Kids",
    duration_minutes: "",
    price: 0,
    priceDisplay: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKidsServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number | string): string => {
    if (!value && value !== 0) return "";
    const numStr = String(value).replace(/\s/g, "");
    if (!numStr) return "";
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("ru-RU").replace(/,/g, " ");
  };

  const parsePrice = (value: string): number => {
    const cleaned = value.replace(/\s/g, "");
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      direction: "Kids",
      duration_minutes: "",
      price: 0,
      priceDisplay: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service: KidsService) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      category: service.category,
      direction: "Kids",
      duration_minutes: String(service.duration_minutes || ""),
      price: service.price,
      priceDisplay: formatPrice(service.price),
      description: service.description ?? "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteKidsService(deleteConfirm.id);
      setServices((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить услугу");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Заполните название");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const payload: KidsServiceCreate = {
      name: form.name.trim(),
      category: form.category.trim() || "Общее",
      direction: "Kids",
      duration_minutes: String(form.duration_minutes || ""),
      price: parsePrice(form.priceDisplay) || 0,
      description: form.description?.trim() || null,
    };

    try {
      if (editingId) {
        const updated = await updateKidsService(editingId, payload);
        setServices((prev) => prev.map((svc) => (svc.id === editingId ? updated : svc)));
      } else {
        const created = await createKidsService(payload);
        setServices((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setForm({
        name: "",
        category: "",
        direction: "Kids",
        duration_minutes: "",
        price: 0,
        priceDisplay: "",
        description: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить услугу");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      !search ||
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="body-services">
      <div className="body-services__header">
        <div className="body-services__header-left">
          <div className="body-services__chips">
            <div className="body-services__stat-chip">
              <span>Всего услуг</span>
              <strong>{services.length}</strong>
            </div>
          </div>
        </div>
        <div className="body-services__header-right">
          <button type="button" className="payments-add-btn" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Добавить услугу
          </button>
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
        </div>
      </Card>

      {error && (
        <Card className="p-4 border border-red-300/40 bg-red-500/5 text-sm" style={{ color: "var(--foreground)" }}>
          <div className="font-semibold text-red-600 dark:text-red-400">Ошибка</div>
          <div className="text-red-600/80 dark:text-red-400/90">{error}</div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка услуг...
        </div>
      ) : filteredServices.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
          <p style={{ color: "var(--muted-foreground)" }}>
            {search ? "Услуги не найдены" : "Пока нет услуг. Добавьте первую услугу."}
          </p>
        </Card>
      ) : (
        <div className="body-services__table-wrapper">
          <table className="body-services__table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Длительность</th>
                <th>Стоимость</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td className="body-services__service-name">{service.name}</td>
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
                        onClick={() => openEditModal(service)}
                        title="Редактировать"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="body-services__action-btn body-services__action-btn--danger"
                        onClick={() => handleDeleteClick(service.id, service.name)}
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
      )}

      <Modal
        open={deleteConfirm !== null}
        onClose={() => !deleting && setDeleteConfirm(null)}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            Вы уверены, что хотите удалить услугу <strong>«{deleteConfirm?.name}»</strong>?
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Это действие нельзя отменить.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              className="btn-outline px-4 py-2 text-sm"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Отмена
            </button>
            <button
              className="px-4 py-2 text-sm rounded-lg text-white transition-colors"
              style={{
                background: deleting ? "#9ca3af" : "#ef4444",
              }}
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsModalOpen(false);
            setEditingId(null);
            setForm({
              name: "",
              category: "",
              direction: "Kids",
              duration_minutes: "",
              price: 0,
              priceDisplay: "",
              description: "",
            });
          }
        }}
        title={editingId ? "Редактировать услугу" : "Добавить услугу"}
      >
        <div className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Название *
              </label>
              <input
                className="h-11 w-full rounded-xl border px-4 text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
                placeholder="Введите название услуги"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Описание
              </label>
              <textarea
                className="w-full rounded-xl border px-4 py-3 text-sm resize-none transition-all focus:outline-none focus:ring-2"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                  minHeight: "100px",
                }}
                placeholder="Введите описание услуги"
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Длительность
              </label>
              <input
                type="text"
                className="h-11 w-full rounded-xl border px-4 text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
                placeholder="Например: 60 мин, 1 месяц, 30 дней"
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Стоимость (сум) *
              </label>
              <input
                type="text"
                className="h-11 w-full rounded-xl border px-4 text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
                placeholder="Например: 100 000"
                value={form.priceDisplay}
                onChange={(e) => {
                  const input = e.target.value.replace(/\s/g, "");
                  if (input === "" || /^\d+$/.test(input)) {
                    setForm((prev) => ({
                      ...prev,
                      priceDisplay: input === "" ? "" : formatPrice(input),
                      price: input === "" ? 0 : parsePrice(input),
                    }));
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value && !isNaN(parseInt(e.target.value.replace(/\s/g, ""), 10))) {
                    const num = parseInt(e.target.value.replace(/\s/g, ""), 10);
                    setForm((prev) => ({
                      ...prev,
                      priceDisplay: formatPrice(num),
                      price: num,
                    }));
                  }
                }}
              />
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
                if (!isSubmitting) {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setForm({
                    name: "",
                    category: "",
                    direction: "Kids",
                    duration_minutes: "",
                    price: 0,
                    priceDisplay: "",
                    description: "",
                  });
                }
              }}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{
                background: isSubmitting
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                boxShadow: isSubmitting ? "none" : "0 4px 12px rgba(99, 102, 241, 0.25)",
              }}
              onClick={handleSubmit}
              disabled={isSubmitting || !form.name.trim()}
            >
              {isSubmitting ? (editingId ? "Обновляю..." : "Сохраняю...") : editingId ? "Обновить" : "Сохранить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

