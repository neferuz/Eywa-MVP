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
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Card style={{ padding: "1.5rem" }}>
          <div style={{ color: "#EF4444", fontSize: "0.875rem" }}>Ошибка: {error}</div>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ 
                width: "2.5rem", 
                height: "2.5rem", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#6366F1",
              }}>
                <Calendar className="h-5 w-5" />
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Всего слотов
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
              {analytics.overview.total_slots}
            </p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ 
                width: "2.5rem", 
                height: "2.5rem", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10B981",
              }}>
                <Users className="h-5 w-5" />
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Забронировано
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
              {analytics.overview.booked_slots}
            </p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ 
                width: "2.5rem", 
                height: "2.5rem", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "rgba(245, 158, 11, 0.15)",
                color: "#F59E0B",
              }}>
                <Clock className="h-5 w-5" />
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Загрузка
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
              {analytics.overview.load_percentage}%
            </p>
          </div>
        </Card>
      </div>

      {/* Аналитика по группам */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupAnalytics.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.id} style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ 
                    width: "2.5rem", 
                    height: "2.5rem", 
                    borderRadius: "12px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    background: group.color + "20",
                    color: group.color,
                  }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
                      {group.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      {group.label}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  padding: "0.375rem 0.75rem", 
                  borderRadius: "8px", 
                  background: group.color + "15", 
                  color: group.color,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}>
                  {group.load}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div style={{ 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  border: "1px solid var(--card-border)", 
                  background: "var(--muted)" 
                }}>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 500, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    marginBottom: "0.5rem" 
                  }}>
                    Занятий
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)" }}>
                    {group.total_classes}
                  </div>
                </div>
                <div style={{ 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  border: "1px solid var(--card-border)", 
                  background: "var(--muted)" 
                }}>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 500, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    marginBottom: "0.5rem" 
                  }}>
                    Записей
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)" }}>
                    {group.total_bookings}
                  </div>
                </div>
                <div style={{ 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  border: "1px solid var(--card-border)", 
                  background: "var(--muted)" 
                }}>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 500, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    marginBottom: "0.5rem" 
                  }}>
                    Загрузка
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)" }}>
                    {group.load}%
                  </div>
                </div>
                <div style={{ 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  border: "1px solid var(--card-border)", 
                  background: "var(--muted)" 
                }}>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 500, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    marginBottom: "0.5rem" 
                  }}>
                    Средняя заполненность
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)" }}>
                    {group.avg_occupancy}%
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ 
                  height: "0.5rem", 
                  width: "100%", 
                  borderRadius: "9999px", 
                  background: "var(--muted)",
                  border: "1px solid var(--card-border)",
                  overflow: "hidden",
                }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${group.load}%`,
                      background: group.color,
                      borderRadius: "9999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ 
                paddingTop: "1rem", 
                borderTop: "1px solid var(--card-border)" 
              }}>
                <div style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 500, 
                  color: "var(--muted-foreground)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em", 
                  marginBottom: "0.75rem" 
                }}>
                  Тренеры
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {group.coaches.map((coach, idx) => (
                    <span 
                      key={idx} 
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.375rem 0.75rem",
                        borderRadius: "8px",
                        background: "var(--background)",
                        border: "1px solid var(--card-border)",
                        fontSize: "0.75rem",
                        color: "var(--foreground)",
                      }}
                    >
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
        <Card style={{ padding: "1.5rem" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginBottom: "1.5rem" 
          }}>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
                Тренеры
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                Загрузка по неделе
              </p>
            </div>
            <div style={{ 
              padding: "0.75rem", 
              borderRadius: "12px", 
              background: "var(--muted)", 
              border: "1px solid var(--card-border)" 
            }}>
              <Users className="h-5 w-5" style={{ color: "var(--foreground)" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {analytics.coaches.length > 0 ? (
              analytics.coaches.map((c) => (
                <div key={c.name}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    marginBottom: "0.5rem" 
                  }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>
                      {c.load}% · {c.classes} занятий
                    </div>
                  </div>
                  <div style={{ 
                    height: "0.5rem", 
                    width: "100%", 
                    borderRadius: "9999px", 
                    background: "var(--muted)",
                    border: "1px solid var(--card-border)",
                    overflow: "hidden",
                  }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${c.load}%`, 
                      background: "#6366F1",
                      borderRadius: "9999px",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: "center", 
                padding: "2rem 1rem", 
                fontSize: "0.875rem", 
                color: "var(--muted-foreground)" 
              }}>
                Нет данных о тренерах
              </div>
            )}
          </div>
        </Card>
        <Card style={{ padding: "1.5rem" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginBottom: "1.5rem" 
          }}>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
                Загрузка залов
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                Статистика по залам
              </p>
            </div>
            <div style={{ 
              padding: "0.75rem", 
              borderRadius: "12px", 
              background: "var(--muted)", 
              border: "1px solid var(--card-border)" 
            }}>
              <Activity className="h-5 w-5" style={{ color: "var(--foreground)" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {roomsLoad.length > 0 ? (
              roomsLoad.map((r) => (
                <div key={r.room}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    marginBottom: "0.5rem" 
                  }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                      {r.room}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>
                      {r.load}%
                    </div>
                  </div>
                  <div style={{ 
                    height: "0.5rem", 
                    width: "100%", 
                    borderRadius: "9999px", 
                    background: "var(--muted)",
                    border: "1px solid var(--card-border)",
                    overflow: "hidden",
                  }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${r.load}%`, 
                      background: r.color,
                      borderRadius: "9999px",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: "center", 
                padding: "2rem 1rem", 
                fontSize: "0.875rem", 
                color: "var(--muted-foreground)" 
              }}>
                Нет данных о залах
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}


