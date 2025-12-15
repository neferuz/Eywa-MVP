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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header with search and button */}
      <Card style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "1rem", width: "100%" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <Search 
                className="absolute left-4 h-5 w-5 pointer-events-none" 
                style={{ color: "var(--foreground)", opacity: 0.5, top: "50%", transform: "translateY(-50%)" }} 
              />
              <input
                type="text"
                placeholder="Поиск по имени, телефону или направлению"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "2.75rem",
                  paddingRight: "1rem",
                  paddingTop: "0.75rem",
                  paddingBottom: "0.75rem",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
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
            </div>
            <button
              type="button"
              className="payments-add-btn"
              onClick={() => setIsAddOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "none",
                background: "#000",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1a1a1a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#000";
              }}
            >
              <Plus className="h-4 w-4" />
              Добавить тренера
            </button>
          </div>

          {allDirections.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.25rem", 
                fontSize: "0.75rem", 
                fontWeight: 600, 
                textTransform: "uppercase", 
                letterSpacing: "0.05em",
                color: "var(--muted-foreground)" 
              }}>
                <Filter className="h-4 w-4" /> Направления
              </span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {allDirections.map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setDirectionFilter(directionFilter === dir ? null : dir)}
                    style={{
                      padding: "0.375rem 0.75rem",
                      borderRadius: "9999px",
                      border: "1px solid var(--card-border)",
                      background: directionFilter === dir ? "var(--foreground)" : "transparent",
                      color: directionFilter === dir ? "#fff" : "var(--foreground)",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: directionFilter === dir ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
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
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem", 
          padding: "0.75rem 1rem", 
          borderRadius: "12px", 
          background: "rgba(239, 68, 68, 0.1)", 
          color: "#EF4444",
          fontSize: "0.875rem"
        }}>
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "1rem", 
          padding: "3rem",
          color: "var(--muted-foreground)"
        }}>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span style={{ fontSize: "0.875rem" }}>Загрузка тренеров...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "1rem", 
          padding: "3rem",
          color: "var(--muted-foreground)"
        }}>
          <Search className="h-8 w-8" style={{ opacity: 0.5 }} />
          <p style={{ fontSize: "0.875rem", textAlign: "center" }}>
            {search || directionFilter
              ? "По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска или фильтры."
              : "Тренеры не найдены"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map((trainer) => (
            <div key={trainer.id} style={{ position: "relative" }}>
              <Link href={`/body/trainers/${trainer.id}`} style={{ textDecoration: "none" }}>
                <Card style={{ 
                  padding: "1.5rem", 
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <User className="h-5 w-5" style={{ color: "var(--foreground)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: "1rem", 
                        fontWeight: 600, 
                        color: "var(--foreground)",
                        marginBottom: "0.25rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {trainer.full_name}
                      </div>
                      <div style={{ 
                        fontSize: "0.875rem", 
                        color: "var(--muted-foreground)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {trainer.phone}
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    fontSize: "0.875rem", 
                    color: "var(--muted-foreground)",
                    padding: "0.5rem 0",
                    borderTop: "1px solid var(--card-border)",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    {trainer.directions?.join(" · ") || "Направления не указаны"}
                  </div>

                  {trainer.directions?.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {trainer.directions.map((tag) => (
                        <span 
                          key={tag}
                          style={{
                            padding: "0.25rem 0.625rem",
                            borderRadius: "6px",
                            background: "var(--muted)",
                            color: "var(--foreground)",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    color: "var(--muted-foreground)",
                    marginTop: "auto",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid var(--card-border)",
                  }}>
                    <Activity className="h-4 w-4" />
                    <span>Перейти в профиль тренера</span>
                  </div>
                </Card>
              </Link>
              <button
                type="button"
                aria-label="Удалить тренера"
                onClick={(event) => handleDeleteClick(trainer.id, trainer.full_name, event)}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1px solid var(--card-border)",
                  background: "var(--muted)",
                  color: "var(--muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#EF4444";
                  e.currentTarget.style.borderColor = "#EF4444";
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--muted-foreground)";
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.background = "var(--muted)";
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Trainer Modal */}
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Добавить тренера">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--foreground)" }}>
              <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Имя и фамилия</span>
              <input
                type="text"
                placeholder="Например, Анна Лебедева"
                value={form.full_name}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  padding: "0.625rem 0.875rem",
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
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--foreground)" }}>
              <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Номер телефона</span>
              <input
                type="tel"
                placeholder="+998 90 000 00 00"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1.5px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  padding: "0.625rem 0.875rem",
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
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--foreground)" }}>
              <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Направления</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.75rem", borderRadius: "12px", background: "var(--muted)", border: "1px solid var(--card-border)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.directions.includes("Body Mind")}
                    onChange={() => toggleDirection("Body Mind")}
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      border: "1.5px solid var(--card-border)",
                      cursor: "pointer",
                      accentColor: "#6366F1",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>Body Mind</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.directions.includes("Pilates Reformer")}
                    onChange={() => toggleDirection("Pilates Reformer")}
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      border: "1.5px solid var(--card-border)",
                      cursor: "pointer",
                      accentColor: "#6366F1",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>Pilates Reformer</span>
                </label>
              </div>
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--foreground)" }}>
            <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>Комментарии</span>
            <textarea
              rows={3}
              placeholder="Особенности тренера, предпочтения по нагрузке и т.д."
              value={form.comment}
              onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
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
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                opacity: isSubmitting ? 0.5 : 1,
                pointerEvents: isSubmitting ? "none" : "auto",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--muted)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleAddTrainer}
              disabled={isSubmitting}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "none",
                background: isSubmitting ? "#9ca3af" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSubmitting ? "none" : "0 4px 12px rgba(99, 102, 241, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "center",
                opacity: isSubmitting ? 0.5 : 1,
                pointerEvents: isSubmitting ? "none" : "auto",
              }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.35)"; }}
              onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.25)"; }}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Сохранить
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ 
              flexShrink: 0, 
              width: "48px", 
              height: "48px", 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              background: "rgba(239, 68, 68, 0.1)" 
            }}>
              <AlertTriangle className="h-6 w-6" style={{ color: "#EF4444" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem", color: "var(--foreground)" }}>
                Вы уверены, что хотите удалить тренера?
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                Тренер <strong>{trainerToDelete?.name}</strong> будет удален. Это действие нельзя отменить.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem", borderTop: "1px solid var(--card-border)" }}>
            <button
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTrainerToDelete(null);
              }}
              disabled={isDeleting}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                opacity: isDeleting ? 0.5 : 1,
                pointerEvents: isDeleting ? "none" : "auto",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--muted)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Отмена
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "none",
                background: isDeleting
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isDeleting ? "none" : "0 4px 12px rgba(239, 68, 68, 0.25)",
                opacity: isDeleting ? 0.5 : 1,
                pointerEvents: isDeleting ? "none" : "auto",
              }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.35)"; }}
              onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.25)"; }}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
