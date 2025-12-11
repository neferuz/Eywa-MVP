"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import {
  Bot,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Coffee,
  DollarSign,
  Users,
  Workflow,
  AlertCircle,
  Gauge,
} from "lucide-react";

const recommendations = [
  {
    id: 1,
    title: "Усилить кофейню в часы пик",
    summary: "Смена бариста 12–14 покрывает только 68% заказов.",
    category: "Операции",
    icon: Coffee,
    color: "#F59E0B",
    priority: "Высокий",
    details:
      "В кофейне в будни с 12:00 до 14:00 среднее время ожидания выросло до 6 минут. Добавьте подмену бариста и предложите готовые наборы 'латте+снэк'. Это поднимет выручку на ~18% и сократит очереди.",
  },
  {
    id: 2,
    title: "Перестроить маркетинговый бюджет",
    summary: "ROI рекомендаций превышает Google Ads в 2.3 раза.",
    category: "Маркетинг",
    icon: DollarSign,
    color: "#10B981",
    priority: "Средний",
    details:
      "Коэффициент конверсии из рекомендаций — 34%, стоимость лида 48 ₽. Перераспределение 25% бюджета из Google в реферальные акции даст +420 новых клиентов до конца месяца.",
  },
  {
    id: 3,
    title: "Вернуть Retention Body",
    summary: "Повторные визиты упали с 78% до 65%.",
    category: "Удержание",
    icon: Users,
    color: "#EF4444",
    priority: "Высокий",
    details:
      "Падение связано с отсутствием бонусов после 8 занятий. Запустите программу '11-е занятие в подарок' и персональные звонки клиентам с перерывом >21 день.",
  },
  {
    id: 4,
    title: "Заполнить вечерний Coworking",
    summary: "После 19:00 занято 42% мест против цели 65%.",
    category: "Продажи",
    icon: Workflow,
    color: "#6366F1",
    priority: "Средний",
    details:
      "Предложите вечерние тарифы 'After 19:00' с фиксированной ценой и партнёрские мероприятия (meetup по средам). Прогнозируемый рост загрузки — до 60%.",
  },
];

const overviewCards = [
  { label: "Активных рекомендаций", value: recommendations.length, icon: Sparkles, color: "#6366F1" },
  { label: "Прогноз загрузки на 7 дней", value: "87%", icon: Gauge, color: "#10B981" },
  { label: "Задач высокого приоритета", value: recommendations.filter((r) => r.priority === "Высокий").length, icon: AlertCircle, color: "#EF4444" },
];

const priorities = [
  {
    id: "P-01",
    action: "COFFEE · Увеличить смену бариста",
    impact: "+18% выручка",
    due: "Сегодня",
    owner: "Менеджер Coffee",
    color: "#F59E0B",
  },
  {
    id: "P-02",
    action: "MARKETING · Перенос 25% бюджета",
    impact: "+420 лидов",
    due: "До 15 ноября",
    owner: "Head of Marketing",
    color: "#10B981",
  },
  {
    id: "P-03",
    action: "BODY · Запуск retention-кампании",
    impact: "LTV +12%",
    due: "На этой неделе",
    owner: "Руководитель Body",
    color: "#EF4444",
  },
];

export default function AIPage() {
  const [openId, setOpenId] = useState<number | null>(null);
  const selectedRec = useMemo(() => recommendations.find((r) => r.id === openId), [openId]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" style={{ color: '#6366F1' }} />
            <h1 className="text-2xl font-semibold">AI Insights</h1>
          </div>
          <p className="text-sm text-zinc-500 mt-1">Рекомендации, прогнозы и задачи, которые влияют на прибыль EYWA SPACE.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: item.color + "20", color: item.color }}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.label}</div>
              </div>
              <div className="text-2xl font-semibold">{item.value}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Рекомендации</div>
            <p className="text-xs text-zinc-500 mt-1">AI анализирует данные по продажам, загрузке и retention.</p>
          </div>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const Icon = rec.icon;
            return (
              <div key={rec.id} className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: rec.color + "20", color: rec.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: rec.color }}>{rec.category}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/30">{rec.priority}</span>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{rec.title}</div>
                    <div className="text-xs text-zinc-500 mt-1 max-w-xl">{rec.summary}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:self-end">
                  <button className="btn-outline text-xs" onClick={() => setOpenId(rec.id)}>Подробнее</button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Приоритеты</div>
            <p className="text-xs text-zinc-500 mt-1">Фокус на задачах, которые влияют на прибыль, клиентов и эффективность.</p>
          </div>
        </div>
        <div className="space-y-3">
          {priorities.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.action}</div>
              </div>
              <div className="text-sm text-zinc-500">{item.impact}</div>
              <div className="text-sm text-zinc-500">Срок: {item.due}</div>
              <div className="text-sm text-zinc-500">Ответственный: {item.owner}</div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={openId !== null} onClose={() => setOpenId(null)} title="AI-рекомендация">
        {selectedRec && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: selectedRec.color + "20", color: selectedRec.color }}>
                <selectedRec.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedRec.category}</div>
                <div className="text-xs text-zinc-500">Рекомендация #{selectedRec.id}</div>
              </div>
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{selectedRec.title}</div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
              <div className="text-sm leading-6" style={{ color: 'var(--foreground)' }}>{selectedRec.details}</div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button className="btn-outline flex-1" onClick={() => setOpenId(null)}>
                Закрыть
              </button>
              <button className="btn-outline flex-1" style={{ background: selectedRec.color + "20", color: selectedRec.color, borderColor: selectedRec.color }}>
                Добавить в план
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


