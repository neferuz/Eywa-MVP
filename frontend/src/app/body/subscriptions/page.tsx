"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Plus, Search, CreditCard, Users, Calendar, AlertCircle, TrendingDown, Clock, Loader2, RefreshCw, Minus } from "lucide-react";
import { fetchPayments, updatePayment, addClientVisit, type Payment } from "@/lib/api";
import { toast } from "@pheralb/toast";

type Row = { 
  id: string; 
  client: string; 
  clientId: string | null;
  type: string; 
  left: number; 
  purchasedAt: string; 
  total: number;
  paymentId: string;
};

export default function BodySubscriptionsPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [subscriptions, setSubscriptions] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscriptions() {
      try {
        setLoading(true);
        // Загружаем все платежи
        const payments = await fetchPayments();
        
        // Фильтруем только абонементы Body (по категории или названию услуги)
        const bodyPayments = payments.filter(p => {
          const categoryMatch = p.service_category && (
            p.service_category.toLowerCase() === "body" ||
            p.service_category.toLowerCase() === "bODY"
          );
          const nameMatch = p.service_name && p.service_name.toLowerCase().includes("body");
          return (categoryMatch || nameMatch) && p.quantity && p.quantity > 0;
        });

        // Преобразуем платежи в формат Row и фильтруем разовые занятия
        const rows: Row[] = bodyPayments
          .map((payment: Payment) => {
            // Извлекаем количество занятий из названия услуги или используем quantity
            const match = payment.service_name.match(/(\d+)\s*занят/i);
            const total = match ? parseInt(match[1], 10) : (payment.quantity || 1);
            
            // Используем quantity из платежа как остаток занятий
            const left = payment.quantity || 0;

            return {
              id: payment.public_id,
              client: payment.client_name || "Не указан",
              clientId: payment.client_id,
              type: payment.service_name,
              left: left,
              purchasedAt: payment.created_at,
              total: total,
              paymentId: payment.public_id,
            };
          })
          .filter((row) => {
            // Исключаем разовые занятия (где total = 1 и left = 1)
            // Или где в названии есть "разовое"
            const isSingle = row.total === 1 && row.left === 1;
            const isSingleByName = row.type.toLowerCase().includes("разовое");
            
            // Показываем только абонементы (больше 1 занятия или есть слово "абонемент")
            const isAbonement = row.total > 1 || row.type.toLowerCase().includes("абонемент");
            
            return !isSingle && !isSingleByName && isAbonement;
          });

        // Группируем абонементы по клиенту и типу услуги
        // Если у одного клиента несколько платежей с одинаковым типом - объединяем их
        const groupedMap = new Map<string, Row>();
        
        rows.forEach((row) => {
          // Создаем ключ для группировки: clientId + type
          const key = `${row.clientId || row.client}_${row.type}`;
          
          if (groupedMap.has(key)) {
            // Если такой абонемент уже есть - суммируем остатки
            const existing = groupedMap.get(key)!;
            existing.left += row.left;
            existing.total += row.total;
            // Берем самую раннюю дату покупки
            if (new Date(row.purchasedAt) < new Date(existing.purchasedAt)) {
              existing.purchasedAt = row.purchasedAt;
            }
            // Сохраняем ID первого платежа (или можно использовать массив ID)
            // Для простоты оставляем первый paymentId
          } else {
            // Первый абонемент такого типа для этого клиента
            groupedMap.set(key, { ...row });
          }
        });
        
        // Преобразуем Map обратно в массив
        const mapped = Array.from(groupedMap.values());

        setSubscriptions(mapped);
      } catch (error) {
        console.error("Failed to load subscriptions:", error);
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    }

    loadSubscriptions();
  }, []);

  const handleExtend = (subscription: Row) => {
    if (!subscription.clientId) {
      toast.error({ text: "Не удалось продлить: отсутствует ID клиента" });
      return;
    }

    // Редирект на страницу оплаты с предзаполнением
    const params = new URLSearchParams({
      client_id: subscription.clientId,
      service_name: subscription.type,
    });
    router.push(`/payments?${params.toString()}`);
  };

  const handleDeduct = async (subscription: Row) => {
    if (subscription.left <= 0) {
      toast.error({ text: "Нельзя списать: занятий не осталось" });
      return;
    }

    try {
      setProcessingId(subscription.id);
      
      // Уменьшаем quantity на 1
      const newQuantity = subscription.left - 1;
      
      await updatePayment(subscription.paymentId, {
        quantity: newQuantity,
      });

      // Добавляем дату визита клиента (текущая дата)
      if (subscription.clientId) {
        try {
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0]; // Формат YYYY-MM-DD
          await addClientVisit(subscription.clientId, dateStr);
        } catch (visitError) {
          // Если не удалось добавить визит, не прерываем процесс списания
          console.error("Failed to add client visit:", visitError);
        }
      }

      toast.success({ text: "Занятие успешно списано" });
      
      // Перезагружаем данные из API для синхронизации
      const payments = await fetchPayments();
      
      // Фильтруем только абонементы Body
      const bodyPayments = payments.filter(p => {
        const categoryMatch = p.service_category && (
          p.service_category.toLowerCase() === "body" ||
          p.service_category.toLowerCase() === "bODY"
        );
        const nameMatch = p.service_name && p.service_name.toLowerCase().includes("body");
        return (categoryMatch || nameMatch) && p.quantity && p.quantity > 0;
      });

      // Преобразуем платежи в формат Row
      const rows: Row[] = bodyPayments
        .map((payment: Payment) => {
          const match = payment.service_name.match(/(\d+)\s*занят/i);
          const total = match ? parseInt(match[1], 10) : (payment.quantity || 1);
          const left = payment.quantity || 0;

          return {
            id: payment.public_id,
            client: payment.client_name || "Не указан",
            clientId: payment.client_id,
            type: payment.service_name,
            left: left,
            purchasedAt: payment.created_at,
            total: total,
            paymentId: payment.public_id,
          };
        })
        .filter((row) => {
          const isSingle = row.total === 1 && row.left === 1;
          const isSingleByName = row.type.toLowerCase().includes("разовое");
          const isAbonement = row.total > 1 || row.type.toLowerCase().includes("абонемент");
          return !isSingle && !isSingleByName && isAbonement;
        });

      // Группируем абонементы
      const groupedMap = new Map<string, Row>();
      rows.forEach((row) => {
        const key = `${row.clientId || row.client}_${row.type}`;
        if (groupedMap.has(key)) {
          const existing = groupedMap.get(key)!;
          existing.left += row.left;
          existing.total += row.total;
          if (new Date(row.purchasedAt) < new Date(existing.purchasedAt)) {
            existing.purchasedAt = row.purchasedAt;
          }
        } else {
          groupedMap.set(key, { ...row });
        }
      });
      
      setSubscriptions(Array.from(groupedMap.values()));
    } catch (error) {
      console.error("Failed to deduct subscription:", error);
      toast.error({ text: "Не удалось списать занятие" });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = useMemo(() => 
    subscriptions.filter((r) => !q || r.client.toLowerCase().includes(q.toLowerCase())), 
    [subscriptions, q]
  );

  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(s => s.left > 0).length;
  const expiredSubscriptions = subscriptions.filter(s => s.left === 0).length;
  const lowBalanceSubscriptions = subscriptions.filter(s => s.left > 0 && s.left <= 2).length;

  const getLeftColor = (left: number, total: number) => {
    const percentage = (left / total) * 100;
    if (percentage <= 0) return "#6B7280"; // серый - закончился
    if (percentage <= 25) return "#EF4444"; // красный - мало осталось
    if (percentage <= 50) return "#F59E0B"; // оранжевый - средний остаток
    return "#10B981"; // зелёный - много осталось
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Всего абонементов</div>
          </div>
          <div className="text-2xl font-semibold">{totalSubscriptions}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#10B981' + "20", color: '#10B981' }}>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Активных</div>
          </div>
          <div className="text-2xl font-semibold">{activeSubscriptions}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#EF4444' + "20", color: '#EF4444' }}>
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Истекают скоро</div>
          </div>
          <div className="text-2xl font-semibold">{lowBalanceSubscriptions}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#6B7280' + "20", color: '#6B7280' }}>
              <TrendingDown className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Истекших</div>
          </div>
          <div className="text-2xl font-semibold">{expiredSubscriptions}</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              placeholder="Поиск по клиенту"
              className="h-9 w-full pl-9 pr-3 text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-12 w-12 mb-4" style={{ color: "var(--muted-foreground)" }} />
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Нет абонементов</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {q ? "Не найдено по запросу" : "Абонементы появятся здесь после покупки"}
            </p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead style={{ borderBottom: "1px solid var(--card-border)" }}>
                <tr>
                  <th className="py-3 pr-4 text-left" style={{ color: 'var(--foreground)' }}>Клиент</th>
                  <th className="py-3 pr-4 text-center" style={{ color: 'var(--foreground)' }}>Тип</th>
                  <th className="py-3 pr-4 text-center" style={{ color: 'var(--foreground)' }}>Остаток</th>
                  <th className="py-3 pr-4 text-center" style={{ color: 'var(--foreground)' }}>Когда купили</th>
                  <th className="py-3 text-center" style={{ color: 'var(--foreground)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const leftColor = getLeftColor(r.left, r.total);
                  const purchasedDate = new Date(r.purchasedAt);
                const initials = r.client.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
                          {initials}
                        </div>
                          {r.clientId ? (
                            <Link 
                              href={`/body/clients/${r.clientId}`}
                              style={{ 
                                color: 'var(--foreground)',
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.7';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                            >
                              {r.client}
                            </Link>
                          ) : (
                        <span style={{ color: 'var(--foreground)' }}>{r.client}</span>
                          )}
                      </div>
                    </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-medium inline-block" style={{ background: '#6366F1' + "20", color: '#6366F1' }}>
                        {r.type}
                      </span>
                    </td>
                      <td className="py-3 pr-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 min-w-[80px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-zinc-500">Осталось</span>
                            <span className="font-medium" style={{ color: leftColor }}>{r.left} / {r.total}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${(r.left / r.total) * 100}%`,
                                background: leftColor,
                                borderRadius: 'inherit'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                      <td className="py-3 pr-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {purchasedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                          </span>
                      </div>
                    </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="btn-outline text-xs flex items-center gap-1.5" 
                            onClick={() => handleExtend(r)}
                            style={{ padding: "0.375rem 0.75rem" }}
                          >
                            <RefreshCw className="h-3 w-3" />
                          Продлить
                        </button>
                          <button 
                            className="btn-outline text-xs flex items-center gap-1.5"
                            onClick={() => handleDeduct(r)}
                            disabled={processingId === r.id || r.left <= 0}
                            style={{ 
                              padding: "0.375rem 0.75rem",
                              opacity: (processingId === r.id || r.left <= 0) ? 0.6 : 1,
                              cursor: (processingId === r.id || r.left <= 0) ? "not-allowed" : "pointer"
                            }}
                          >
                            {processingId === r.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          Списать
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      <Modal open={open || !!edit} onClose={() => { setOpen(false); setEdit(null); }} title={edit ? "Редактировать абонемент" : "Добавить абонемент"}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Клиент</label>
              <input
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="Выберите клиента"
                defaultValue={edit?.client || ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Тип абонемента</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                defaultValue={edit?.type || ""}
              >
                <option value="">Выберите тип</option>
                <option value="Body 8">Body 8</option>
                <option value="Body 12">Body 12</option>
                <option value="Body 16">Body 16</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Остаток занятий</label>
              <input
                type="number"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="0"
                defaultValue={edit?.left || ""}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn-outline flex-1" onClick={() => { setOpen(false); setEdit(null); }}>
              Отмена
            </button>
            <button
              className="btn-outline flex-1"
              style={{ background: '#10B981' + "20", color: '#10B981', borderColor: '#10B981' }}
              onClick={() => { setOpen(false); setEdit(null); }}
            >
              <Plus className="h-4 w-4" /> Сохранить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


