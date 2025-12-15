"use client";

import { useState, useMemo, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import DateRangePicker from "@/components/DateRangePicker";
import {
  Instagram,
  Send,
  Clock,
  UserRound,
  Filter,
  Loader2,
  AlertCircle,
  MessageSquare,
  Search,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowUpDown,
  MoreVertical,
} from "lucide-react";
import { fetchApplicationsFromApi } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";

export const STAGES = [
  { id: "inquiry", label: "Спросили цену", tone: "muted" },
  { id: "trial", label: "Записались на пробный", tone: "focus" },
  { id: "sale", label: "Оплатили абонемент", tone: "success" },
];

export const TONE_PRESETS = {
  muted: {
    tagBg: "#EF4444",
    tagColor: "#FFFFFF",
    gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))",
  },
  focus: {
    tagBg: "#6366F1",
    tagColor: "#FFFFFF",
    gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05))",
  },
  success: {
    tagBg: "#10B981",
    tagColor: "#FFFFFF",
    gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))",
  },
} satisfies Record<
  (typeof STAGES)[number]["tone"],
  { tagBg: string; tagColor: string; gradient: string }
>;

export const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    accent: "#F97316",
    icon: <Instagram className="h-4 w-4" />,
    stats: { today: 12, total: 138 },
  },
  {
    id: "telegram",
    name: "Telegram",
    accent: "#60A5FA",
    icon: <Send className="h-4 w-4" />,
    stats: { today: 8, total: 94 },
  },
];

