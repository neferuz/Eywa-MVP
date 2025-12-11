"use client";

import Card from "@/components/Card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { TrendingUp, Users, DollarSign, Target, Instagram, MessageCircle, UsersRound, Search } from "lucide-react";

const channels = [
  { channel: "Instagram", leads: 120, conv: 0.12, cpl: 180, roi: 1.8, icon: Instagram, color: "#E4405F" },
  { channel: "Telegram", leads: 80, conv: 0.10, cpl: 150, roi: 1.6, icon: MessageCircle, color: "#0088CC" },
  { channel: "Рекомендации", leads: 60, conv: 0.25, cpl: 50, roi: 3.4, icon: UsersRound, color: "#10B981" },
  { channel: "Google", leads: 90, conv: 0.08, cpl: 220, roi: 1.2, icon: Search, color: "#4285F4" },
];

const leadsTrend = [
  { name: "Пн", value: 24 },
  { name: "Вт", value: 30 },
  { name: "Ср", value: 28 },
  { name: "Чт", value: 35 },
  { name: "Пт", value: 38 },
  { name: "Сб", value: 45 },
  { name: "Вс", value: 32 },
];

const getROIColor = (roi: number) => {
  if (roi >= 2.5) return "#10B981";
  if (roi >= 1.5) return "#F59E0B";
  return "#EF4444";
};

const getConvColor = (conv: number) => {
  if (conv >= 0.2) return "#10B981";
  if (conv >= 0.1) return "#F59E0B";
  return "#EF4444";
};

const totalLeads = channels.reduce((sum, ch) => sum + ch.leads, 0);
const avgConv = channels.reduce((sum, ch) => sum + ch.conv, 0) / channels.length;
const avgCPL = channels.reduce((sum, ch) => sum + ch.cpl, 0) / channels.length;
const avgROI = channels.reduce((sum, ch) => sum + ch.roi, 0) / channels.length;

export default function MarketingTrafficPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">EYWA MARKETING · Источники заявок</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Всего лидов</div>
          </div>
          <div className="text-2xl font-semibold">{totalLeads}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <Target className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средняя конверсия</div>
          </div>
          <div className="text-2xl font-semibold">{(avgConv * 100).toFixed(1)}%</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B' + "20", color: '#F59E0B' }}>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средний CPL</div>
          </div>
          <div className="text-2xl font-semibold">{Math.round(avgCPL)} ₽</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Средний ROI</div>
          </div>
          <div className="text-2xl font-semibold">{avgROI.toFixed(2)}</div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Каналы привлечения</div>
        <div className="space-y-3">
          {channels.map((row) => {
            const Icon = row.icon;
            const roiColor = getROIColor(row.roi);
            const convColor = getConvColor(row.conv);
            return (
              <div
                key={row.channel}
                className="flex items-center gap-4 p-3 rounded-lg"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: row.color + "20", color: row.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium">{row.channel}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-zinc-500" />
                        <span className="text-zinc-500">{row.leads} лидов</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" style={{ color: convColor }} />
                        <span className="font-medium" style={{ color: convColor }}>{(row.conv * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500">CPL: </span>
                      <span className="font-medium">{row.cpl.toLocaleString("ru-RU")} ₽</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" style={{ color: roiColor }} />
                      <span className="font-medium" style={{ color: roiColor }}>ROI: {row.roi.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ background: roiColor + "20" }}>
                    <span className="text-lg font-bold" style={{ color: roiColor }}>{row.roi.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Стоимость лида (CPL)</div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full" style={{ background: '#6366F1' }} />
              <span className="text-zinc-500">CPL</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channels} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="channel" stroke="currentColor" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="cpl" name="CPL" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="mb-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Тренд по лидам</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="marketingTrafficLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 12 }} />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#marketingTrafficLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}


