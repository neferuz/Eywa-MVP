"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Link from "next/link";
import Modal from "@/components/Modal";
import { AlertCircle, Activity, Loader2, Plus, Search, User, Filter, Trash2, AlertTriangle } from "lucide-react";
import { Trainer, createTrainer, fetchTrainers, deleteTrainer } from "@/lib/api";
import { toast } from "@pheralb/toast";

type TrainerForm = {
  full_name: string;
  phone: string;
  directions: string[]; // Массив выбранных направлений
  comment: string;
};

export default function BodyTrainersPage() {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<TrainerForm>({
    full_name: "",
    phone: "",
    directions: [],
    comment: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTrainers();
        setTrainers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить тренеров");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allDirections = useMemo(() => {
    const directionsSet = new Set<string>();
    trainers.forEach((t) => {
      t.directions?.forEach((d) => directionsSet.add(d));
    });
    return Array.from(directionsSet).sort();
  }, [trainers]);

  const filtered = useMemo(() => {
    let result = trainers;

    // Фильтр по направлению
    if (directionFilter) {
      result = result.filter((t) => t.directions?.includes(directionFilter));
    }

    // Поиск
    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter((t) => {
        const directions = (t.directions ?? []).join(", ");
        return [t.full_name, t.phone, directions].some((field) => field.toLowerCase().includes(term));
      });
    }

    return result;
  }, [search, directionFilter, trainers]);

  const resetForm = () => {
    setForm({
      full_name: "",
      phone: "",
      directions: [],
      comment: "",
    });
  };

  const handleAddTrainer = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      setError("Заполните имя и номер телефона");
      toast.warning({
        text: "Заполните имя и номер телефона",
      });
      return;
    }

    if (form.directions.length === 0) {
      setError("Выберите хотя бы одно направление");
      toast.warning({
        text: "Выберите хотя бы одно направление",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        directions: form.directions,
        schedule: null, // График работы больше не используется
        comment: form.comment.trim() || null,
      };
      const created = await createTrainer(payload);
      setTrainers((prev) => [created, ...prev]);
      
      // Показываем уведомление об успехе
      toast.success({
        text: `Тренер "${form.full_name.trim()}" успешно создан!`,
      });
      
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Не удалось сохранить тренера";
      setError(errorMessage);
      toast.error({
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDirection = (direction: string) => {
    setForm((prev) => {
      const newDirections = prev.directions.includes(direction)
        ? prev.directions.filter((d) => d !== direction)
        : [...prev.directions, direction];
      return { ...prev, directions: newDirections };
    });
  };

  const handleDeleteClick = (id: string, name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setTrainerToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!trainerToDelete) return;
    
    setIsDeleting(true);
    setError(null);
    try {
      await deleteTrainer(trainerToDelete.id);
      setTrainers((prev) => prev.filter((t) => t.id !== trainerToDelete.id));
      
      // Показываем уведомление об успехе
      toast.success({
        text: `Тренер "${trainerToDelete.name}" успешно удален`,
      });
      
      setDeleteConfirmOpen(false);
      setTrainerToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Не удалось удалить тренера";
      setError(errorMessage);
      toast.error({
        text: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="body-trainers">
      <div className="rounded-2xl bg-[var(--panel)] p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="body-clients__search">
              <Search className="body-clients__search-icon" />
              <input
                type="text"
                placeholder="Поиск по имени, телефону или направлению"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="payments-add-btn"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Добавить тренера
            </button>
          </div>

          {allDirections.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <Filter className="h-4 w-4" /> Направления
              </span>
              <div className="flex gap-2 flex-wrap">
                {allDirections.map((dir) => (
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
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="body-services__error flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="body-services__empty">
          <Loader2 className="h-5 w-5 animate-spin" />
          Загрузка тренеров...
        </div>
      ) : filtered.length === 0 ? (
        <div className="body-services__empty">
          <Search className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {search || directionFilter
              ? "По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска или фильтры."
              : "Тренеры не найдены"}
          </p>
        </div>
      ) : (
        <section className="body-trainers__grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((trainer) => (
            <div key={trainer.id} className="relative">
              <Link href={`/body/trainers/${trainer.id}`}>
                <Card className="body-trainers__card" style={{ cursor: "pointer" }}>
                  <div className="body-trainers__card-head">
                    <div className="body-trainers__avatar">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="body-trainers__card-meta">
                      <div className="body-trainers__card-name">{trainer.full_name}</div>
                      <span className="body-trainers__card-phone">{trainer.phone}</span>
                    </div>
                  </div>

                <div className="body-trainers__card-specialty">
                  <span>{trainer.directions?.join(" · ") || "Направления не указаны"}</span>
                </div>

                <div className="body-trainers__card-stats">
                  <div>
                    <Activity className="h-3.5 w-3.5" />
                    <span>Нажмите, чтобы открыть профиль тренера</span>
                  </div>
                </div>

                {trainer.directions?.length ? (
                  <div className="body-trainers__tags">
                    {trainer.directions.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : null}

                <div className="body-trainers__card-footer">
                  <span>Перейти в профиль тренера</span>
                </div>
              </Card>
              </Link>
              <button
                type="button"
                aria-label="Удалить тренера"
                className="absolute top-3 right-3 rounded-full border border-[var(--card-border)] bg-[var(--muted)] p-1.5 text-[var(--muted-foreground)] hover:text-red-600 hover:border-red-200 transition z-10"
                onClick={(event) => handleDeleteClick(trainer.id, trainer.full_name, event)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </section>
      )}

      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Добавить тренера">
        <div className="body-clients__add-modal">
          <div className="body-clients__add-modal-grid">
            <div className="body-clients__add-field">
              <label>Имя и фамилия</label>
              <input
                type="text"
                placeholder="Например, Анна Лебедева"
                value={form.full_name}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
              />
            </div>
            <div className="body-clients__add-field">
              <label>Номер телефона</label>
              <input
                type="tel"
                placeholder="+998 90 000 00 00"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="body-clients__add-field">
              <label>Направления</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.directions.includes("Body Mind")}
                    onChange={() => toggleDirection("Body Mind")}
                    className="w-4 h-4 rounded border-[var(--card-border)]"
                  />
                  <span>Body Mind</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.directions.includes("Pilates Reformer")}
                    onChange={() => toggleDirection("Pilates Reformer")}
                    className="w-4 h-4 rounded border-[var(--card-border)]"
                  />
                  <span>Pilates Reformer</span>
                </label>
              </div>
            </div>
          </div>

          <div className="body-clients__add-field">
            <label>Комментарии</label>
            <textarea
              rows={3}
              placeholder="Особенности тренера, предпочтения по нагрузке и т.д."
              value={form.comment}
              onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
            />
          </div>

          <div className="body-clients__add-actions">
            <button
              type="button"
              className="btn-outline body-clients__add-actions-secondary"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="button"
              className="btn-outline body-clients__add-actions-primary"
              onClick={handleAddTrainer}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
            setTrainerToDelete(null);
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
                Вы уверены, что хотите удалить тренера?
              </p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Тренер <strong>{trainerToDelete?.name}</strong> будет удален. Это действие нельзя отменить.
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
                setTrainerToDelete(null);
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


