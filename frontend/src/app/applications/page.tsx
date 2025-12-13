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
} from "lucide-react";
import { fetchApplicationsFromApi } from "@/lib/api";

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

function RequestCard({
  id,
  name,
  username,
  message,
  budget,
  owner,
  lastActivity,
  platformName,
  platformAccent,
  platformIcon,
}: Lead) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/applications/${id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="applications-card"
    >
      <div className="applications-card__header">
        <div className="applications-card__platform">
          <span
            className="applications-card__platform-icon"
            style={{ background: platformAccent + "15", color: platformAccent }}
          >
            {platformIcon}
          </span>
          <span className="applications-card__platform-name" style={{ color: platformAccent }}>
            {platformName}
          </span>
        </div>
        <span className="applications-card__budget">
          {budget}
        </span>
      </div>

      <div className="applications-card__body">
        <div className="applications-card__user">
          <p className="applications-card__name">{name}</p>
          <p className="applications-card__username">{username}</p>
        </div>
        <div className="applications-card__message">
          <MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--muted-foreground)' }} />
          <p>{message}</p>
        </div>
      </div>

      <div className="applications-card__footer">
        <span className="applications-card__meta">
          <UserRound className="h-3.5 w-3.5" />
          {owner}
        </span>
        <span className="applications-card__meta">
          <Clock className="h-3.5 w-3.5" />
          {lastActivity}
        </span>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(["instagram", "telegram"]));
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });
  const [applications, setApplications] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  };

  const leadsByStage = useMemo(() => {
    const result: Record<string, Lead[]> = {
      inquiry: [],
      trial: [],
      sale: [],
    };
    allLeads.forEach((lead) => {
      if (lead.stage) {
        result[lead.stage].push(lead);
      }
    });
    return result;
  }, [allLeads]);

  return (
    <div className="applications-page">
      {/* Фильтры */}
      <div className="applications-filters">
        <div className="applications-filters__left">
          <span className="applications-filters__label">
            <Filter className="h-3.5 w-3.5" />
            Платформы
          </span>
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`applications-filters__platform ${selectedPlatforms.has(platform.id) ? 'applications-filters__platform--active' : ''}`}
              style={selectedPlatforms.has(platform.id) ? {
                borderColor: platform.accent,
                background: platform.accent + "15",
                color: platform.accent,
              } : {}}
            >
              {platform.icon}
              {platform.name}
            </button>
          ))}
        </div>
        <div className="applications-filters__right">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Состояние загрузки */}
      {loading && (
        <div className="body-services__empty">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Загрузка заявок...</p>
        </div>
      )}

      {/* Состояние ошибки */}
      {error && !loading && (
        <Card className="p-6" style={{ background: 'var(--panel)', borderColor: 'var(--card-border)' }}>
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
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                }}
              >
                Обновить страницу
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Канбан доска */}
      {!loading && !error && (
        <div className="applications-kanban">
          {STAGES.map((stage) => {
            const leads = leadsByStage[stage.id] ?? [];
            const tone = TONE_PRESETS[stage.tone as keyof typeof TONE_PRESETS];
            return (
              <div key={stage.id} className="applications-column" style={{ background: tone.gradient }}>
                <div className="applications-column__header">
                  <div className="applications-column__title">
                    <h3>{stage.label}</h3>
                    <p>{leads.length} {leads.length === 1 ? 'заявка' : leads.length < 5 ? 'заявки' : 'заявок'}</p>
                  </div>
                  <span className="applications-column__badge" style={{ background: tone.tagBg, color: tone.tagColor }}>
                    {leads.length}
                  </span>
                </div>
                <div className="applications-column__content">
                  {leads.length ? (
                    leads.map((lead) => <RequestCard key={lead.id} {...lead} />)
                  ) : (
                    <div className="applications-column__empty">
                      <p>Заявок пока нет</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
