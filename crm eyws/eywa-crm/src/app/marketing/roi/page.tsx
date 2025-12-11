"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Plus, TrendingUp, DollarSign, Users, Target, Award } from "lucide-react";

type ROISource = {
  id: string;
  name: string;
  spent: number;
  clients: number;
  revenue: number;
  roi: number;
};

const MOCK: ROISource[] = [
  { id: "r1", name: "Instagram", spent: 50000, clients: 25, revenue: 150000, roi: 200 },
  { id: "r2", name: "Telegram", spent: 30000, clients: 18, revenue: 90000, roi: 200 },
  { id: "r3", name: "Google", spent: 80000, clients: 20, revenue: 100000, roi: 25 },
  { id: "r4", name: "Рекомендации", spent: 5000, clients: 15, revenue: 75000, roi: 1400 },
];

const TOP_CAMPAIGNS = [
  { name: "Акция на абонемент", roi: 350, revenue: 200000 },
  { name: "Новогодняя скидка", roi: 280, revenue: 180000 },
  { name: "Пригласи друга", roi: 420, revenue: 150000 },
];

export default function MarketingROIPage() {
  const [open, setOpen] = useState(false);

  const totalSpent = MOCK.reduce((sum, s) => sum + s.spent, 0);
  const totalClients = MOCK.reduce((sum, s) => sum + s.clients, 0);
  const totalRevenue = MOCK.reduce((sum, s) => sum + s.revenue, 0);
  const avgROI = MOCK.reduce((sum, s) => sum + s.roi, 0) / MOCK.length;

  const chartData = MOCK.map(s => ({
    name: s.name,
    roi: s.roi,
  }));

  const getROIColor = (roi: number) => {
    if (roi >= 200) return "#10B981";
    if (roi >= 100) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA MARKETING · ROI и эффективность</h1>
        <button className="btn-outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Задать бюджет
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Потрачено</div>
          </div>
          <div className="text-2xl font-semibold">{totalSpent.toLocaleString("ru-RU")} ₽</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Привлечено клиентов</div>
          </div>
          <div className="text-2xl font-semibold">{totalClients}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Выручка</div>
          </div>
          <div className="text-2xl font-semibold">{totalRevenue.toLocaleString("ru-RU")} ₽</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <Target className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средний ROI</div>
          </div>
          <div className="text-2xl font-semibold">{Math.round(avgROI)}%</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>ROI по источникам</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="roi" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>ТОП кампании месяца</div>
          <div className="space-y-3">
            {TOP_CAMPAIGNS.map((campaign, idx) => {
              const roiColor = getROIColor(campaign.roi);
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl flex items-center justify-between"
                  style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center font-semibold text-sm" style={{ background: roiColor + "20", color: roiColor }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{campaign.name}</div>
                      <div className="text-xs text-zinc-500">{campaign.revenue.toLocaleString("ru-RU")} ₽</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: roiColor }}>ROI {campaign.roi}%</div>
                    <div className="text-xs text-zinc-500">vs прошлый период: +{Math.round(campaign.roi * 0.15)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Таблица ROI</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Источник</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Потрачено</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Клиенты</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Выручка</th>
                <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>ROI</th>
                <th className="py-3" style={{ color: 'var(--foreground)' }}>Динамика</th>
              </tr>
            </thead>
            <tbody>
              {MOCK.map((source) => {
                const roiColor = getROIColor(source.roi);
                const comparison = Math.round(source.roi * 0.1);
                return (
                  <tr key={source.id} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-3 pr-4">
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>{source.name}</span>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{source.spent.toLocaleString("ru-RU")} ₽</td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{source.clients}</td>
                    <td className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>{source.revenue.toLocaleString("ru-RU")} ₽</td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold" style={{ color: roiColor }}>{source.roi}%</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs text-green-500">+{comparison}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Задать рекламный бюджет">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Источник</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option value="">Выберите источник</option>
                <option>Instagram</option>
                <option>Telegram</option>
                <option>Google</option>
                <option>Рекомендации</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Бюджет (₽)</label>
              <input
                type="number"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Период</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option>Неделя</option>
                <option>Месяц</option>
                <option>Квартал</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Ожидаемая конверсия (%)</label>
              <input
                type="number"
                step="0.01"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn-outline flex-1" onClick={() => setOpen(false)}>
              Отмена
            </button>
            <button
              className="btn-outline flex-1"
              style={{ background: '#10B981' + "20", color: '#10B981', borderColor: '#10B981' }}
              onClick={() => setOpen(false)}
            >
              Сохранить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


