"use client";

import Card from "@/components/Card";
import Link from "next/link";
import { Building2, Users, CreditCard, Activity, ArrowUpRight, MapPin } from "lucide-react";

const stats = [
  { label: "Текущих резидентов", value: 48, icon: Users, color: "#10B981", href: "/coworking/residents" },
  { label: "Загрузка рабочих мест", value: "71%", icon: Activity, color: "#6366F1", href: "/coworking/places" },
  { label: "Выручка за месяц", value: "1 240 000 ₽", icon: CreditCard, color: "#F59E0B", href: "/coworking/income" },
  { label: "Лояльность клиентов", value: "84%", icon: MapPin, color: "#EF4444", href: "/coworking/clients" },
];

const zones = [
  { name: "Open space", occupied: 32, total: 40, color: "#6366F1" },
  { name: "Переговорки", occupied: 6, total: 8, color: "#F59E0B" },
  { name: "Комнаты Focus", occupied: 7, total: 10, color: "#10B981" },
];

const pipeline = [
  { stage: "Лид", value: 92 },
  { stage: "Тур", value: 38 },
  { stage: "Подписано", value: 24 },
];

const quickLinks = [
  { title: "Места", subtitle: "Зоны, статусы занятости", href: "/coworking/places" },
  { title: "Резиденты", subtitle: "Контракты, оплаты, учет бронирований", href: "/coworking/residents" },
  { title: "Доход", subtitle: "Выручка и загрузка по дням", href: "/coworking/income" },
  { title: "Клиенты", subtitle: "Посещаемость сегментов, удержание", href: "/coworking/clients" },
];

export default function CoworkingOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-zinc-500">EYWA COWORKING</div>
        <h1 className="text-2xl font-semibold mt-1">Резиденты и рабочие места</h1>
        <p className="text-sm text-zinc-500 mt-1">Контролируйте загрузку, брони и оплату коворкинга.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <Card className="h-full transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: item.color + "20", color: item.color }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.label}</div>
                </div>
                <div className="text-2xl font-semibold">{item.value}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Загрузка зон</div>
          </div>
          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone.name} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{zone.name}</div>
                  <div className="text-sm" style={{ color: zone.color }}>{zone.occupied}/{zone.total}</div>
                </div>
                <div className="h-2.5 w-full rounded-full" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(zone.occupied/zone.total)*100}%`, background: zone.color }} />
                </div>
                <div className="text-xs text-zinc-500 mt-1">Свободно {zone.total - zone.occupied} мест</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Воронка резидентов</div>
          </div>
          <div className="space-y-3">
            {pipeline.map((step, idx) => (
              <div key={step.stage} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--foreground)' }}>{idx + 1}. {step.stage}</span>
                  <span className="font-semibold" style={{ color: '#10B981' }}>{step.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Быстрые операции</div>
            <p className="text-xs text-zinc-500 mt-1">Управление тарифами, резидентами и платежами.</p>
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
