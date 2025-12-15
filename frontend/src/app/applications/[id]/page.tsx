"use client";

import { use, useState, useEffect } from "react";
import Card from "@/components/Card";
import Link from "next/link";
import { ArrowLeft, Clock, UserRound, MessageSquare, DollarSign, ExternalLink, Instagram, Send, Bot, User } from "lucide-react";
import { STAGES, TONE_PRESETS } from "../page";
import { fetchApplicationByIdFromApi } from "@/lib/api";

type ApplicationData = {
  id: string;
  name: string;
  username: string | null;
  phone: string | null;
  platform: "instagram" | "telegram";
  platformName: string;
  platformAccent: string;
  stage: "inquiry" | "trial" | "sale";
  stageLabel: string;
  message: string;
  budget: string | null;
  owner: string;
  lastActivity: string;
  chatHistory: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }> | null;
};

type PageProps = { params: Promise<{ id: string }> };

export default function ApplicationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Загружаем заявку и периодически обновляем для получения новой истории
  useEffect(() => {
    let isMounted = true;
    
    async function loadApplication(silent = false) {
      try {
        if (!silent) {
          setLoading(true);
        }
        const data = await fetchApplicationByIdFromApi<any>(id);
        if (!isMounted) return;
        
        if (data) {
          // Преобразуем данные, обрабатывая оба формата (camelCase и snake_case)
          // Важно: бекенд возвращает chat_history (snake_case), а не chatHistory
          const chatHistoryData = data.chatHistory || data.chat_history;
          
          const transformedData: ApplicationData = {
            id: data.id,
            name: data.name,
            username: data.username,
            phone: data.phone,
            platform: data.platform,
            platformName: data.platformName || data.platform_name,
            platformAccent: data.platformAccent || data.platform_accent,
            stage: data.stage,
            stageLabel: data.stageLabel || data.stage_label,
            message: data.message,
            budget: data.budget,
            owner: data.owner,
            lastActivity: data.lastActivity || data.last_activity,
            chatHistory: Array.isArray(chatHistoryData) ? chatHistoryData : (chatHistoryData ? [chatHistoryData] : []),
          };
          
          // Обновляем только если данные изменились, чтобы избежать мерцания
          setApplication((prev) => {
            if (!prev || prev.chatHistory?.length !== transformedData.chatHistory?.length) {
              return transformedData;
            }
            return prev;
          });
        } else {
          setError("Заявка не найдена");
        }
      } catch (err) {
        if (!isMounted) return;
        if (!silent) {
          setError("Не удалось загрузить заявку");
        }
      } finally {
        if (isMounted && !silent) {
          setLoading(false);
        }
      }
    }
    
    // Первая загрузка
    loadApplication(false);
    
    // Обновляем историю каждые 5 секунд тихо (без показа loading)
    const interval = setInterval(() => {
      if (!error) {
        loadApplication(true); // silent update
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id, error]);

  // Проверяем, печатает ли бот (если последнее сообщение от пользователя)
  useEffect(() => {
    if (!application?.chatHistory || application.chatHistory.length === 0) {
      setIsTyping(false);
      return;
    }
    
    const lastMessage = application.chatHistory[application.chatHistory.length - 1];
    if (lastMessage.role === "user") {
      // Если последнее сообщение от пользователя, бот может печатать
      setIsTyping(true);
      // Сбрасываем через 15 секунд, если нет нового сообщения от бота
      const timeout = setTimeout(() => setIsTyping(false), 15000);
      return () => clearTimeout(timeout);
    } else {
      // Если последнее сообщение от бота, он не печатает
      setIsTyping(false);
    }
  }, [application?.chatHistory]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/applications" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
          <ArrowLeft className="h-4 w-4" /> Назад к заявкам
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Загрузка...</div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Link href="/applications" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
          <ArrowLeft className="h-4 w-4" /> Назад к заявкам
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{error || "Заявка не найдена"}</div>
      </div>
    );
  }

  const stage = STAGES.find((s) => s.id === application.stage);
  const tone = stage && stage.tone in TONE_PRESETS 
    ? TONE_PRESETS[stage.tone as keyof typeof TONE_PRESETS] 
    : { tagBg: "#6B7280", tagColor: "#FFFFFF", gradient: "linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.05))" };
  const chatHistory = application.chatHistory || [];
  
  const platformIcon = application.platform === "instagram" 
    ? <Instagram className="h-4 w-4" />
    : <Send className="h-4 w-4" />;

  // Формируем URL для платформы
  const username = application.username || "";
  const platformUrl = application.platform === "instagram" 
    ? `https://instagram.com/${username.replace(/^@/, "")}`
    : application.platform === "telegram"
    ? `https://t.me/${username.replace(/^@/, "")}`
    : null;

  return (
    <div className="space-y-6">
      <Link href="/applications" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
        <ArrowLeft className="h-4 w-4" /> Назад к заявкам
      </Link>

      {/* Заголовок с информацией о заявке */}
      <div className="relative overflow-hidden" style={{ borderRadius: 30, background: "var(--panel)", border: "1px solid var(--card-border)" }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${application.platformAccent}15, transparent)` }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-4">
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center shrink-0"
              style={{ background: application.platformAccent + "20", color: application.platformAccent }}
            >
              {platformIcon}
            </div>
            <div>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{application.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: application.platformAccent + "20", color: application.platformAccent }}
                >
                  {application.platformName}
                </span>
                {stage && (
                  <span 
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: tone.tagBg, color: tone.tagColor }}
                  >
                    {stage.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          {platformUrl && (
            <div className="flex items-center gap-2">
              <a
                href={platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors hover:opacity-90"
                style={{ 
                  borderColor: application.platformAccent,
                  background: application.platformAccent + "20",
                  color: application.platformAccent
                }}
              >
                {platformIcon}
                Открыть в {application.platformName}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Основная информация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Сообщение</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{application.message}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Бюджет</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{application.budget || "—"}</p>
          </div>
        </Card>
      </div>

      {/* Дополнительная информация */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserRound className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Владелец</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{application.owner}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Последняя активность</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{application.lastActivity}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserRound className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Username</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{application.username || "—"}</p>
          </div>
        </Card>
      </div>

      {/* История чата */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>История переписки</div>
          </div>
        </div>
        <div 
          className="p-5 space-y-4" 
          style={{ 
            maxHeight: '600px', 
            overflowY: 'auto',
            background: 'linear-gradient(to bottom, var(--background), var(--panel))',
          }}
        >
          {chatHistory.length > 0 ? (
            <>
              {chatHistory.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Аватар */}
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      background: message.role === "user" 
                        ? application.platformAccent + "20" 
                        : "var(--muted)",
                      color: message.role === "user" 
                        ? application.platformAccent 
                        : "var(--foreground)",
                        border: message.role === "user"
                          ? `1px solid ${application.platformAccent}30`
                          : "1px solid var(--card-border)",
                    }}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Сообщение */}
                  <div
                    className={`flex flex-col gap-1.5 max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className="px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md"
                      style={{
                        background: message.role === "user"
                          ? application.platformAccent + "15"
                          : "var(--muted)",
                        border: message.role === "user"
                          ? `1px solid ${application.platformAccent}30`
                          : "1px solid var(--card-border)",
                        color: "var(--foreground)",
                      }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2">
                      {message.role === "assistant" && (
                        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                          AI-бот
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Индикатор "печатает..." */}
              {isTyping && (
                <div className="flex gap-3 flex-row">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      background: "var(--muted)",
                      color: "var(--foreground)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1.5 items-start">
                    <div
                      className="px-4 py-3 rounded-2xl shadow-sm"
                      style={{
                        background: "var(--muted)",
                        border: "1px solid var(--card-border)",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Печатает</span>
                        <div className="flex gap-1 items-center">
                          <span 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ 
                              background: 'var(--muted-foreground)',
                              animation: 'typingDot 1.4s ease-in-out infinite',
                              animationDelay: '0ms'
                            }}
                          ></span>
                          <span 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ 
                              background: 'var(--muted-foreground)',
                              animation: 'typingDot 1.4s ease-in-out infinite',
                              animationDelay: '200ms'
                            }}
                          ></span>
                          <span 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ 
                              background: 'var(--muted-foreground)',
                              animation: 'typingDot 1.4s ease-in-out infinite',
                              animationDelay: '400ms'
                            }}
                          ></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                История переписки пуста
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

