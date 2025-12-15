"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { CoworkingPlace, createCoworkingPlace, updateCoworkingPlace, deleteCoworkingPlace, fetchCoworkingPlaces } from "@/lib/api";
import { MapPin, Building2, Sparkles, LayoutGrid, Loader2, Plus, Trash2, Search, Pencil } from "lucide-react";

const typeLabel: Record<CoworkingPlace["type"], string> = {
  capsule: "Капсула",
  event: "Ивент‑зона",
};

const typeTone: Record<CoworkingPlace["type"], string> = {
  capsule: "#6366F1",
  event: "#F97316",
};

const formatPrice = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("ru-RU");
};

export default function CoworkingPlacesPage() {
  const [places, setPlaces] = useState<CoworkingPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CoworkingPlace["type"]>("all");
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "capsule" as CoworkingPlace["type"],
    seats: 1,
    price_1h: "",
    price_3h: "",
    price_day: "",
    price_month: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () =>
    fetchCoworkingPlaces()
      .then(setPlaces)
      .catch((err) => setError(err.message || "Не удалось загрузить места"))
      .finally(() => setLoading(false));

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        seats: Number(form.seats) || 0,
        price_1h: parsePrice(form.price_1h),
        price_3h: parsePrice(form.price_3h),
        price_day: parsePrice(form.price_day),
        price_month: parsePrice(form.price_month),
      };

      if (editingId) {
        await updateCoworkingPlace(editingId, payload);
      } else {
        await createCoworkingPlace(payload);
      }
      setForm({
        name: "",
        description: "",
        type: "capsule",
        seats: 1,
        price_1h: "",
        price_3h: "",
        price_day: "",
        price_month: "",
      });
      setEditingId(null);
      setOpenAdd(false);
      await loadData();
    } catch (err) {
      setError((err as Error).message || (editingId ? "Не удалось обновить место" : "Не удалось создать место"));
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (value: number | string | null | undefined): string => {
    if (!value && value !== 0) return "";
    const numStr = String(value).replace(/\s/g, "");
    if (!numStr) return "";
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("ru-RU").replace(/,/g, " ");
  };

  const parsePrice = (value: string): number | undefined => {
    const cleaned = value.replace(/\s/g, "");
    if (!cleaned) return undefined;
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? undefined : num;
  };

  const handleEdit = (place: CoworkingPlace) => {
    setEditingId(place.id);
    setForm({
      name: place.name,
      description: place.description || "",
      type: place.type,
      seats: place.seats || 1,
      price_1h: formatPrice(place.price_1h),
      price_3h: formatPrice(place.price_3h),
      price_day: formatPrice(place.price_day),
      price_month: formatPrice(place.price_month),
    });
    setOpenAdd(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteCoworkingPlace(deleteConfirm.id);
      setPlaces((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError((err as Error).message || "Не удалось удалить место");
    } finally {
      setDeleting(false);
    }
  };

  const { totalSeats, capsuleCount, eventSeats } = useMemo(() => {
    const seats = places.reduce((sum, place) => sum + (place.seats || 0), 0);
    const capsules = places.filter((place) => place.type === "capsule").length;
    const eventSeatTotal = places
      .filter((place) => place.type === "event")
      .reduce((sum, place) => sum + (place.seats || 0), 0);
    return { totalSeats: seats, capsuleCount: capsules, eventSeats: eventSeatTotal };
  }, [places]);

  const highlightStats = [
    { label: "Командные капсулы", value: capsuleCount, detail: "гибкие & индивидуальные", icon: Building2 },
    { label: "Посадочных мест", value: totalSeats, detail: "актуальный лимит", icon: LayoutGrid },
    { label: "Ивент‑зона", value: eventSeats, detail: "open space", icon: Sparkles },
  ];

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch = !search || place.name.toLowerCase().includes(search.toLowerCase()) || 
        (place.description && place.description.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === "all" || place.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [places, search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-col sm:flex-row">
        <div className="flex-1 flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
            <input
              placeholder="Поиск по названию, описанию..."
              className="h-10 w-full pl-10 pr-3 text-sm rounded-xl"
              style={{ 
                background: "var(--muted)", 
                border: "1px solid var(--card-border)", 
                color: "var(--foreground)" 
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 px-4 rounded-xl text-sm"
            style={{ 
              background: "var(--muted)", 
              border: "1px solid var(--card-border)", 
              color: "var(--foreground)" 
            }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="all">Все типы</option>
            <option value="capsule">Капсула</option>
            <option value="event">Ивент‑зона</option>
          </select>
        </div>
        <button
          type="button"
          className="payments-add-btn"
          onClick={() => setOpenAdd(true)}
        >
          <Plus className="h-4 w-4" />
          Добавить место
        </button>
      </div>

      <Card className="overflow-hidden border border-[var(--card-border)]" style={{ background: "var(--panel)" }}>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {highlightStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: "var(--card-border)", background: "var(--panel)" }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>
                        {stat.label}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
                          {stat.value}
                        </span>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {stat.detail}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border p-2" style={{ borderColor: "var(--card-border)", color: "var(--muted-foreground)" }}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаем реальные места...
        </div>
      )}

      {error && (
        <Card className="border border-red-300/40 bg-red-500/5 p-4 text-sm" style={{ color: "var(--foreground)" }}>
          <div className="font-semibold text-red-600 dark:text-red-400">Ошибка</div>
          <div className="text-red-600/80 dark:text-red-400/90">{error}</div>
        </Card>
      )}

      {!loading && !error && places.length === 0 && (
        <Card className="p-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Пока нет заведенных мест. Добавьте первое через API /api/coworking/places.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
        {filteredPlaces.map((place) => {
          const tone = typeTone[place.type];
          const Icon = place.type === "event" ? Sparkles : Building2;
          return (
            <Card
              key={place.id}
              className="flex h-full flex-col gap-4 relative"
              style={{
                background: "var(--panel)",
                borderColor: "var(--card-border)",
                boxShadow: "0 24px 45px -50px rgba(15,23,42,0.65)",
              }}
            >
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => handleEdit(place)}
                  title="Редактировать"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(place.id, place.name)}
                  title="Удалить"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    color: "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{ background: `${tone}15`, color: tone }}
                  >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                        {place.name}
                      </div>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {typeLabel[place.type]}
                  </span>
                </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: tone }}>
                      {place.seats}
                    </span>
                    <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    мест
                  </span>
                  </div>
                </div>
              </div>

              {place.description && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {place.description}
                </p>
              )}

              <div
                className="grid grid-cols-2 gap-3 rounded-xl border p-4"
                style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>1 час</span>
                  <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{formatPrice(place.price_1h)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>3 часа</span>
                  <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{formatPrice(place.price_3h)}</span>
                    </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>День</span>
                  <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{formatPrice(place.price_day)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Месяц</span>
                  <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{formatPrice(place.price_month)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={deleteConfirm !== null}
        onClose={() => !deleting && setDeleteConfirm(null)}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            Вы уверены, что хотите удалить место <strong>«{deleteConfirm?.name}»</strong>?
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Это действие нельзя отменить.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
            <button
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: deleting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: deleting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.currentTarget.style.background = "var(--panel)";
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.currentTarget.style.background = "var(--muted)";
                }
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "none",
                background: deleting ? "var(--muted)" : "#EF4444",
                color: deleting ? "var(--muted-foreground)" : "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: deleting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: deleting ? "none" : "0 4px 12px rgba(239, 68, 68, 0.25)",
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!deleting) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.25)";
                }
              }}
            >
              {deleting ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        open={openAdd} 
        onClose={() => {
          if (!creating) {
            setOpenAdd(false);
            setEditingId(null);
            setForm({
              name: "",
              description: "",
              type: "capsule",
              seats: 1,
              price_1h: "",
              price_3h: "",
              price_day: "",
              price_month: "",
            });
          }
        }} 
        title={editingId ? "Редактировать место" : "Добавить место"}
      >
        <div className="space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Название
                </label>
                <input
                  className="h-11 w-full rounded-xl border px-4 text-sm transition-all focus:outline-none"
                  style={{ 
                    background: "var(--background)", 
                    border: "1.5px solid var(--card-border)", 
                    color: "var(--foreground)" 
                  }}
                  placeholder="Введите название места"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Тип
                </label>
                <select
                  className="h-11 w-full rounded-xl border px-4 text-sm transition-all focus:outline-none"
                  style={{ 
                    background: "var(--background)", 
                    border: "1.5px solid var(--card-border)", 
                    color: "var(--foreground)",
                    cursor: "pointer",
                  }}
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CoworkingPlace["type"] }))}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="capsule">Капсула</option>
                  <option value="event">Ивент‑зона</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Количество мест
              </label>
              <input
                type="number"
                min={0}
                className="h-11 w-full rounded-xl border px-4 text-sm transition-all focus:outline-none"
                style={{ 
                  background: "var(--background)", 
                  border: "1.5px solid var(--card-border)", 
                  color: "var(--foreground)" 
                }}
                placeholder="Введите количество мест"
                value={form.seats}
                onChange={(e) => setForm((f) => ({ ...f, seats: Number(e.target.value) }))}
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Описание
              </label>
              <textarea
                className="w-full rounded-xl border px-4 py-3 text-sm resize-none transition-all focus:outline-none"
                style={{ 
                  background: "var(--background)", 
                  border: "1.5px solid var(--card-border)", 
                  color: "var(--foreground)",
                  minHeight: "100px"
                }}
                placeholder="Введите описание места"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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

          <div className="space-y-3">
            <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              Цены
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>1 час</label>
                <input
                  type="text"
                  className="h-10 w-full rounded-xl border px-3 text-sm transition-all focus:outline-none"
                  style={{ 
                    background: "var(--background)", 
                    border: "1.5px solid var(--card-border)", 
                    color: "var(--foreground)" 
                  }}
                  placeholder="Например: 100 000"
                  value={form.price_1h}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\s/g, "");
                    if (input === "" || /^\d+$/.test(input)) {
                      setForm((prev) => ({
                        ...prev,
                        price_1h: input === "" ? "" : formatPrice(input),
                      }));
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                    if (e.target.value && !isNaN(parseInt(e.target.value.replace(/\s/g, ""), 10))) {
                      const num = parseInt(e.target.value.replace(/\s/g, ""), 10);
                      setForm((prev) => ({
                        ...prev,
                        price_1h: formatPrice(num),
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>3 часа</label>
                <input
                  type="text"
                  className="h-10 w-full rounded-xl border px-3 text-sm transition-all focus:outline-none"
                  style={{ 
                    background: "var(--background)", 
                    border: "1.5px solid var(--card-border)", 
                    color: "var(--foreground)" 
                  }}
                  placeholder="Например: 300 000"
                  value={form.price_3h}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\s/g, "");
                    if (input === "" || /^\d+$/.test(input)) {
                      setForm((prev) => ({
                        ...prev,
                        price_3h: input === "" ? "" : formatPrice(input),
                      }));
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                    if (e.target.value && !isNaN(parseInt(e.target.value.replace(/\s/g, ""), 10))) {
                      const num = parseInt(e.target.value.replace(/\s/g, ""), 10);
                      setForm((prev) => ({
                        ...prev,
                        price_3h: formatPrice(num),
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>День</label>
                <input
                  type="text"
                  className="h-10 w-full rounded-xl border px-3 text-sm transition-all focus:outline-none"
                  style={{ 
                    background: "var(--background)", 
                    border: "1.5px solid var(--card-border)", 
                    color: "var(--foreground)" 
                  }}
                  placeholder="Например: 900 000"
                  value={form.price_day}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\s/g, "");
                    if (input === "" || /^\d+$/.test(input)) {
                      setForm((prev) => ({
                        ...prev,
                        price_day: input === "" ? "" : formatPrice(input),
                      }));
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                    if (e.target.value && !isNaN(parseInt(e.target.value.replace(/\s/g, ""), 10))) {
                      const num = parseInt(e.target.value.replace(/\s/g, ""), 10);
                      setForm((prev) => ({
                        ...prev,
                        price_day: formatPrice(num),
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>Месяц</label>
                <input
                  type="text"
                  className="h-10 w-full rounded-xl border px-3 text-sm transition-all focus:outline-none"
                  style={{ 
                    background: "var(--background)", 
                    border: "1.5px solid var(--card-border)", 
                    color: "var(--foreground)" 
                  }}
                  placeholder="Например: 18 000 000"
                  value={form.price_month}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\s/g, "");
                    if (input === "" || /^\d+$/.test(input)) {
                      setForm((prev) => ({
                        ...prev,
                        price_month: input === "" ? "" : formatPrice(input),
                      }));
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                    if (e.target.value && !isNaN(parseInt(e.target.value.replace(/\s/g, ""), 10))) {
                      const num = parseInt(e.target.value.replace(/\s/g, ""), 10);
                      setForm((prev) => ({
                        ...prev,
                        price_month: formatPrice(num),
                      }));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
            <button 
              onClick={() => {
                if (!creating) {
                  setOpenAdd(false);
                  setEditingId(null);
                  setForm({
                    name: "",
                    description: "",
                    type: "capsule",
                    seats: 1,
                    price_1h: "",
                    price_3h: "",
                    price_day: "",
                    price_month: "",
                  });
                }
              }} 
              disabled={creating}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: creating ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: creating ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!creating) {
                  e.currentTarget.style.background = "var(--panel)";
                }
              }}
              onMouseLeave={(e) => {
                if (!creating) {
                  e.currentTarget.style.background = "var(--muted)";
                }
              }}
            >
              Отмена
            </button>
            <button 
              onClick={handleCreate} 
              disabled={creating || !form.name.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "none",
                background: creating || !form.name.trim()
                  ? "var(--muted)" 
                  : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: creating || !form.name.trim()
                  ? "var(--muted-foreground)" 
                  : "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: creating || !form.name.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: creating || !form.name.trim()
                  ? "none" 
                  : "0 4px 12px rgba(99, 102, 241, 0.25)",
              }}
              onMouseEnter={(e) => {
                if (!creating && form.name.trim()) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!creating && form.name.trim()) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.25)";
                }
              }}
            >
              {creating ? (editingId ? "Обновляю..." : "Сохраняю...") : (editingId ? "Обновить" : "Сохранить")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
