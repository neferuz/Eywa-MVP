"use client";

import Card from "@/components/Card";
import { ArrowRightLeft, Layers, Database, Plug } from "lucide-react";

const integrations = [
  {
    title: "Выручка и расходы",
    from: ["Body", "Coffee", "Coworking", "Kids"],
    to: "Finance",
    description: "Передача продаж, себестоимости и расходов для P&L и Cash Flow.",
  },
  {
    title: "Маркетинг → AI Insights",
    from: ["Marketing"],
    to: "AI Insights",
    description: "ROI, источники лидов и воронка используются для рекомендаций и прогнозов.",
  },
  {
    title: "Staff → Finance",
    from: ["Staff"],
    to: "Finance",
    description: "ФОТ, бонусы и выплаты попадают в отчёт затрат и Cash Flow.",
  },
  {
    title: "Staff ↔ Body / Coffee",
    from: ["Staff"],
    to: "Body + Coffee",
    description: "Графики и смены синхронизируются с расписанием студии и планом бариста.",
  },
  {
    title: "Dashboard",
    from: ["Finance", "Marketing", "Body", "Coffee", "Coworking", "Kids", "Staff", "AI Insights"],
    to: "Dashboard",
    description: "Агрегированные показатели для собственника и ежедневного мониторинга.",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-zinc-500">EYWA CORE</div>
        <h1 className="text-2xl font-semibold mt-1">Интеграции модулей</h1>
        <p className="text-sm text-zinc-500 mt-1">Как данные перетекают между модулями EYWA SPACE.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => (
          <Card key={item.title}>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="h-4 w-4" />
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.title}</div>
            </div>
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Источники</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {item.from.map((module) => (
                <span key={module} className="px-2 py-1 text-xs rounded" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                  {module}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 mb-2">
              <Plug className="h-3 w-3" />
              → {item.to}
            </div>
            <div className="text-sm" style={{ color: 'var(--foreground)' }}>{item.description}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4" />
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Обмен данными</div>
        </div>
        <p className="text-sm text-zinc-500">
          Модули EYWA используют единый справочник клиентов и сотрудников. Финансовые показатели формируются на основе продаж из Body, Coffee, Coworking и Kids, а также на основе ФОТ из Staff. AI Insights объединяет все данные, чтобы предлагать действия с наибольшим влиянием.
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4" />
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Последовательность обновления</div>
        </div>
        <ol className="list-decimal list-inside text-sm space-y-1 text-zinc-500">
          <li>Операционные модули (Body, Coffee, Coworking, Kids) фиксируют продажи и посещения.</li>
          <li>Staff синхронизирует смены и ФОТ, обновляя расходы.</li>
          <li>Finance собирает выручку, затраты и формирует P&L и Cash Flow.</li>
          <li>Marketing и AI Insights анализируют конверсии, ROI и выдают рекомендации.</li>
          <li>Dashboard показывает агрегированные KPI в реальном времени.</li>
        </ol>
      </Card>
    </div>
  );
}
