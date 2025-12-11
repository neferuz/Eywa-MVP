"use client";

import Card from "@/components/Card";
import { Calendar, Users, Clock, Activity, Repeat, User } from "lucide-react";

// Мок: тренеры и загрузка (процент занятости слотов за неделю)
const coachesLoad = [
  { name: "Елена", load: 82, classes: 18 },
  { name: "Дмитрий", load: 74, classes: 15 },
  { name: "Анна", load: 61, classes: 12 },
  { name: "Ольга", load: 55, classes: 11 },
];

// Мок: загрузка залов
const roomsLoad = [
  { room: "Зал 1", load: 76, color: "#6366F1" },
  { room: "Зал 2", load: 64, color: "#10B981" },
  { room: "Зал 3", load: 58, color: "#F59E0B" },
];

// Данные по группам (из Расписание Body & Mind)
interface GroupAnalytics {
  id: string;
  name: string;
  label: string;
  icon: typeof Activity;
  color: string;
  totalClasses: number;
  totalBookings: number;
  load: number;
  coaches: string[];
  avgOccupancy: number;
}

const groupAnalytics: GroupAnalytics[] = [
  {
    id: "body",
    name: "BODY",
    label: "BODY",
    icon: Activity,
    color: "#79A7D3",
    totalClasses: 12,
    totalBookings: 98,
    load: 78,
    coaches: ["Севара", "Нигина", "Гавхар"],
    avgOccupancy: 82,
  },
  {
    id: "reform",
    name: "REFORM",
    label: "REFORM",
    icon: Repeat,
    color: "#C86B58",
    totalClasses: 18,
    totalBookings: 108,
    load: 85,
    coaches: ["Ангелина", "Евгения", "Камилла", "Антонина"],
    avgOccupancy: 75,
  },
];

export default function BodySchedulePage() {
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
          <div className="text-2xl font-semibold">70</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Забронировано</div>
          </div>
          <div className="text-2xl font-semibold">45</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Загрузка</div>
          </div>
          <div className="text-2xl font-semibold">64%</div>
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
                  <div className="body-schedule-group-card__stat-value">{group.totalClasses}</div>
                </div>
                <div className="body-schedule-group-card__stat">
                  <div className="body-schedule-group-card__stat-label">Записей</div>
                  <div className="body-schedule-group-card__stat-value">{group.totalBookings}</div>
                </div>
                <div className="body-schedule-group-card__stat">
                  <div className="body-schedule-group-card__stat-label">Загрузка</div>
                  <div className="body-schedule-group-card__stat-value">{group.load}%</div>
                </div>
                <div className="body-schedule-group-card__stat">
                  <div className="body-schedule-group-card__stat-label">Средняя заполненность</div>
                  <div className="body-schedule-group-card__stat-value">{group.avgOccupancy}%</div>
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
            {coachesLoad.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{c.name}</div>
                  <div className="text-sm" style={{ color: 'var(--foreground)' }}>{c.load}% · {c.classes} занятий</div>
                </div>
                <div className="h-2.5 w-full rounded-full" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${c.load}%`, background: '#6366F1' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Загрузка залов</div>
          <div className="space-y-3">
            {roomsLoad.map((r) => (
              <div key={r.room}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{r.room}</div>
                  <div className="text-sm" style={{ color: 'var(--foreground)' }}>{r.load}%</div>
                </div>
                <div className="h-2.5 w-full rounded-full" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${r.load}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}


