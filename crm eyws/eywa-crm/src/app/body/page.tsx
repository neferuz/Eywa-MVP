"use client";

import Card from "@/components/Card";
import Link from "next/link";
import {
  Activity,
  Calendar,
  Dumbbell,
  Users,
  Package2,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";

const snapshot = [
  { label: "Активных услуг", value: 18, icon: Package2, color: "#6366F1", href: "/body/services" },
  { label: "Загрузка студии", value: "78%", icon: Activity, color: "#10B981", href: "/body/schedule" },
  { label: "Абонементы", value: "412 действуют", icon: Calendar, color: "#F59E0B", href: "/body/subscriptions" },
  { label: "Клиенты Body", value: "1 240", icon: Users, color: "#EF4444", href: "/body/clients" },
];

const classMix = [
  { name: "Йога", share: 42, color: "#6366F1" },
  { name: "Пилатес", share: 31, color: "#10B981" },
  { name: "Растяжка", share: 17, color: "#F59E0B" },
  { name: "HIIT", share: 10, color: "#EF4444" },
];

const topCoaches = [
  { name: "Елена", sessions: 36, satisfaction: "4.9", direction: "Йога" },
  { name: "Дмитрий", sessions: 32, satisfaction: "4.8", direction: "Пилатес" },
  { name: "Анна", sessions: 28, satisfaction: "4.7", direction: "Стретчинг" },
];

const quickLinks = [
  { title: "Каталог услуг", subtitle: "Создание и редактирование направлений", href: "/body/services" },
  { title: "Расписание", subtitle: "Управление слотами и тренерами", href: "/body/schedule" },
  { title: "Абонементы", subtitle: "Тарифы, остатки, автопродления", href: "/body/subscriptions" },
  { title: "Клиентская база", subtitle: "Посещаемость, удержание, сегменты", href: "/body/clients" },
];

export default function BodyOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-zinc-500">EYWA BODY</div>
        <h1 className="text-2xl font-semibold mt-1">Студия Body & Mind</h1>
        <p className="text-sm text-zinc-500 mt-1">Контролируйте услуги, расписание, абонементы и клиентскую базу в одном месте.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {snapshot.map((item) => {
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Микс направлений</div>
              <p className="text-xs text-zinc-500 mt-1">Доля броней по основным классам за неделю.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classMix.map((item) => (
              <div key={item.name} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.name}</span>
                  <span className="text-sm font-semibold" style={{ color: item.color }}>{item.share}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.share}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Топ-тренеры</div>
          </div>
          <div className="space-y-3">
            {topCoaches.map((coach) => (
              <div key={coach.name} className="p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{coach.name}</div>
                  <div className="text-xs text-zinc-500">{coach.direction}</div>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <div>{coach.sessions} занятий</div>
                  <div>Оценка {coach.satisfaction}</div>
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
            <p className="text-xs text-zinc-500 mt-1">Управление операциями Body & Mind.</p>
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
