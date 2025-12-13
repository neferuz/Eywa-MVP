"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, ArrowLeft, Clock, Phone, User, AlertCircle, Loader2, Pencil, Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Trainer, fetchTrainerById, updateTrainer, fetchScheduleBookings, type ScheduleBooking } from "@/lib/api";
import { toast } from "@pheralb/toast";

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
] as const;

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const getStartOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getDateForDayKey = (dayKey: string, weekStart: Date) => {
  const dayIndex = DAY_KEYS.indexOf(dayKey as typeof DAY_KEYS[number]);
  if (dayIndex === -1) return new Date();
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  return date;
};

type TrainerForm = {
  full_name: string;
  phone: string;
  directions: string[];
  comment: string;
};

export default function BodyTrainerDetailPage() {
  const params = useParams<{ id: string }>();
  const trainerId = params?.id;
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<TrainerForm>({
    full_name: "",
    phone: "",
    directions: [],
    comment: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!trainerId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTrainerById(trainerId);
        if (!data) {
          setError("Тренер не найден");
          setTrainer(null);
        } else {
          setTrainer(data);
          setForm({
            full_name: data.full_name,
            phone: data.phone,
            directions: data.directions || [],
            comment: data.comment || "",
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить тренера");
        setTrainer(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trainerId]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!trainerId) return;
      setBookingsLoading(true);
      try {
        const weekStart = getStartOfWeek(currentWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const data = await fetchScheduleBookings({
          trainer_id: trainerId,
          start_date: weekStart.toISOString().split('T')[0],
          end_date: weekEnd.toISOString().split('T')[0],
        });
        setBookings(data);
      } catch (err) {
        console.error("Failed to load bookings:", err);
      } finally {
        setBookingsLoading(false);
      }
    };
    loadBookings();
  }, [trainerId, currentWeek]);

  const weekStart = useMemo(() => getStartOfWeek(currentWeek), [currentWeek]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }, [weekStart]);

  const bookingsByDay = useMemo(() => {
    const result: Record<string, ScheduleBooking[]> = {};
    DAY_KEYS.forEach((day) => {
      result[day] = [];
    });
    
    bookings.forEach((booking) => {
      const bookingDate = new Date(booking.booking_date);
      const dayIndex = Math.floor((bookingDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        const dayKey = DAY_KEYS[dayIndex];
        if (dayKey) {
          result[dayKey].push(booking);
        }
      }
    });
    
    return result;
  }, [bookings, weekStart]);

  const initials = useMemo(() => {
    const name = trainer?.full_name ?? "";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [trainer?.full_name]);

  const handleWeekChange = (offset: number) => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + offset * 7);
    setCurrentWeek(next);
  };

  const toggleDirection = (direction: string) => {
    setForm((prev) => {
      const newDirections = prev.directions.includes(direction)
        ? prev.directions.filter((d) => d !== direction)
        : [...prev.directions, direction];
      return { ...prev, directions: newDirections };
    });
  };

  const handleSave = async () => {
    if (!trainerId || !form.full_name.trim() || !form.phone.trim()) {
      toast.warning({ text: "Заполните имя и номер телефона" });
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateTrainer(trainerId, {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        directions: form.directions,
        comment: form.comment.trim() || null,
      });
      setTrainer(updated);
      setIsEditOpen(false);
      toast.success({ text: "Данные тренера обновлены" });
    } catch (err) {
      toast.error({ text: err instanceof Error ? err.message : "Не удалось обновить данные" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/body/trainers" className="inline-flex items-center gap-2 text-sm hover:underline">
          <ArrowLeft className="h-4 w-4" /> Назад к тренерам
        </Link>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--foreground)" }} />
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="space-y-4">
        <Link href="/body/trainers" className="inline-flex items-center gap-2 text-sm hover:underline">
          <ArrowLeft className="h-4 w-4" /> Назад к тренерам
        </Link>
        <div className="text-sm flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
          <AlertCircle className="h-4 w-4" />
          {error || "Тренер не найден"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/body/trainers" className="inline-flex items-center gap-2 text-sm hover:underline">
            <ArrowLeft className="h-4 w-4" /> Назад к тренерам
          </Link>
        </div>
        <button
          onClick={() => setIsEditOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
          }}
        >
          <Pencil className="h-4 w-4" />
          Редактировать
        </button>
      </div>

      <div
        className="relative overflow-hidden"
        style={{ borderRadius: 30, background: "var(--panel)", border: "1px solid var(--card-border)" }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.18), transparent)" }}
        />
        <div className="relative flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center shrink-0 text-lg font-semibold"
              style={{ background: "rgba(59,130,246,0.15)", color: "#2563EB" }}
            >
              {initials || "TR"}
            </div>
            <div className="space-y-1">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {trainer.directions?.join(" · ") || "Направления не указаны"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm lg:items-end">
            <div className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{trainer.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" style={{ borderRadius: 24 }}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Данные тренера
            </h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Имя, телефон, направления, комментарии
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Имя и фамилия
              </div>
              <div className="font-medium" style={{ color: "var(--foreground)" }}>
                {trainer.full_name}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Номер телефона
              </div>
              <div className="font-medium inline-flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Phone className="h-4 w-4" />
                {trainer.phone}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Направления
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {trainer.directions?.length ? (
                  trainer.directions.map((dir) => (
                    <span
                      key={dir}
                      className="px-2.5 py-1 rounded-full text-xs"
                      style={{
                        background: "rgba(15,23,42,0.03)",
                        border: "1px solid rgba(15,23,42,0.06)",
                      }}
                    >
                      {dir}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--foreground)" }}>—</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3 text-sm">
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Комментарии
            </div>
            <div className="mt-1" style={{ color: "var(--foreground)" }}>
              {trainer.comment || "—"}
            </div>
          </div>
        </Card>

        <Card style={{ borderRadius: 24 }}>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                Статистика
              </h3>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Занятий на неделе
                </div>
                <div className="text-lg font-semibold mt-1" style={{ color: "var(--foreground)" }}>
                  {bookings.length}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              График занятий
            </h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Расписание на неделю
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleWeekChange(-1)}
              className="p-2 rounded-lg hover:bg-[var(--muted)] transition"
              style={{ border: "1px solid var(--card-border)" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium px-3" style={{ color: "var(--foreground)" }}>
              {weekStart.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} -{" "}
              {weekEnd.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            </span>
            <button
              onClick={() => handleWeekChange(1)}
              className="p-2 rounded-lg hover:bg-[var(--muted)] transition"
              style={{ border: "1px solid var(--card-border)" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-2 rounded-lg text-xs font-medium hover:bg-[var(--muted)] transition"
              style={{ border: "1px solid var(--card-border)" }}
            >
              Сегодня
            </button>
          </div>
        </div>

        {bookingsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 text-xs font-semibold uppercase" style={{ color: "var(--muted-foreground)", borderBottom: "1px solid var(--card-border)" }}>
                    Время
                  </th>
                  {DAY_KEYS.map((dayKey, idx) => {
                    const date = getDateForDayKey(dayKey, weekStart);
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <th
                        key={dayKey}
                        className="text-center p-3 text-xs font-semibold"
                        style={{
                          color: isToday ? "#2563EB" : "var(--muted-foreground)",
                          borderBottom: "1px solid var(--card-border)",
                          background: isToday ? "rgba(37, 99, 235, 0.05)" : "transparent",
                        }}
                      >
                        <div>{WEEK_DAYS[idx]}</div>
                        <div className="text-xs font-normal mt-1">{date.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time}>
                    <td className="p-2 text-xs font-medium" style={{ color: "var(--muted-foreground)", borderRight: "1px solid var(--card-border)" }}>
                      {time}
                    </td>
                    {DAY_KEYS.map((dayKey) => {
                      const dayBookings = bookingsByDay[dayKey] || [];
                      const slotBooking = dayBookings.find(
                        (b) => b.booking_time === time || b.booking_time?.startsWith(time.split(":")[0])
                      );
                      return (
                        <td
                          key={dayKey}
                          className="p-2 text-center"
                          style={{ borderRight: "1px solid var(--card-border)", borderBottom: "1px solid var(--card-border)" }}
                        >
                          {slotBooking ? (
                            <div
                              className="rounded-lg p-2 text-xs cursor-pointer hover:opacity-80 transition"
                              style={{
                                background: slotBooking.status === "Оплачено" ? "#16A34A" : slotBooking.status === "Бронь" ? "#F59E0B" : "#10B981",
                                color: "#fff",
                              }}
                              title={`${slotBooking.service_name || "Занятие"} · ${slotBooking.status} · ${slotBooking.current_count}/${slotBooking.max_capacity}`}
                            >
                              <div className="font-medium truncate">{slotBooking.service_name || "Занятие"}</div>
                              <div className="text-xs opacity-90 mt-0.5">
                                {slotBooking.current_count}/{slotBooking.max_capacity}
                              </div>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Редактировать тренера">
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
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="button"
              className="btn-outline body-clients__add-actions-primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Сохранить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
