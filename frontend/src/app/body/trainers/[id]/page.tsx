"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, ArrowLeft, Clock, Phone, User, AlertCircle, ClipboardList, Timer } from "lucide-react";
import { Trainer, fetchTrainerById } from "@/lib/api";

export default function BodyTrainerDetailPage() {
  const params = useParams<{ id: string }>();
  const trainerId = params?.id;
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const initials = useMemo(() => {
    const name = trainer?.full_name ?? "";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [trainer?.full_name]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/body/trainers" className="inline-flex items-center gap-2 text-sm hover:underline">
          <ArrowLeft className="h-4 w-4" /> Назад к тренерам
        </Link>
        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Загрузка...
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
          <span className="text-xs px-2 py-1 rounded-full border border-[var(--card-border)] bg-[var(--muted)] text-[var(--muted-foreground)]">
            Тренер ID: {trainer.id}
          </span>
        </div>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Профиль тренера
        </span>
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
              <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
                {trainer.full_name}
              </h1>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {trainer.directions?.join(" · ") || "Направления не указаны"}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {trainer.schedule || "График не указан"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm lg:items-end">
            <div className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{trainer.phone}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <User className="h-3.5 w-3.5" />
              Основной тренер BODY
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" style={{ borderRadius: 24 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                Данные тренера
              </h2>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Имя, телефон, направления, график, комментарии
              </p>
            </div>
            <Timer className="h-5 w-5" />
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

            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                График работы
              </div>
              <div className="font-medium" style={{ color: "var(--foreground)" }}>
                {trainer.schedule || "—"}
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

        <Card className="flex items-center justify-center" style={{ borderRadius: 24 }}>
          <div className="text-sm text-center space-y-2" style={{ color: "var(--muted-foreground)" }}>
            <User className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
            <div>Доступные действия пока не настроены.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}


