"use client";

import { use, useEffect, useState } from "react";
import Card from "@/components/Card";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Activity,
  CheckCircle2,
  WalletCards,
  History,
  BellRing,
  Edit,
  Save,
  X,
  CreditCard,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";
import { fetchClientByIdFromApi, fetchPayments, Payment, updateClient, addClientVisit, removeClientVisit, deletePayment } from "@/lib/api";
import Modal from "@/components/Modal";
import { toast } from "@pheralb/toast";

type ClientDirection = "Body" | "Coworking" | "Coffee" | "Pilates Reformer";
type ClientStatus = "Активный" | "Новый" | "Ушедший";

type Subscription = { name: string; validTill: string };

type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  contractNumber?: string | null;
  subscriptionNumber?: string | null;
  birthDate?: string | null;
  instagram?: string | null;
  source?: string;
  direction: ClientDirection;
  status: ClientStatus;
  subscriptions: Subscription[];
  visits: string[];
  activationDate?: string | null;
  contraindications?: string | null;
  coachNotes?: string | null;
};

const directionLabels: Record<ClientDirection, string> = {
  Body: "Body&mind",
  Coworking: "Коворкинг",
  Coffee: "Детская",
  "Pilates Reformer": "Pilates Reformer",
};

const statusTone: Record<ClientStatus, string> = {
  Новый: "rgba(59, 130, 246, 0.85)",
  Активный: "rgba(22, 163, 74, 0.85)",
  Ушедший: "rgba(220, 38, 38, 0.85)",
};

type PageProps = { params: Promise<{ id: string }> };

