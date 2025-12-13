"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import {
  Instagram,
  Send,
  Clock,
  UserRound,
  MessageSquare,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { fetchApplicationsFromApi } from "@/lib/api";
import Link from "next/link";

const STAGES = [
  { id: "inquiry", label: "Спросили цену", tone: "muted" },
  { id: "trial", label: "Записались на пробный", tone: "focus" },
  { id: "sale", label: "Оплатили абонемент", tone: "success" },
];

const TONE_PRESETS = {
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
} as const;

type Lead = {
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

function LeadCard({
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
      style={{ cursor: "pointer" }}
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

export default function LeadsKanban() {
  const [applications, setApplications] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadApplications() {
      try {
        setLoading(true);
        // Загружаем только Instagram и Telegram лиды
        const data = await fetchApplicationsFromApi<any>(
          { platform: undefined }, // Все платформы
          { signal: controller.signal }
        );
        
        // Фильтруем только Instagram и Telegram
        const filteredData = data.filter((app: any) => 
          app.platform === "instagram" || app.platform === "telegram"
        );
        
        // Преобразуем данные в формат Lead
        const leads: Lead[] = filteredData.map((app: any) => {
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
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") {
          return;
        }
        console.error("Failed to load applications:", err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
    return () => controller.abort();
  }, []);

  // Фильтруем только Instagram и Telegram
  const allLeads = useMemo(() => {
    return applications.filter((lead) => 
      lead.platform === "instagram" || lead.platform === "telegram"
    );
  }, [applications]);

  // Группируем по стадиям
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

  // Считаем новые лиды (за сегодня)
  const newLeadsToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allLeads.filter((lead: any) => {
      // Проверяем по created_at, если оно есть
      if (lead.createdAt || lead.created_at) {
        const createdDate = new Date(lead.createdAt || lead.created_at);
        return createdDate >= today;
      }
      // Иначе проверяем по lastActivity
      const lastActivity = lead.lastActivity?.toLowerCase() || "";
      return lastActivity.includes("только что") || 
             lastActivity.includes("мин") ||
             (lastActivity.includes("ч") && !lastActivity.includes("Вчера"));
    }).length;
  }, [allLeads]);

  // Статистика по платформам
  const instagramCount = useMemo(() => 
    allLeads.filter(l => l.platform === "instagram").length,
    [allLeads]
  );
  const telegramCount = useMemo(() => 
    allLeads.filter(l => l.platform === "telegram").length,
    [allLeads]
  );

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Канбан лидов</div>
          </div>
          <p className="text-xs text-zinc-500">Instagram и Telegram конвейер в одном экране</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: '#F97316' + "15" }}>
              <Instagram className="h-3.5 w-3.5" style={{ color: '#F97316' }} />
              <span className="text-xs font-medium" style={{ color: '#F97316' }}>{instagramCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: '#60A5FA' + "15" }}>
              <Send className="h-3.5 w-3.5" style={{ color: '#60A5FA' }} />
              <span className="text-xs font-medium" style={{ color: '#60A5FA' }}>{telegramCount}</span>
            </div>
          </div>
          {newLeadsToday > 0 && (
            <div className="px-3 py-1 rounded-lg" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <span className="text-xs font-semibold">+{newLeadsToday} новых</span>
            </div>
          )}
          <Link 
            href="/applications" 
            className="text-xs flex items-center gap-1 text-zinc-500 hover:text-foreground transition-colors"
          >
            Все заявки <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="applications-kanban" style={{ maxHeight: "600px", overflowY: "auto" }}>
        {STAGES.map((stage) => {
          const leads = leadsByStage[stage.id] ?? [];
          const tone = TONE_PRESETS[stage.tone as keyof typeof TONE_PRESETS];
          // Показываем только первые 5 лидов в каждой колонке
          const displayedLeads = leads.slice(0, 5);
          
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
                {displayedLeads.length ? (
                  displayedLeads.map((lead) => <LeadCard key={lead.id} {...lead} />)
                ) : (
                  <div className="applications-column__empty">
                    <p>Заявок пока нет</p>
                  </div>
                )}
                {leads.length > 5 && (
                  <div className="mt-3 text-center">
                    <Link 
                      href="/applications" 
                      className="text-xs text-zinc-500 hover:text-foreground transition-colors"
                    >
                      +{leads.length - 5} еще
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

