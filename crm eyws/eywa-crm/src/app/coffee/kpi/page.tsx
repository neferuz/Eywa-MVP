"use client";

import Card from "@/components/Card";
import { TrendingUp, Users, Award } from "lucide-react";

const staffKpi = [
  { name: "Анна", role: "Старший бариста", shifts: 18, upsell: "32%", rating: "4.9" },
  { name: "Иван", role: "Бариста", shifts: 16, upsell: "28%", rating: "4.8" },
  { name: "Мария", role: "Бариста", shifts: 14, upsell: "25%", rating: "4.7" },
];

const focusAreas = [
  { title: "Upsell десертов", desc: "Цель на ноябрь — 35% чеков с десертом", status: "+4 п.п. за неделю" },
  { title: "Скорость обслуживания", desc: "Среднее время ожидания 3:20 → цель 2:45", status: "В работе" },
  { title: "NPS гостей", desc: "Последний опрос — 4.78 из 5", status: "Ок" },
];

export default function CoffeeKpiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">KPI и эффективность кофейни</h1>
      </div>
      <p className="text-sm text-zinc-500">Показатели команды и направления развития сервиса.</p>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4" />
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Команда бариста</div>
        </div>
        <div className="space-y-3">
          {staffKpi.map((row) => (
            <div key={row.name} className="p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{row.name}</div>
                <div className="text-xs text-zinc-500">{row.role}</div>
              </div>
              <div className="text-xs text-zinc-500">
                <div>Смен: {row.shifts}</div>
                <div>Upsell: {row.upsell}</div>
                <div>Оценка: {row.rating}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4" />
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Фокус на месяц</div>
        </div>
        <div className="space-y-3">
          {focusAreas.map((item) => (
            <div key={item.title} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.title}</div>
              <div className="text-xs text-zinc-500 mt-1">{item.desc}</div>
              <div className="text-xs font-medium mt-2" style={{ color: '#10B981' }}>{item.status}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
