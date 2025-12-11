"use client";

import Card from "@/components/Card";
import { Flame, Clock, Users } from "lucide-react";

const peakHours = [
  { slot: "07:00–09:00", guests: 68, tickets: 95 },
  { slot: "12:00–14:00", guests: 112, tickets: 158 },
  { slot: "17:00–19:00", guests: 86, tickets: 121 },
  { slot: "20:00–22:00", guests: 44, tickets: 63 },
];

const stayTime = [
  { label: "< 15 минут", share: "22%" },
  { label: "15–30 минут", share: "48%" },
  { label: "30–45 минут", share: "21%" },
  { label: ">45 минут", share: "9%" },
];

export default function CoffeeActivityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Активность кофейни</h1>
      </div>
      <p className="text-sm text-zinc-500">Пиковые часы, средний поток гостей и время пребывания.</p>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4" />
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Пиковые часы</div>
        </div>
        <div className="space-y-3">
          {peakHours.map((item) => (
            <div key={item.slot} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--foreground)' }}>{item.slot}</span>
                <span className="font-medium" style={{ color: '#F59E0B' }}>{item.guests} гостей</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                <Users className="h-3 w-3" />
                <span>Чеков: {item.tickets}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--foreground)' }}>Время пребывания</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {stayTime.map((item) => (
            <div key={item.label} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.label}</div>
              <div className="text-xs text-zinc-500 mt-1">{item.share} гостей</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