export default function BodyClientDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [deletingVisitDate, setDeletingVisitDate] = useState<string | null>(null);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  const [isEditingUsedVisits, setIsEditingUsedVisits] = useState(false);
  const [editedUsedVisitsCount, setEditedUsedVisitsCount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);
  
  // Состояния для формы редактирования
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editContractNumber, setEditContractNumber] = useState("");
  const [editSubscriptionNumber, setEditSubscriptionNumber] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editDirection, setEditDirection] = useState<ClientDirection>("Body");
  const [editStatus, setEditStatus] = useState<ClientStatus>("Новый");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const clientResponse = await fetchClientByIdFromApi<ClientProfile>(id, { cache: "no-store" });
        const paymentsData = await fetchPayments(undefined, id);
        
        setClient(clientResponse);
        setPayments(paymentsData);
      } catch (err) {
        console.error("=== ERROR LOADING CLIENT ===", err);
        setError(err instanceof Error ? err.message : "Клиент не найден");
        setClient(null);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/body/clients" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
          <ArrowLeft className="h-4 w-4" /> Назад к клиентам
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Загрузка...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Link href="/body/clients" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
          <ArrowLeft className="h-4 w-4" /> Назад к клиентам
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Клиент не найден</div>
      </div>
    );
  }

  const statusColor = statusTone[client.status];
  const initials = client.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sub = client.subscriptions?.[0];
  const lastVisit = client.visits && client.visits.length
    ? new Date(client.visits[client.visits.length - 1]).toLocaleDateString("ru-RU")
    : "—";

  // Вычисляем данные из оплат
  const totalVisitsFromPayments = payments.reduce((sum, payment) => {
    // Если есть quantity (для абонементов), добавляем его (quantity - это количество визитов/занятий)
    if (payment.quantity && payment.quantity >= 1) {
      return sum + payment.quantity;
    }
    // Если есть hours (для почасовых услуг), считаем как визиты
    if (payment.hours && payment.hours > 0) {
      return sum + payment.hours;
    }
    // Для обычных услуг считаем как 1 визит
    return sum + 1;
  }, 0);

  // Группируем платежи с одинаковым типом услуги (как на странице subscriptions)
  // Это нужно для правильного подсчета остатка, если у клиента несколько платежей с одинаковым типом
  const subscriptionGroups = new Map<string, { payments: Payment[]; total: number; left: number }>();
  
  payments
    .filter(p => p.quantity && p.quantity > 0)
    .forEach((payment) => {
      // Извлекаем количество из названия
      const match = payment.service_name.match(/(\d+)\s*занят/i);
      const totalFromName = match ? parseInt(match[1], 10) : null;
      
      // Используем название услуги как ключ для группировки
      const key = payment.service_name;
      
      if (subscriptionGroups.has(key)) {
        const group = subscriptionGroups.get(key)!;
        group.payments.push(payment);
        // Суммируем остатки (quantity - это остаток)
        group.left += payment.quantity;
        // Суммируем изначальные количества
        if (totalFromName) {
          group.total += totalFromName;
        } else {
          group.total += payment.quantity; // Если не нашли в названии, используем quantity
        }
      } else {
        subscriptionGroups.set(key, {
          payments: [payment],
          total: totalFromName || payment.quantity,
          left: payment.quantity,
        });
      }
    });
  
  // Получаем последний/активный абонемент (самый свежий платеж из самой свежей группы)
  let activeSubscription: Payment | null = null;
  let activeGroup: { total: number; left: number } | null = null;
  
  if (subscriptionGroups.size > 0) {
    // Находим самую свежую группу (по дате последнего платежа)
    let latestDate = new Date(0);
    let latestKey = "";
    
    subscriptionGroups.forEach((group, key) => {
      const latestPayment = group.payments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      if (new Date(latestPayment.created_at) > latestDate) {
        latestDate = new Date(latestPayment.created_at);
        latestKey = key;
      }
    });
    
    const group = subscriptionGroups.get(latestKey)!;
    activeGroup = { total: group.total, left: group.left };
    activeSubscription = group.payments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }
  
  // Извлекаем изначальное количество занятий из названия услуги
  let paidVisits = 0;
  let usedVisits = 0;
  
  if (activeSubscription && activeGroup) {
    // Используем данные из группы (уже сгруппированы и просуммированы)
    paidVisits = activeGroup.total;
    const left = activeGroup.left;
    // Использовано = изначальное - остаток (quantity уже уменьшается при списании)
    usedVisits = Math.max(0, paidVisits - left);
  } else {
    // Если нет активного абонемента, используем общее количество визитов из visits
    usedVisits = client.visits?.length || 0;
  }
  
  // Общее количество оплаченных визитов из всех платежей (для информации)
  const totalPaidVisits = payments
    .filter(p => p.quantity && p.quantity >= 1)
    .reduce((sum, p) => sum + (p.quantity || 0), 0);

  // Получаем последнюю оплату
  const lastPayment = payments.length > 0 
    ? payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  // Получаем направления из оплат
  const directionsFromPayments = Array.from(
    new Set(
      payments
        .map(p => p.service_category)
        .filter((cat): cat is string => cat !== null && cat !== undefined)
    )
  );

  // Получаем информацию об абонементах из оплат
  const subscriptionsFromPayments = payments
    .filter(p => p.quantity && p.quantity > 1)
    .map(p => ({
      name: p.service_name,
      quantity: p.quantity || 1,
      date: p.created_at,
      category: p.service_category,
    }));

  // Определяем основное направление из оплат или используем из клиента
  const primaryDirection = directionsFromPayments.length > 0 
    ? directionsFromPayments[0] 
    : directionLabels[client.direction];

  // Форматирование цены
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("ru-RU").format(price).replace(/,/g, " ");
  };

  // Форматирование даты
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Статистика по оплатам
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalCash = payments.reduce((sum, p) => sum + (p.cash_amount || 0), 0);
  const totalTransfer = payments.reduce((sum, p) => sum + (p.transfer_amount || 0), 0);

  // Открыть детали оплаты
  const handleOpenPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  // Удалить оплату
  const handleDeletePayment = async (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeletePaymentModalOpen(true);
  };

  const handleConfirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    try {
      setIsDeletingPayment(true);
      await deletePayment(paymentToDelete.public_id);
      setPayments(payments.filter(p => p.public_id !== paymentToDelete.public_id));
      setIsDeletePaymentModalOpen(false);
      setPaymentToDelete(null);
      toast.success({
        text: "Оплата успешно удалена!",
      });
    } catch (err) {
      console.error("Error deleting payment:", err);
      toast.error({
        text: err instanceof Error ? err.message : "Ошибка при удалении оплаты",
      });
    } finally {
      setIsDeletingPayment(false);
    }
  };

  // Открыть модальное окно редактирования
  const handleOpenEdit = () => {
    if (client) {
      setEditName(client.name);
      setEditPhone(client.phone);
      setEditContractNumber(client.contractNumber || "");
      setEditSubscriptionNumber(client.subscriptionNumber || "");
      setEditBirthDate(client.birthDate || "");
      setEditInstagram(client.instagram || "");
      setEditDirection(client.direction);
      setEditStatus(client.status);
      setIsEditModalOpen(true);
    }
  };

  // Сохранить изменения
  const handleSaveEdit = async () => {
    if (!client) return;
    
    setIsSaving(true);
    try {
      const updated = await updateClient<ClientProfile>(client.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        contractNumber: editContractNumber.trim() || null,
        subscriptionNumber: editSubscriptionNumber.trim() || null,
        birthDate: editBirthDate.trim() || null,
        instagram: editInstagram.trim() || null,
        direction: editDirection,
        status: editStatus,
      });

      // Преобразуем ответ, если нужно
      const transformed = {
        ...updated,
        contractNumber: (updated as any).contract_number ?? updated.contractNumber,
        subscriptionNumber: (updated as any).subscription_number ?? updated.subscriptionNumber,
        birthDate: (updated as any).birth_date ?? updated.birthDate,
        activationDate: (updated as any).activation_date ?? updated.activationDate,
        coachNotes: (updated as any).coach_notes ?? updated.coachNotes,
      };

      setClient(transformed as ClientProfile);
      setIsEditModalOpen(false);
      toast.success({
        text: "Данные клиента успешно обновлены!",
      });
    } catch (err) {
      console.error("Error updating client:", err);
      toast.error({
        text: err instanceof Error ? err.message : "Ошибка при обновлении клиента",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Добавить визит
  const handleAddVisit = async () => {
    if (!client) return;
    
    setIsAddingVisit(true);
    try {
      const updated = await addClientVisit<ClientProfile>(client.id);
      setClient(updated);
      toast.success({
        text: "Визит успешно зафиксирован!",
      });
    } catch (err) {
      console.error("Error adding visit:", err);
      toast.error({
        text: err instanceof Error ? err.message : "Ошибка при фиксации визита",
      });
    } finally {
      setIsAddingVisit(false);
    }
  };

  // Открыть редактирование количества использованных визитов
  const handleOpenEditUsedVisits = () => {
    if (client) {
      // Используем текущее количество использованных визитов, или оплаченные визиты, если использованных нет
      const currentUsed = usedVisits > 0 ? usedVisits : (paidVisits > 0 ? paidVisits : 0);
      setEditedUsedVisitsCount(currentUsed);
      setIsEditingUsedVisits(true);
    }
  };

  // Сохранить отредактированное количество использованных визитов
  const handleSaveUsedVisits = async () => {
    if (!client) return;

    const currentCount = usedVisits;
    const newCount = editedUsedVisitsCount;

    if (newCount === currentCount) {
      setIsEditingUsedVisits(false);
      return;
    }

    if (newCount < 0 || (paidVisits > 0 && newCount > paidVisits)) {
      toast.error({
        text: `Количество визитов должно быть от 0 до ${paidVisits}`,
      });
      return;
    }

    try {
      const currentVisits = client.visits || [];

      if (newCount > currentCount) {
        // Нужно добавить визиты
        const toAdd = newCount - currentCount;
        for (let i = 0; i < toAdd; i++) {
          // Добавляем визиты с датами, распределенными по дням назад
          const visitDate = new Date();
          visitDate.setDate(visitDate.getDate() - (toAdd - 1 - i));
          const dateStr = visitDate.toISOString().split('T')[0];
          if (!currentVisits.includes(dateStr)) {
            await addClientVisit<ClientProfile>(client.id, dateStr);
          }
        }
      } else if (newCount < currentCount) {
        // Нужно удалить визиты (удаляем последние)
        const toRemove = currentCount - newCount;
        const sortedVisits = [...currentVisits].sort().reverse();
        for (let i = 0; i < toRemove && i < sortedVisits.length; i++) {
          await removeClientVisit<ClientProfile>(client.id, sortedVisits[i]);
        }
      }

      // Перезагружаем данные клиента
      const updated = await fetchClientByIdFromApi<ClientProfile>(client.id, { cache: "no-store" });
      setClient(updated);
      setIsEditingUsedVisits(false);
      toast.success({
        text: "Количество использованных визитов успешно обновлено!",
      });
    } catch (err) {
      console.error("Error updating used visits:", err);
      toast.error({
        text: err instanceof Error ? err.message : "Ошибка при обновлении количества визитов",
      });
    }
  };

  // Открыть модальное окно подтверждения удаления визита
  const handleOpenDeleteVisit = (visitDate: string) => {
    setVisitToDelete(visitDate);
  };

  // Удалить визит
  const handleConfirmDeleteVisit = async () => {
    if (!client || !visitToDelete) return;
    
    setDeletingVisitDate(visitToDelete);
    try {
      const updated = await removeClientVisit<ClientProfile>(client.id, visitToDelete);
      setClient(updated);
      setVisitToDelete(null);
      toast.success({
        text: "Визит успешно удален!",
      });
    } catch (err) {
      console.error("Error removing visit:", err);
      toast.error({
        text: err instanceof Error ? err.message : "Ошибка при удалении визита",
      });
    } finally {
      setDeletingVisitDate(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header with back button and edit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link 
            href="/body/clients" 
            className="inline-flex items-center gap-2 text-sm transition"
            style={{ 
              color: 'var(--foreground)',
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ArrowLeft className="h-4 w-4" /> Назад к клиентам
          </Link>
        </div>
        <button
          onClick={handleOpenEdit}
          style={{
            padding: "0.625rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
            background: "transparent",
            color: "var(--foreground)",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Edit className="h-4 w-4" />
          Редактировать
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Всего визитов
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{usedVisits}</p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Оплачено визитов
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{paidVisits || totalPaidVisits || 0}</p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Осталось
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: (paidVisits - usedVisits) <= 0 ? '#EF4444' : "var(--foreground)" }}>
              {Math.max(0, paidVisits - usedVisits)}
            </p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Всего оплат
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{totalPayments}</p>
          </div>
        </Card>
      </div>

      {/* Заголовок с информацией о клиенте */}
      <Card style={{ padding: "1.5rem" }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center shrink-0 text-lg font-semibold"
              style={{ background: statusColor + "20", color: statusColor }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{client.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: statusColor + "20", color: statusColor }}
                >
                  {client.status}
                </span>
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}
                >
                  {directionLabels[client.direction]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm lg:items-end" style={{ color: 'var(--muted-foreground)' }}>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{client.phone}</span>
              {client.instagram && <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{client.instagram}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}>
                Договор: {client.contractNumber || "—"}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}>
                Абонемент: {client.subscriptionNumber || "—"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" style={{ padding: "1.5rem" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Абонемент</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Номер договора, абонемента, срок</p>
            </div>
            <div style={{ 
              padding: "0.75rem", 
              borderRadius: "12px", 
              background: "var(--muted)", 
              border: "1px solid var(--card-border)" 
            }}>
              <WalletCards className="h-5 w-5" style={{ color: "var(--foreground)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Номер договора
            </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                {client.contractNumber || '—'}
            </div>
            </div>
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Номер абонемента
            </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                {client.subscriptionNumber || '—'}
              </div>
            </div>
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Срок абонемента
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                {sub?.validTill ? new Date(sub.validTill).toLocaleDateString('ru-RU') : '—'}
              </div>
            </div>
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Активация
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                {client.activationDate ? new Date(client.activationDate).toLocaleDateString('ru-RU') : 'с первого визита'}
              </div>
            </div>
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Дата рождения
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                {client.birthDate ? (() => {
                  try {
                    const date = new Date(client.birthDate);
                    if (!isNaN(date.getTime())) {
                      return date.toLocaleDateString('ru-RU');
                    }
                    return client.birthDate;
                  } catch {
                    return client.birthDate;
                  }
                })() : '—'}
              </div>
            </div>
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Направление
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                {primaryDirection}
                {directionsFromPayments.length > 1 && (
                  <span className="text-xs ml-2" style={{ color: 'var(--muted-foreground)' }}>
                    (+{directionsFromPayments.length - 1})
                  </span>
                )}
              </div>
            </div>
          </div>
          {subscriptionsFromPayments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Абонементы из оплат
              </div>
              <div className="space-y-2">
                {subscriptionsFromPayments.map((sub, index) => (
                  <div key={index} className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{sub.name}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {sub.category && <span>{sub.category} · </span>}
                          {sub.quantity} {sub.quantity === 1 ? 'занятие' : sub.quantity < 5 ? 'занятия' : 'занятий'}
                        </div>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(sub.date).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card style={{ padding: "1.5rem" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Посещения</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Последний визит, активность</p>
            </div>
            <div style={{ 
              padding: "0.75rem", 
              borderRadius: "12px", 
              background: "var(--muted)", 
              border: "1px solid var(--card-border)" 
            }}>
              <Activity className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </div>
            </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "0.875rem 1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Последний визит
              </span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                {lastVisit}
              </span>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "0.875rem 1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Всего визитов
              </span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                {usedVisits}
              </span>
            </div>
            {/* Информация об абонементе - показываем всегда */}
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--background)" 
            }}>
              <div style={{ 
                fontSize: "0.75rem", 
                fontWeight: 500, 
                color: "var(--muted-foreground)", 
                textTransform: "uppercase", 
                letterSpacing: "0.05em", 
                marginBottom: "1rem" 
              }}>
                Абонемент
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {activeSubscription ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Абонемент</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                        {activeSubscription.service_name || 'Абонемент'}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Оплачено визитов</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                        {paidVisits}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Использовано</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: usedVisits >= paidVisits ? '#EF4444' : 'var(--foreground)' }}>
                          {usedVisits} / {paidVisits}
                        </span>
                        <button
                          onClick={handleOpenEditUsedVisits}
                          style={{
                            padding: "0.25rem",
                            borderRadius: "6px",
                            border: "none",
                            background: "transparent",
                            color: "var(--muted-foreground)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          title="Редактировать количество использованных визитов"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--muted)";
                            e.currentTarget.style.color = "var(--foreground)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--muted-foreground)";
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Осталось</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: (paidVisits - usedVisits) <= 0 ? '#EF4444' : 'var(--foreground)' }}>
                        {Math.max(0, paidVisits - usedVisits)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Оплачено визитов</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                        {totalPaidVisits > 0 ? totalPaidVisits : '—'}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Использовано</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                        {usedVisits}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleAddVisit}
              disabled={isAddingVisit}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: isAddingVisit ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                opacity: isAddingVisit ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isAddingVisit) {
                  e.currentTarget.style.background = "var(--muted)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isAddingVisit) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {isAddingVisit ? (
                <>
                  <div className="h-4 w-4 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
                  Фиксация...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Зафиксировать визит
                </>
              )}
            </button>
            {lastPayment && (
              <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Последняя оплата
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Услуга</span>
                    <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                      {lastPayment.service_name || '—'}
                      {lastPayment.service_category && (
                        <span className="ml-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          ({lastPayment.service_category})
                        </span>
                      )}
                    </span>
                  </div>
                  {lastPayment.quantity && lastPayment.quantity > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Количество занятий</span>
                      <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                        {lastPayment.quantity}
                      </span>
                    </div>
                  )}
                  {lastPayment.hours && lastPayment.hours > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Часов</span>
                      <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                        {lastPayment.hours}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Сумма</span>
                    <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                      {new Intl.NumberFormat('ru-RU').format(lastPayment.total_amount || 0)} сум
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Дата</span>
                    <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                      {new Date(lastPayment.created_at).toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "1.5rem" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--foreground)' }}>История визитов</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Фиксируем для активации абонемента</p>
          </div>
          <div style={{ 
            padding: "0.75rem", 
            borderRadius: "12px", 
            background: "var(--muted)", 
            border: "1px solid var(--card-border)" 
          }}>
            <History className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </div>
        </div>
        {client.visits?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...client.visits].reverse().map((v) => {
              const visitDate = new Date(v);
              const dayOfWeek = visitDate.toLocaleDateString('ru-RU', { weekday: 'long' });
              const formattedDate = visitDate.toLocaleDateString('ru-RU', { 
                day: "numeric", 
                month: "long", 
                year: "numeric" 
              });
              
              return (
                <div 
                  key={v} 
                  className="flex items-center justify-between group"
                  style={{ 
                    padding: "0.875rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div style={{ 
                      width: "2.5rem", 
                      height: "2.5rem", 
                      borderRadius: "10px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      background: "var(--muted)",
                      border: "1px solid var(--card-border)",
                    }}>
                      <CheckCircle2 className="h-5 w-5" style={{ color: "#10B981" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                        {formattedDate}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                        {dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDeleteVisit(v)}
                    disabled={deletingVisitDate === v}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      color: deletingVisitDate === v ? 'var(--muted-foreground)' : '#EF4444',
                      cursor: deletingVisitDate === v ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      opacity: 0,
                    }}
                    className="group-hover:opacity-100"
                    title="Удалить визит"
                    onMouseEnter={(e) => {
                      if (deletingVisitDate !== v) {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (deletingVisitDate !== v) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {deletingVisitDate === v ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              width: "4rem", 
              height: "4rem", 
              borderRadius: "50%", 
              marginBottom: "1rem",
              background: "var(--muted)",
              border: "1px solid var(--card-border)",
            }}>
              <History className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem", color: 'var(--foreground)' }}>
              Пока нет визитов
            </p>
            <p style={{ fontSize: "0.75rem", color: 'var(--muted-foreground)' }}>
              Визиты будут отображаться здесь после фиксации
            </p>
          </div>
        )}
      </Card>

      {/* Примечания */}
      <Card style={{ padding: "1.5rem" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Примечания</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Противопоказания, заметки тренера</p>
          </div>
          <div style={{ 
            padding: "0.75rem", 
            borderRadius: "12px", 
            background: "var(--muted)", 
            border: "1px solid var(--card-border)" 
          }}>
            <BellRing className="h-5 w-5" style={{ color: "var(--foreground)" }} />
        </div>
          </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ 
            padding: "1rem", 
            borderRadius: "12px", 
            border: "1px solid var(--card-border)", 
            background: "var(--muted)" 
          }}>
            <div style={{ 
              fontSize: "0.75rem", 
              fontWeight: 500, 
              color: "var(--muted-foreground)", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em", 
              marginBottom: "0.5rem" 
            }}>
              Противопоказания
            </div>
            <div style={{ fontSize: "0.875rem", color: 'var(--foreground)' }}>
              {client.contraindications || '—'}
            </div>
          </div>
          <div style={{ 
            padding: "1rem", 
            borderRadius: "12px", 
            border: "1px solid var(--card-border)", 
            background: "var(--muted)" 
          }}>
            <div style={{ 
              fontSize: "0.75rem", 
              fontWeight: 500, 
              color: "var(--muted-foreground)", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em", 
              marginBottom: "0.5rem" 
            }}>
              Заметки тренера
            </div>
            <div style={{ fontSize: "0.875rem", color: 'var(--foreground)' }}>
              {client.coachNotes || '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* История оплат */}
      <Card style={{ padding: "1.5rem" }}>
        <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>История оплат</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Все оплаты клиента</p>
            </div>
          <div style={{ 
            padding: "0.75rem", 
            borderRadius: "12px", 
            background: "var(--muted)", 
            border: "1px solid var(--card-border)" 
          }}>
            <CreditCard className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </div>
          </div>

          {/* Статистика */}
          {totalPayments > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ 
                fontSize: "0.75rem", 
                fontWeight: 500, 
                color: "var(--muted-foreground)", 
                textTransform: "uppercase", 
                letterSpacing: "0.05em", 
                marginBottom: "0.5rem" 
              }}>
                Всего оплат
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: 'var(--foreground)' }}>
                  {totalPayments}
                </div>
              </div>
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ 
                fontSize: "0.75rem", 
                fontWeight: 500, 
                color: "var(--muted-foreground)", 
                textTransform: "uppercase", 
                letterSpacing: "0.05em", 
                marginBottom: "0.5rem" 
              }}>
                Общая сумма
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: 'var(--foreground)' }}>
                  {formatPrice(totalAmount)} сум
                </div>
              </div>
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ 
                fontSize: "0.75rem", 
                fontWeight: 500, 
                color: "var(--muted-foreground)", 
                textTransform: "uppercase", 
                letterSpacing: "0.05em", 
                marginBottom: "0.5rem" 
              }}>
                Наличные
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: 'var(--foreground)' }}>
                  {formatPrice(totalCash)} сум
                </div>
              </div>
            <div style={{ 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid var(--card-border)", 
              background: "var(--muted)" 
            }}>
              <div style={{ 
                fontSize: "0.75rem", 
                fontWeight: 500, 
                color: "var(--muted-foreground)", 
                textTransform: "uppercase", 
                letterSpacing: "0.05em", 
                marginBottom: "0.5rem" 
              }}>
                Перевод
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: 'var(--foreground)' }}>
                  {formatPrice(totalTransfer)} сум
                </div>
              </div>
            </div>
          )}

          {/* Таблица оплат */}
          {payments.length > 0 ? (
          <div className="overflow-x-auto" style={{ borderRadius: "12px", border: "1px solid var(--card-border)", overflow: "hidden" }}>
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ background: "var(--muted)" }}>
                  <tr>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    color: 'var(--muted-foreground)',
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                      Дата
                    </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    color: 'var(--muted-foreground)',
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                      Услуга
                    </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    color: 'var(--muted-foreground)',
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                      Сумма
                    </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    color: 'var(--muted-foreground)',
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                      Метод
                    </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    color: 'var(--muted-foreground)',
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((payment) => (
                    <tr 
                      key={payment.public_id}
                    style={{
                      cursor: "pointer",
                      transition: "background 0.2s ease",
                    }}
                      onClick={() => handleOpenPaymentDetails(payment)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--muted)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    >
                    <td style={{ 
                      padding: "0.75rem 1rem", 
                      fontSize: "0.875rem", 
                      borderBottom: "1px solid var(--card-border)", 
                      color: 'var(--foreground)' 
                    }}>
                        {formatDate(payment.created_at)}
                      </td>
                    <td style={{ 
                      padding: "0.75rem 1rem", 
                      fontSize: "0.875rem", 
                      borderBottom: "1px solid var(--card-border)", 
                      color: 'var(--foreground)' 
                    }}>
                        <div>
                        <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                          {payment.service_name || 'Услуга'}
                        </div>
                          {payment.service_category && (
                          <div style={{ fontSize: "0.75rem", color: 'var(--muted-foreground)' }}>
                              {payment.service_category}
                            </div>
                          )}
                          {payment.quantity && payment.quantity > 1 && (
                          <div style={{ fontSize: "0.75rem", color: 'var(--muted-foreground)' }}>
                              {payment.quantity} занятий
                            </div>
                          )}
                          {payment.hours && payment.hours > 0 && (
                          <div style={{ fontSize: "0.75rem", color: 'var(--muted-foreground)' }}>
                              {payment.hours} час(ов)
                            </div>
                          )}
                        </div>
                      </td>
                    <td style={{ 
                      padding: "0.75rem 1rem", 
                      fontSize: "0.875rem", 
                      borderBottom: "1px solid var(--card-border)", 
                      color: 'var(--foreground)' 
                    }}>
                      <div style={{ fontWeight: 600 }}>
                        {formatPrice(payment.total_amount || 0)} сум
                      </div>
                      </td>
                    <td style={{ 
                      padding: "0.75rem 1rem", 
                      fontSize: "0.875rem", 
                      borderBottom: "1px solid var(--card-border)", 
                      color: 'var(--foreground)' 
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {payment.cash_amount && payment.cash_amount > 0 && (
                          <span style={{ fontSize: "0.75rem" }}>Наличные: {formatPrice(payment.cash_amount)}</span>
                          )}
                          {payment.transfer_amount && payment.transfer_amount > 0 && (
                          <span style={{ fontSize: "0.75rem" }}>Перевод: {formatPrice(payment.transfer_amount)}</span>
                          )}
                        </div>
                      </td>
                    <td style={{ 
                      padding: "0.75rem 1rem", 
                      fontSize: "0.875rem", 
                      borderBottom: "1px solid var(--card-border)" 
                    }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePayment(payment);
                          }}
                        style={{
                          padding: "0.5rem",
                          borderRadius: "8px",
                          border: "none",
                          background: "transparent",
                          color: '#EF4444',
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                          title="Удалить оплату"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem 1.5rem", 
            fontSize: "0.875rem", 
            color: 'var(--muted-foreground)' 
          }}>
              Пока нет оплат
            </div>
          )}
        </Card>

      {/* Модальное окно редактирования */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактировать клиента"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Имя клиента *
            </label>
              <div style={{ position: "relative" }}>
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Например, Анна Смирнова"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem 0.625rem 2.5rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
            />
          </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Телефон *
            </label>
              <div style={{ position: "relative" }}>
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+998 90 000 00 00"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem 0.625rem 2.5rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
            />
          </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Номер договора
            </label>
            <input
              type="text"
              value={editContractNumber}
              onChange={(e) => setEditContractNumber(e.target.value)}
              placeholder="Например, D-2024-015"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            />
          </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Номер абонемента
            </label>
            <input
              type="text"
              value={editSubscriptionNumber}
              onChange={(e) => setEditSubscriptionNumber(e.target.value)}
              placeholder="Например, S-110045"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            />
          </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Дата рождения
            </label>
            <input
              type="date"
              value={editBirthDate}
              onChange={(e) => setEditBirthDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  outline: "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            />
          </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Instagram
            </label>
            <input
              type="text"
              value={editInstagram}
              onChange={(e) => setEditInstagram(e.target.value)}
              placeholder="@username"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            />
          </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Направление
            </label>
            <select
              value={editDirection}
              onChange={(e) => setEditDirection(e.target.value as ClientDirection)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  outline: "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            >
              <option value="Body">Body&mind</option>
              <option value="Coworking">Коворкинг</option>
              <option value="Pilates Reformer">Pilates Reformer</option>
              <option value="Coffee">Детская</option>
            </select>
          </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Статус
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as ClientStatus)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  outline: "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--card-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            >
              <option value="Новый">Новый</option>
              <option value="Активный">Активный</option>
              <option value="Ушедший">Ушедший</option>
            </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--card-border)", justifyContent: "flex-end" }}>
            <button
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: isSaving ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: isSaving ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = "var(--muted)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || !editName.trim() || !editPhone.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid transparent",
                background: isSaving || !editName.trim() || !editPhone.trim()
                  ? "#9ca3af"
                  : "var(--foreground)",
                color: isSaving || !editName.trim() || !editPhone.trim()
                  ? "#ffffff"
                  : "var(--background)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: isSaving || !editName.trim() || !editPhone.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: isSaving || !editName.trim() || !editPhone.trim() ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (!isSaving && editName.trim() && editPhone.trim()) {
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving && editName.trim() && editPhone.trim()) {
                  e.currentTarget.style.opacity = "1";
                }
              }}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения удаления визита */}
      <Modal
        open={visitToDelete !== null}
        onClose={() => setVisitToDelete(null)}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            Вы уверены, что хотите удалить визит от{" "}
            <strong>
              {visitToDelete 
                ? new Date(visitToDelete).toLocaleDateString('ru-RU', { 
                    day: "numeric", 
                    month: "long", 
                    year: "numeric" 
                  })
                : ''}
            </strong>?
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Это действие нельзя отменить.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
            <button
              onClick={() => setVisitToDelete(null)}
              disabled={deletingVisitDate !== null}
              className="px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirmDeleteVisit}
              disabled={deletingVisitDate !== null}
              className="px-4 py-2 rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deletingVisitDate ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Удаление...
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Удалить
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно редактирования количества использованных визитов */}
      <Modal
        open={isEditingUsedVisits}
        onClose={() => setIsEditingUsedVisits(false)}
        title="Редактировать количество использованных визитов"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Количество использованных визитов
            </label>
            <input
              type="number"
              min="0"
              max={paidVisits || undefined}
              value={editedUsedVisitsCount === 0 ? '' : editedUsedVisitsCount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || value === '0') {
                  setEditedUsedVisitsCount(0);
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setEditedUsedVisitsCount(numValue);
                  }
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '' || e.target.value === '0') {
                  setEditedUsedVisitsCount(0);
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
              placeholder="0"
            />
            {paidVisits > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Максимум: {paidVisits} визитов
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
            <button
              onClick={() => setIsEditingUsedVisits(false)}
              className="px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] transition"
            >
              Отмена
            </button>
            <button
              onClick={handleSaveUsedVisits}
              disabled={editedUsedVisitsCount < 0 || (paidVisits > 0 && editedUsedVisitsCount > paidVisits)}
              className="px-4 py-2 rounded-lg border border-transparent bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Сохранить
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно деталей оплаты */}
      <Modal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Оплата от ${selectedPayment ? formatDate(selectedPayment.created_at) : ''}`}
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Услуга
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {selectedPayment.service_name || 'Услуга'}
                </div>
                {selectedPayment.service_category && (
                  <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {selectedPayment.service_category}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Сумма
                </div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {formatPrice(selectedPayment.total_amount || 0)} сум
                </div>
              </div>
            </div>

            {(selectedPayment.quantity || selectedPayment.hours) && (
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Детали
                </div>
                <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedPayment.quantity && selectedPayment.quantity > 1 && (
                    <div>Количество занятий: {selectedPayment.quantity}</div>
                  )}
                  {selectedPayment.hours && selectedPayment.hours > 0 && (
                    <div>Часов: {selectedPayment.hours}</div>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                Методы оплаты
              </div>
              <div className="space-y-1 text-sm" style={{ color: 'var(--foreground)' }}>
                {selectedPayment.cash_amount && selectedPayment.cash_amount > 0 && (
                  <div>Наличные: {formatPrice(selectedPayment.cash_amount)} сум</div>
                )}
                {selectedPayment.transfer_amount && selectedPayment.transfer_amount > 0 && (
                  <div>Перевод: {formatPrice(selectedPayment.transfer_amount)} сум</div>
                )}
              </div>
            </div>

            {selectedPayment.comment && (
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Комментарий
                </div>
                <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedPayment.comment}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Модальное окно подтверждения удаления оплаты */}
      <Modal
        open={isDeletePaymentModalOpen}
        onClose={() => {
          if (!isDeletingPayment) {
            setIsDeletePaymentModalOpen(false);
            setPaymentToDelete(null);
          }
        }}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            Вы уверены, что хотите удалить оплату от{" "}
            <strong>
              {paymentToDelete ? formatDate(paymentToDelete.created_at) : ''}
            </strong>?
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Это действие нельзя отменить.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
            <button
              onClick={() => {
                setIsDeletePaymentModalOpen(false);
                setPaymentToDelete(null);
              }}
              disabled={isDeletingPayment}
              className="px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirmDeletePayment}
              disabled={isDeletingPayment}
              className="px-4 py-2 rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeletingPayment ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Удаление...
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Удалить
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
