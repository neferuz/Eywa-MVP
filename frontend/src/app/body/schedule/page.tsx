"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { Calendar, Users, Clock, Activity, Repeat, User, Loader2 } from "lucide-react";
import {
  fetchBodyScheduleAnalytics,
  type BodyScheduleAnalytics as BodyScheduleAnalyticsType,
  type GroupAnalytics as GroupAnalyticsType,
} from "@/lib/api";

// Цвета для групп
const GROUP_COLORS: Record<string, string> = {
  body: "#79A7D3",
  reform: "#C86B58",
};

// Цвета для залов (если залов больше, цвета будут циклически повторяться)
const ROOM_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

// Иконки для групп
const GROUP_ICONS: Record<string, typeof Activity> = {
  body: Activity,
  reform: Repeat,
};

interface GroupAnalyticsWithUI extends GroupAnalyticsType {
  icon: typeof Activity;
  color: string;
}

export default function BodySchedulePage() {
  const [analytics, setAnalytics] = useState<BodyScheduleAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBodyScheduleAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError(err instanceof Error ? err.message : "Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  // Маппинг названий групп
  const GROUP_NAME_MAP: Record<string, { name: string; label: string }> = {
    body: { name: "Body Mind", label: "Body Mind" },
    reform: { name: "Pilates Reformer", label: "Pilates Reformer" },
  };

  // Преобразуем данные групп для UI
  const groupAnalytics: GroupAnalyticsWithUI[] =
    analytics?.groups.map((group) => {
      const nameMapping = GROUP_NAME_MAP[group.id] || { name: group.name, label: group.label };
      return {
        ...group,
        name: nameMapping.name,
        label: nameMapping.label,
        icon: GROUP_ICONS[group.id] || Activity,
        color: GROUP_COLORS[group.id] || "#6366F1",
      };
    }) || [];

  // Преобразуем данные залов для UI (добавляем цвета)
  const roomsLoad =
    analytics?.rooms.map((room, index) => ({
      ...room,
      color: ROOM_COLORS[index % ROOM_COLORS.length],
    })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--foreground)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">EYWA BODY · Расписание</h1>
        <Card>
          <div className="text-red-500">Ошибка: {error}</div>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">EYWA BODY · Расписание</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Всего слотов</div>
          </div>
          <div className="text-2xl font-semibold">{analytics.overview.total_slots}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Забронировано</div>
          </div>
          <div className="text-2xl font-semibold">{analytics.overview.booked_slots}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Загрузка</div>
          </div>
          <div className="text-2xl font-semibold">{analytics.overview.load_percentage}%</div>
        </Card>
      </div>

      {/* Аналитика по группам */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupAnalytics.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.id} className="body-schedule-group-card">
              <div className="body-schedule-group-card__header">
                <div className="body-schedule-group-card__title-group">
                  <div className="body-schedule-group-card__icon" style={{ background: group.color + "20", color: group.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="body-schedule-group-card__name">{group.name}</div>
                    <div className="body-schedule-group-card__label">{group.label}</div>
                  </div>
                </div>
                <div className="body-schedule-group-card__load-badge" style={{ background: group.color + "15", color: group.color }}>
                  {group.load}%
                </div>
              </div>

              <div className="body-schedule-group-card__stats">
                <div className="body-schedule-group-card__stat">
                  <div className="body-schedule-group-card__stat-label">Занятий</div>
                  <div className="body-schedule-group-card__stat-value">{group.total_classes}</div>
                </div>
                <div className="body-schedule-group-card__stat">
                  <div className="body-schedule-group-card__stat-label">Записей</div>
                  <div className="body-schedule-group-card__stat-value">{group.total_bookings}</div>
                </div>
                <div className="body-schedule-group-card__stat">
                  <div className="body-schedule-group-card__stat-label">Загрузка</div>
                  <div className="body-schedule-group-card__stat-value">{group.load}%</div>
                </div>
                <div className="body-schedule-group-card__stat">
                  <div className="body-schedule-group-card__stat-label">Средняя заполненность</div>
                  <div className="body-schedule-group-card__stat-value">{group.avg_occupancy}%</div>
                </div>
              </div>

              <div className="body-schedule-group-card__load-bar">
                <div className="body-schedule-group-card__load-bar-bg">
                  <div
                    className="body-schedule-group-card__load-bar-fill"
                    style={{
                      width: `${group.load}%`,
                      background: group.color,
                    }}
                  />
                </div>
              </div>

              <div className="body-schedule-group-card__coaches">
                <div className="body-schedule-group-card__coaches-label">Тренеры:</div>
                <div className="body-schedule-group-card__coaches-list">
                  {group.coaches.map((coach, idx) => (
                    <span key={idx} className="body-schedule-group-card__coach-tag">
                      <User className="h-3 w-3" />
                      {coach}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Тренеры и загрузка залов */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Тренеры · загрузка по неделе</div>
          <div className="space-y-3">
            {analytics.coaches.length > 0 ? (
              analytics.coaches.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{c.name}</div>
                    <div className="text-sm" style={{ color: 'var(--foreground)' }}>{c.load}% · {c.classes} занятий</div>
                  </div>
                  <div className="h-2.5 w-full rounded-full" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${c.load}%`, background: '#6366F1' }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Нет данных о тренерах</div>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Загрузка залов</div>
          <div className="space-y-3">
            {roomsLoad.length > 0 ? (
              roomsLoad.map((r) => (
                <div key={r.room}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{r.room}</div>
                    <div className="text-sm" style={{ color: 'var(--foreground)' }}>{r.load}%</div>
                  </div>
                  <div className="h-2.5 w-full rounded-full" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${r.load}%`, background: r.color }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Нет данных о залах</div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}