export type Lead = {
  id: string;
  name: string;
  username: string;
  message: string;
  budget: string;
  owner: string;
  lastActivity: string;
  platform: "instagram" | "telegram";
  platformName: string;
  platformAccent: string;
  platformIcon: React.ReactNode;
  stage?: string;
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(["instagram", "telegram"]));
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });
  const [applications, setApplications] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Загружаем заявки с бекенда
  useEffect(() => {
    const controller = new AbortController();
    async function loadApplications() {
      try {
        setLoading(true);
        const data = await fetchApplicationsFromApi<any>({}, { signal: controller.signal });
        
        // Преобразуем данные в формат Lead
        const leads: Lead[] = data.map((app: any) => {
          const platformIcon = app.platform === "instagram" 
            ? <Instagram className="h-4 w-4" />
            : <Send className="h-4 w-4" />;
          
          const platformName = app.platformName || app.platform_name || (app.platform === "instagram" ? "Instagram" : "Telegram");
          const platformAccent = app.platformAccent || app.platform_accent || (app.platform === "instagram" ? "#F97316" : "#60A5FA");
          const lastActivity = app.lastActivity || app.last_activity || "недавно";
          
          return {
            id: app.id,
            name: app.name || "Клиент",
            username: app.username || `@${(app.name || "client").toLowerCase().replace(/\s+/g, '_')}`,
            message: app.message || "—",
            budget: app.budget || "—",
            owner: app.owner || "CRM-бот",
            lastActivity: lastActivity,
            platform: app.platform || "telegram",
            platformName: platformName,
            platformAccent: platformAccent,
            platformIcon: platformIcon,
            stage: app.stage || "inquiry",
          };
        });
        
        setApplications(leads);
        setError(null);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") {
          return;
        }
        const errorMessage = (err as Error).message || "Неизвестная ошибка";
        if (errorMessage.includes("подключиться к серверу") || errorMessage.includes("CONNECTION")) {
          setError("Бекенд недоступен. Убедитесь, что сервер запущен на http://localhost:8000");
        } else {
          setError(`Не удалось загрузить данные: ${errorMessage}`);
        }
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
    return () => controller.abort();
  }, []);

  // Фильтруем заявки по выбранным платформам
  const allLeads = useMemo(() => {
    return applications.filter((lead) => selectedPlatforms.has(lead.platform));
  }, [applications, selectedPlatforms]);

  // Фильтруем по поисковому запросу
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return allLeads;
    const query = searchQuery.toLowerCase();
    return allLeads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.username.toLowerCase().includes(query) ||
        lead.message.toLowerCase().includes(query)
    );
  }, [allLeads, searchQuery]);

  // Статистика
  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const completed = filteredLeads.filter((lead) => lead.stage === "sale").length;
    const conversionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";
    const lastMonth = Math.floor(total * 0.85); // Примерное значение для демонстрации
    const growth = total > 0 ? (((total - lastMonth) / lastMonth) * 100).toFixed(1) : "0";
    
    return {
      total,
      completed,
      conversionRate,
      growth,
    };
  }, [filteredLeads]);

  const leadsByStage = useMemo(() => {
    const result: Record<string, Lead[]> = {
      inquiry: [],
      trial: [],
      sale: [],
    };
    filteredLeads.forEach((lead) => {
      if (lead.stage) {
        result[lead.stage].push(lead);
      }
    });
    return result;
  }, [filteredLeads]);

  if (loading) {
  return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--foreground)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
              <AlertCircle className="h-5 w-5" style={{ color: "#EF4444" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Ошибка загрузки</p>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: '#fff',
                }}
              >
                Обновить страницу
              </button>
            </div>
          </div>
        </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                  <Users className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#EF4444" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--muted-foreground)" }}>Всего заявок</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.total}</p>
              <div className="flex items-center gap-1 text-xs md:text-sm flex-wrap">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4" style={{ color: "#10B981" }} />
                <span style={{ color: "#10B981" }}>+{stats.growth}%</span>
                <span className="hidden sm:inline" style={{ color: "var(--muted-foreground)" }}>от прошлого месяца</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#10B981" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--muted-foreground)" }}>Конверсия</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.conversionRate}%</p>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Завершено: {stats.completed}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99, 102, 241, 0.1)" }}>
                  <Instagram className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#6366F1" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--muted-foreground)" }}>Instagram</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                {filteredLeads.filter((l) => l.platform === "instagram").length}
              </p>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Заявки</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(96, 165, 250, 0.1)" }}>
                  <Send className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#60A5FA" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--muted-foreground)" }}>Telegram</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                {filteredLeads.filter((l) => l.platform === "telegram").length}
              </p>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Заявки</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Overview Card */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg md:text-xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>Обзор заявок</h2>
            <p className="text-xs md:text-sm" style={{ color: "var(--muted-foreground)" }}>Статистика по стадиям обработки</p>
          </div>
          <button className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors flex-shrink-0 ml-2">
            <MoreVertical className="h-4 w-4" style={{ color: "var(--foreground)" }} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {STAGES.map((stage) => {
            const leads = leadsByStage[stage.id] ?? [];
            const tone = TONE_PRESETS[stage.tone as keyof typeof TONE_PRESETS];
            const percentage = filteredLeads.length > 0 ? ((leads.length / filteredLeads.length) * 100).toFixed(0) : "0";
            
            return (
              <div
                key={stage.id}
                className="p-3 md:p-4 rounded-xl"
                style={{
                  background: tone.gradient,
                  border: `1px solid ${tone.tagBg}40`,
                }}
              >
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <span className="text-xs md:text-sm font-medium truncate flex-1" style={{ color: "var(--foreground)" }}>{stage.label}</span>
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ml-2"
                    style={{ background: tone.tagBg, color: tone.tagColor }}
                  >
                    {leads.length}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>{percentage}%</p>
                  <p className="text-xs md:text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>{leads.length} заявок</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Table Section */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col gap-3 md:gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-semibold" style={{ color: "var(--foreground)" }}>Заявки</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
              {filteredLeads.length}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-[250px] flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                style={{
                  background: theme === "dark" ? "var(--panel)" : "#FFFFFF",
                  border: "1px solid var(--card-border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            {/* Filter buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => {
                    setSelectedPlatforms((prev) => {
                      const next = new Set(prev);
                      if (next.has(platform.id)) {
                        next.delete(platform.id);
                      } else {
                        next.add(platform.id);
                      }
                      return next;
                    });
                  }}
                  className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-2"
                  style={{
                    border: selectedPlatforms.has(platform.id) ? `1px solid ${platform.accent}` : "1px solid var(--card-border)",
                    background: selectedPlatforms.has(platform.id) ? `${platform.accent}15` : "transparent",
                    color: selectedPlatforms.has(platform.id) ? platform.accent : "var(--foreground)",
                  }}
                >
                  {platform.icon}
                  <span className="hidden sm:inline">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  <div className="flex items-center gap-2">
                    Имя
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  <div className="flex items-center gap-2">
                    Платформа
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  <div className="flex items-center gap-2">
                    Статус
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Сообщение
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  <div className="flex items-center gap-2">
                    Бюджет
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Заявки не найдены</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const stage = STAGES.find((s) => s.id === lead.stage);
                  const tone = stage ? TONE_PRESETS[stage.tone as keyof typeof TONE_PRESETS] : TONE_PRESETS.muted;
                  
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors cursor-pointer"
                      onClick={() => {
                        router.push(`/applications/${lead.id}`);
                      }}
                      style={{ borderBottom: "1px solid var(--card-border)" }}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{lead.name}</p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lead.username}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-6 w-6 rounded flex items-center justify-center"
                            style={{ background: `${lead.platformAccent}15`, color: lead.platformAccent }}
                          >
                            {lead.platformIcon}
                          </span>
                          <span className="text-sm" style={{ color: "var(--foreground)" }}>{lead.platformName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: `${tone.tagBg}20`, color: tone.tagBg }}
                        >
                          {stage?.label || "Неизвестно"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm max-w-xs truncate" style={{ color: "var(--foreground)" }}>{lead.message}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{lead.budget}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <MoreVertical className="h-4 w-4" style={{ color: "var(--foreground)" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Заявки не найдены</p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const stage = STAGES.find((s) => s.id === lead.stage);
              const tone = stage ? TONE_PRESETS[stage.tone as keyof typeof TONE_PRESETS] : TONE_PRESETS.muted;
              
              return (
                <div
                  key={lead.id}
                  className="p-4 rounded-xl cursor-pointer transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                  style={{
                    border: "1px solid var(--card-border)",
                    background: "var(--panel)",
                  }}
                  onClick={() => {
                    router.push(`/applications/${lead.id}`);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${lead.platformAccent}15`, color: lead.platformAccent }}
                        >
                          {lead.platformIcon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{lead.name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{lead.username}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors flex-shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreVertical className="h-4 w-4" style={{ color: "var(--foreground)" }} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Статус</span>
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{ background: `${tone.tagBg}20`, color: tone.tagBg }}
                      >
                        {stage?.label || "Неизвестно"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Сообщение</span>
                      <p className="text-xs text-right max-w-[60%] truncate" style={{ color: "var(--foreground)" }}>{lead.message}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Бюджет</span>
                      <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{lead.budget}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
