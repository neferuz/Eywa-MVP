"use client";

import Card from "@/components/Card";
import Link from "next/link";
import {
  Coffee,
  DollarSign,
  Clock,
  Users,
  Flame,
  LineChart,
  ArrowUpRight,
} from "lucide-react";

const kpi = [
  { label: "Выручка за неделю", value: "482 000 ₽", trend: "+9.2%", color: "#F59E0B" },
  { label: "Средний чек", value: "480 ₽", trend: "+2.1%", color: "#10B981" },
  { label: "Заказов в день", value: "215", trend: "+12", color: "#6366F1" },
];

const peakHours = [
  { slot: "08:00-10:00", load: 68 },
  { slot: "12:00-14:00", load: 94 },
  { slot: "16:00-18:00", load: 81 },
  { slot: "18:00-20:00", load: 64 },
];

const bestSellers = [
  { product: "Латте", share: "24%", amount: "12 450 ₽" },
  { product: "Фирменный раф", share: "18%", amount: "9 520 ₽" },
  { product: "Матча", share: "11%", amount: "5 980 ₽" },
];

const quickLinks = [
  { title: "Продажи", subtitle: "Средний чек, AOV, повторные заказы", href: "/coffee/sales" },
  { title: "Активность", subtitle: "Пиковые часы, поток гостей", href: "/coffee/activity" },
  { title: "KPI и эффективность", subtitle: "Команда бариста, фокус месяца", href: "/coffee/kpi" },
  { title: "Интеграция с Finance", subtitle: "Выручка попадает в P&L", href: "/finance" },
];

export default function CoffeeOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-zinc-500">EYWA COFFEE</div>
        <h1 className="text-2xl font-semibold mt-1">Кофейня & бар Sweet Spot</h1>
        <p className="text-sm text-zinc-500 mt-1">Выручка, операционная активность и эффективная работа бариста.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpi.map((item) => (
          <Card key={item.label}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.label}</div>
              <span className="text-xs font-medium" style={{ color: item.color }}>{item.trend}</span>
            </div>
            <div className="text-2xl font-semibold">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Топовые позиции</div>
          </div>
          <div className="space-y-3">
            {bestSellers.map((item) => (
              <div key={item.product} className="p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.product}</div>
                  <div className="text-xs text-zinc-500">Доля продаж {item.share}</div>
                </div>
                <div className="text-sm font-semibold" style={{ color: '#F59E0B' }}>{item.amount}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Пиковые часы</div>
          </div>
          <div className="space-y-3">
            {peakHours.map((item) => (
              <div key={item.slot}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{item.slot}</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{item.load}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.load}%`, background: '#F59E0B' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Быстрые переходы</div>
            <p className="text-xs text-zinc-500 mt-1">Продажи, активность, бариста и себестоимость.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="p-4 rounded-xl border transition-colors hover:border-foreground/30" style={{ borderColor: 'var(--card-border)' }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.title}</div>
                <div className="text-xs text-zinc-500 mt-1">{item.subtitle}</div>
                <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
                  Перейти <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
