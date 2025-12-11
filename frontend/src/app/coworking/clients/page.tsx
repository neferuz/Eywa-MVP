"use client";

import Card from "@/components/Card";
import { Users, TrendingUp } from "lucide-react";

const retention = [
  { cohort: "Июнь", clients: 24, retention: "72%" },
  { cohort: "Июль", clients: 28, retention: "76%" },
  { cohort: "Август", clients: 32, retention: "81%" },
  { cohort: "Сентябрь", clients: 35, retention: "84%" },
];

const visits = [
  { segment: "Open space", avg: 9, trend: "+1.2" },
  { segment: "Focus room", avg: 6, trend: "+0.4" },
  { segment: "Переговорки", avg: 4, trend: "-0.3" },
];

export default function CoworkingClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Клиенты коворкинга</h1>
      </div>
      <p className="text-sm text-zinc-500">Посещаемость сегментов и удержание резидентов по когортам.</p>

      <Card>
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--foreground)' }}>Посещаемость по сегментам (в среднем визитов / месяц)</div>
        <div className="space-y-3">
          {visits.map((item) => (
            <div key={item.segment} className="p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.segment}</div>
                <div className="text-xs text-zinc-500">Среднее за последние 30 дней</div>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.avg}</div>
                <div className="flex items-center gap-1 justify-end" style={{ color: Number(item.trend) >= 0 ? '#10B981' : '#EF4444' }}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{item.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--foreground)' }}>Удержание резидентов</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {retention.map((item) => (
            <div key={item.cohort} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--foreground)' }}>{item.cohort}</span>
                <span className="font-semibold" style={{ color: '#6366F1' }}>{item.retention}</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Резидентов в когорте: {item.clients}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
