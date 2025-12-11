"use client";

import Card from "@/components/Card";
import { DollarSign, TrendingUp } from "lucide-react";

const revenue = [
  { month: "Сентябрь", value: 280000, growth: 8.2 },
  { month: "Октябрь", value: 301000, growth: 7.5 },
  { month: "Ноябрь", value: 312000, growth: 3.6 },
];

const products = [
  { name: "STEAM Lab", abonements: 120, avg: 2600 },
  { name: "Art Kids", abonements: 98, avg: 2400 },
  { name: "Dance junior", abonements: 86, avg: 2100 },
];

export default function KidsRevenuePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Выручка Kids</h1>
      </div>
      <p className="text-sm text-zinc-500">Динамика выручки и показатели по программам.</p>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {revenue.map((item) => (
            <div key={item.month} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.month}</div>
              <div className="text-lg font-semibold mt-1">{item.value.toLocaleString("ru-RU")} ₽</div>
              <div className="flex items-center gap-1 text-xs mt-2" style={{ color: '#10B981' }}>
                <TrendingUp className="h-3 w-3" />
                <span>Рост {item.growth}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--foreground)' }}>Выручка по программам</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {products.map((item) => (
            <div key={item.name} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.name}</div>
              <div className="text-xs text-zinc-500 mt-1">Активных абонементов: {item.abonements}</div>
              <div className="text-xs text-zinc-500">Средний чек: {item.avg} ₽</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
