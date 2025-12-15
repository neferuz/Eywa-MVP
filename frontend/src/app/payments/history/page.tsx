"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import Modal from "@/components/Modal";
import Card from "@/components/Card";
import DateRangePicker from "@/components/DateRangePicker";
import {
  Download,
  Printer,
  Share2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  Calendar,
  Search,
  Filter,
  Loader2,
  Phone,
  Trash2,
} from "lucide-react";
import { fetchPayments, deletePayment, Payment } from "@/lib/api";

interface PaymentHistoryItem {
  id: string;
  clientId: string | null;
  orderId: string;
  date: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  serviceCategory: string | null;
  quantity: number;
  hours: number | null;
  amount: number;
  paymentMethods: {
    cash: number;
    transfer: number;
  };
  status: "completed" | "pending" | "cancelled";
  comment?: string;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("ru-RU").format(price).replace(/,/g, " ");
};

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


export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentHistoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const data = await fetchPayments(serviceFilter !== "all" ? serviceFilter : undefined);
        const mapped: PaymentHistoryItem[] = data.map((p: Payment) => ({
          id: p.public_id,
          clientId: p.client_id || null,
          orderId: p.public_id.substring(0, 8).toUpperCase(),
          date: p.created_at,
          clientName: p.client_name || "Не указан",
          clientPhone: p.client_phone || "—",
          serviceName: p.service_name || "Услуга",
          serviceCategory: p.service_category || null,
          quantity: p.quantity || 1,
          hours: p.hours !== undefined && p.hours !== null ? p.hours : null,
          amount: p.total_amount,
          paymentMethods: {
            cash: p.cash_amount || 0,
            transfer: p.transfer_amount || 0,
          },
          status: p.status,
          comment: p.comment || undefined,
        }));
        setPayments(mapped);
      } catch (err) {
        console.error("Failed to load payments:", err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, [serviceFilter]);

  const uniqueServices = useMemo(() => {
    return Array.from(new Set(payments.map(p => p.serviceName))).sort();
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      payment.clientName.toLowerCase().includes(searchLower) ||
      payment.clientPhone.includes(searchLower) ||
      payment.serviceName.toLowerCase().includes(searchLower);
    
      const matchesService = serviceFilter === "all" || payment.serviceName === serviceFilter;
      
      // Фильтр по датам
      let matchesDate = true;
      if (dateRange?.from || dateRange?.to) {
        const paymentDate = new Date(payment.date);
        paymentDate.setHours(0, 0, 0, 0);
        
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (paymentDate < fromDate) {
            matchesDate = false;
          }
        }
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (paymentDate > toDate) {
            matchesDate = false;
          }
        }
      }
      
      return matchesSearch && matchesService && matchesDate;
    });
  }, [payments, search, serviceFilter, dateRange]);

  const handlePaymentClick = (payment: PaymentHistoryItem) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleClientClick = (e: React.MouseEvent, payment: PaymentHistoryItem) => {
    e.stopPropagation();
    if (payment.clientId) {
      router.push(`/body/clients/${payment.clientId}`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, payment: PaymentHistoryItem) => {
    e.stopPropagation();
    setPaymentToDelete(payment);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete) return;
    
    try {
      setDeleting(true);
      await deletePayment(paymentToDelete.id);
      setPayments(payments.filter(p => p.id !== paymentToDelete.id));
      setDeleteModalOpen(false);
      setPaymentToDelete(null);
      setSelectedPayment(null);
      setIsModalOpen(false);
      setSelectedPayments(new Set(selectedPayments).delete(paymentToDelete.id) ? new Set(selectedPayments) : new Set());
    } catch (err) {
      console.error("Failed to delete payment:", err);
      alert("Не удалось удалить платеж. Попробуйте еще раз.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)));
    } else {
      setSelectedPayments(new Set());
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    const newSelected = new Set(selectedPayments);
    if (checked) {
      newSelected.add(paymentId);
    } else {
      newSelected.delete(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedPayments.size === 0) return;
    
    try {
      setBulkDeleting(true);
      const deletePromises = Array.from(selectedPayments).map(id => deletePayment(id));
      await Promise.all(deletePromises);
      setPayments(payments.filter(p => !selectedPayments.has(p.id)));
      setSelectedPayments(new Set());
      setBulkDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete payments:", err);
      alert("Не удалось удалить некоторые платежи. Попробуйте еще раз.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!selectedPayment) return;
    
    // Генерируем текст чека
    const receiptText = `
ЧЕК ОПЛАТЫ
${"=".repeat(40)}

Услуга: ${selectedPayment.serviceName}
Клиент: ${selectedPayment.clientName}
Телефон: ${selectedPayment.clientPhone}
Дата: ${formatDate(selectedPayment.date)}
Статус: ${getStatusLabel(selectedPayment.status)}

${"-".repeat(40)}
Методы оплаты:
${selectedPayment.paymentMethods.cash > 0 ? `Наличные: ${formatPrice(selectedPayment.paymentMethods.cash)} сум` : ""}
${selectedPayment.paymentMethods.transfer > 0 ? `Перевод: ${formatPrice(selectedPayment.paymentMethods.transfer)} сум` : ""}
${"-".repeat(40)}
ИТОГО: ${formatPrice(selectedPayment.amount)} сум
${"=".repeat(40)}
${selectedPayment.comment ? `\nКомментарий: ${selectedPayment.comment}` : ""}
    `.trim();
    
    // Создаем blob и скачиваем
    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `чек-${selectedPayment.orderId}-${new Date(selectedPayment.date).toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    if (!selectedPayment) return;
    
    // Создаем новое окно для печати
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Чек оплаты - ${selectedPayment.orderId}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 2rem;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 1rem;
              margin-bottom: 1.5rem;
            }
            .section {
              margin-bottom: 1.5rem;
            }
            .row {
              display: flex;
              justify-content: space-between;
              padding: 0.5rem 0;
              border-bottom: 1px solid #eee;
            }
            .total {
              font-size: 1.5rem;
              font-weight: bold;
              text-align: center;
              padding: 1rem;
              background: #f5f5f5;
              margin-top: 1rem;
            }
            .status {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              border-radius: 4px;
              background: ${getStatusColor(selectedPayment.status)}20;
              color: ${getStatusColor(selectedPayment.status)};
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ЧЕК ОПЛАТЫ</h1>
            <p>№ ${selectedPayment.orderId}</p>
          </div>
          
          <div class="section">
            <div class="row">
              <span>Услуга:</span>
              <strong>${selectedPayment.serviceName}</strong>
            </div>
            <div class="row">
              <span>Клиент:</span>
              <strong>${selectedPayment.clientName}</strong>
            </div>
            <div class="row">
              <span>Телефон:</span>
              <span>${selectedPayment.clientPhone}</span>
            </div>
            <div class="row">
              <span>Дата и время:</span>
              <span>${formatDate(selectedPayment.date)}</span>
            </div>
            <div class="row">
              <span>Статус:</span>
              <span class="status">${getStatusLabel(selectedPayment.status)}</span>
            </div>
          </div>
          
          ${(selectedPayment.paymentMethods.cash > 0 || selectedPayment.paymentMethods.transfer > 0) ? `
          <div class="section">
            <h3>Методы оплаты:</h3>
            ${selectedPayment.paymentMethods.cash > 0 ? `
            <div class="row">
              <span>Наличные:</span>
              <strong>${formatPrice(selectedPayment.paymentMethods.cash)} сум</strong>
            </div>
            ` : ""}
            ${selectedPayment.paymentMethods.transfer > 0 ? `
            <div class="row">
              <span>Перевод:</span>
              <strong>${formatPrice(selectedPayment.paymentMethods.transfer)} сум</strong>
            </div>
            ` : ""}
          </div>
          ` : ""}
          
          <div class="total">
            ИТОГО: ${formatPrice(selectedPayment.amount)} сум
          </div>
          
          ${selectedPayment.comment ? `
          <div class="section">
            <h3>Комментарий:</h3>
            <p>${selectedPayment.comment}</p>
          </div>
          ` : ""}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleShareReceipt = async () => {
    if (!selectedPayment) return;
    
    const receiptData = {
      title: `Чек оплаты - ${selectedPayment.orderId}`,
      text: `Чек оплаты\nУслуга: ${selectedPayment.serviceName}\nКлиент: ${selectedPayment.clientName}\nСумма: ${formatPrice(selectedPayment.amount)} сум\nДата: ${formatDate(selectedPayment.date)}`,
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(receiptData);
      } catch (err: any) {
        // Игнорируем ошибку отмены пользователем
        if (err.name === "AbortError" || err.message === "Share canceled") {
          // Пользователь отменил отправку - ничего не делаем
          return;
        }
        // Для других ошибок показываем сообщение
        console.error("Ошибка при отправке:", err);
        // Fallback: копируем в буфер обмена
        try {
          await navigator.clipboard.writeText(receiptData.text);
          alert("Информация о чеке скопирована в буфер обмена!");
        } catch (clipboardErr) {
          console.error("Ошибка при копировании:", clipboardErr);
        }
      }
    } else {
      // Fallback: копируем в буфер обмена
      try {
        await navigator.clipboard.writeText(receiptData.text);
        alert("Информация о чеке скопирована в буфер обмена!");
      } catch (err) {
        console.error("Ошибка при копировании:", err);
        alert("Не удалось скопировать информацию");
      }
    }
  };

  const handleCopyLink = async () => {
    if (!selectedPayment) return;
    
    const link = `${window.location.origin}${window.location.pathname}?payment=${selectedPayment.id}`;
    try {
      await navigator.clipboard.writeText(link);
      alert("Ссылка скопирована в буфер обмена!");
    } catch (err) {
      console.error("Ошибка при копировании:", err);
      alert("Не удалось скопировать ссылку");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Оплачено";
      case "pending":
        return "В обработке";
      case "cancelled":
        return "Отменен";
      default:
        return status;
    }
  };

  // Генерируем инициалы для аватара
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Генерируем цвет для аватара на основе имени
  const getAvatarColor = (name: string) => {
    const colors = [
      "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
      "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#14B8A6"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header with title and count */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            История оплат
          </h1>
          <span style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            background: "var(--muted)",
            border: "1px solid var(--card-border)",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--foreground)",
          }}>
            {filteredPayments.length} {filteredPayments.length === 1 ? "оплата" : filteredPayments.length < 5 ? "оплаты" : "оплат"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            style={{
              padding: "0.625rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              background: "var(--background)",
              color: "var(--foreground)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--background)";
            }}
          >
            Настройки
          </button>
          <button
            style={{
              padding: "0.625rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              background: "var(--foreground)",
              color: "var(--background)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Экспорт всех
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedPayments.size > 0 && (
        <Card style={{ padding: "1rem", background: "var(--muted)", border: "1px solid var(--card-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--foreground)" }}>
                Выбрано: {selectedPayments.size} {selectedPayments.size === 1 ? "оплата" : selectedPayments.size < 5 ? "оплаты" : "оплат"}
              </span>
            </div>
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              style={{
                padding: "0.625rem 1rem",
                borderRadius: "8px",
                border: "1px solid #EF4444",
                background: "var(--background)",
                color: "#EF4444",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--background)";
              }}
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </button>
          </div>
        </Card>
      )}

      {/* Search and filters */}
      <Card style={{ padding: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "400px", minWidth: "250px" }}>
            <Search className="h-4 w-4" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem 0.625rem 2.5rem",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              style={{
                position: "relative",
                padding: "0.625rem",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "var(--background)",
                color: "var(--foreground)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--background)";
              }}
            >
              <Filter className="h-4 w-4" />
              {serviceFilter !== "all" && (
                <span style={{
                  position: "absolute",
                  top: "-0.25rem",
                  right: "-0.25rem",
                  width: "1rem",
                  height: "1rem",
                  borderRadius: "50%",
                  background: "#EF4444",
                  border: "2px solid var(--background)",
                  fontSize: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                }}>
                  1
              </span>
              )}
            </button>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{
                padding: "0.625rem 2.5rem 0.625rem 0.875rem",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "var(--background)",
                fontSize: "0.875rem",
                color: "var(--foreground)",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                transition: "all 0.2s ease",
                minWidth: "180px",
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
              <option value="all">Все услуги</option>
              {uniqueServices.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Таблица оплат */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4rem" }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
        </div>
      ) : filteredPayments.length === 0 ? (
        <Card style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--muted-foreground)" }}>История оплат пуста</p>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedPayments.size > 0 && selectedPayments.size === filteredPayments.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{
                        width: "1rem",
                        height: "1rem",
                        cursor: "pointer",
                      }}
                    />
                  </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    ИМЯ
                  </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    КОНТАКТЫ
                  </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    УСЛУГА
                  </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    СУММА
                  </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    МЕТОД ОПЛАТЫ
                  </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    СТАТУС
                  </th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    textAlign: "left", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--card-border)",
                  }}>
                    ДАТА
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => {
                  const avatarColor = getAvatarColor(payment.clientName);
                  const initials = getInitials(payment.clientName);
                  const progress = payment.status === "completed" ? 100 : payment.status === "pending" ? 50 : 0;
                  
                  return (
                  <tr
                    key={payment.id}
                    style={{
                      borderBottom: index < filteredPayments.length - 1 ? "1px solid var(--card-border)" : "none",
                      cursor: "pointer",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--muted)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => handlePaymentClick(payment)}
                  >
                      <td style={{ padding: "1rem" }}>
                        <input
                          type="checkbox"
                          checked={selectedPayments.has(payment.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectPayment(payment.id, e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: "1rem",
                            height: "1rem",
                            cursor: "pointer",
                          }}
                        />
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            borderRadius: "50%",
                            background: avatarColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}>
                            {initials}
                          </div>
                          <div>
                      {payment.clientId ? (
                        <button
                          onClick={(e) => handleClientClick(e, payment)}
                          style={{
                            color: "var(--foreground)",
                            textDecoration: "none",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            padding: 0,
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                            transition: "color 0.2s ease",
                                  textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "rgba(99, 102, 241, 1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--foreground)";
                          }}
                        >
                          {payment.clientName}
                        </button>
                      ) : (
                              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                                {payment.clientName}
                              </span>
                      )}
                          </div>
                        </div>
                    </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <span style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>
                            {payment.clientPhone}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                          {(() => {
                            let name = payment.serviceName || "Услуга";
                            if (payment.serviceCategory && name.includes(`(${payment.hours}`)) {
                              name = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
                            }
                            return name;
                          })()}
                        </span>
                          {payment.serviceCategory && (
                            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                              {payment.serviceCategory}
                            </span>
                          )}
                      </div>
                    </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                      {formatPrice(payment.amount)} сум
                        </span>
                    </td>
                      <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {payment.paymentMethods.cash > 0 && (
                          <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                              Наличные
                          </span>
                        )}
                        {payment.paymentMethods.transfer > 0 && (
                          <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                              Перевод
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                          padding: "0.375rem 0.75rem",
                          borderRadius: "9999px",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                          background: getStatusColor(payment.status) + "15",
                        color: getStatusColor(payment.status),
                        display: "inline-block",
                      }}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                      {formatDate(payment.date)}
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {filteredPayments.length > 0 && (
            <div style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--card-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--muted)",
            }}>
                      <button
                        style={{
                  padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          border: "1px solid var(--card-border)",
                          background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--muted)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--background)";
                        }}
                      >
                Previous
                      </button>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--foreground)",
                    color: "var(--background)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  1
                </button>
                <button
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                  }}
                >
                  2
                </button>
                <span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>...</span>
                <button
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                  }}
                >
                  8
                </button>
                <button
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                  }}
                >
                  9
                </button>
          </div>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--background)";
                }}
              >
                Next &gt;
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Модальное окно массового удаления */}
      <Modal
        open={bulkDeleteModalOpen}
        onClose={() => {
          if (!bulkDeleting) {
            setBulkDeleteModalOpen(false);
          }
        }}
        title="Подтверждение удаления"
      >
        <div style={{ padding: "0", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p style={{ color: "var(--foreground)", fontSize: "0.875rem" }}>
            Вы уверены, что хотите удалить <strong>{selectedPayments.size}</strong> {selectedPayments.size === 1 ? "платеж" : selectedPayments.size < 5 ? "платежа" : "платежей"}?
          </p>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
            Это действие нельзя отменить.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setBulkDeleteModalOpen(false);
              }}
              disabled={bulkDeleting}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: bulkDeleting ? "not-allowed" : "pointer",
                opacity: bulkDeleting ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "8px",
                border: "1.5px solid transparent",
                background: bulkDeleting ? "rgba(239, 68, 68, 0.5)" : "#EF4444",
                color: "#FFFFFF",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: bulkDeleting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {bulkDeleting ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setPaymentToDelete(null);
          }
        }}
        title="Подтверждение удаления"
      >
        {paymentToDelete && (
          <div style={{ padding: "0", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p style={{ color: "var(--foreground)", fontSize: "0.875rem" }}>
              Вы уверены, что хотите удалить платеж от <strong>{paymentToDelete.clientName}</strong> на сумму <strong>{formatPrice(paymentToDelete.amount)} сум</strong>?
            </p>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
              Это действие нельзя отменить.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPaymentToDelete(null);
                }}
                disabled={deleting}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.5 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "10px",
                  border: "1.5px solid transparent",
                  background: deleting ? "rgba(239, 68, 68, 0.5)" : "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                  color: "#FFFFFF",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {deleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Модальное окно с деталями оплаты */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPayment(null);
        }}
        title="Детали оплаты"
      >
        {selectedPayment && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header with order ID and status */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "1rem",
              borderBottom: "1px solid var(--card-border)",
            }}>
                <div>
                <div style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 500, 
                  color: "var(--muted-foreground)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em", 
                  marginBottom: "0.5rem" 
                }}>
                    Номер заказа
                  </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)" }}>
                    {selectedPayment.orderId}
                  </div>
                </div>
                <div style={{
                  padding: "0.5rem 0.875rem",
                  borderRadius: "8px",
                background: getStatusColor(selectedPayment.status) + "15",
                  border: `1px solid ${getStatusColor(selectedPayment.status)}40`,
                }}>
                  <span style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: getStatusColor(selectedPayment.status),
                  }}>
                    {getStatusLabel(selectedPayment.status)}
                  </span>
              </div>
            </div>

            {/* Main content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Услуга */}
              <div style={{
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
              }}>
                  <div style={{
                  fontSize: "0.75rem", 
                  fontWeight: 500, 
                  color: "var(--muted-foreground)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em", 
                  marginBottom: "0.75rem" 
                }}>
                  Услуга
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <CreditCard className="h-5 w-5" style={{ color: "#fff" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
                      {selectedPayment.serviceName}
                    </div>
                    {selectedPayment.serviceCategory && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>
                        {selectedPayment.serviceCategory}
                      </div>
                    )}
                    {(selectedPayment.hours !== null && selectedPayment.hours > 0) && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                        {selectedPayment.hours} {selectedPayment.hours === 1 ? 'час' : selectedPayment.hours < 5 ? 'часа' : 'часов'}
                      </div>
                    )}
                    {selectedPayment.hours === null && selectedPayment.quantity > 1 && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                        Количество: {selectedPayment.quantity} шт.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Клиент */}
              <div style={{
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
              }}>
                  <div style={{
                  fontSize: "0.75rem", 
                  fontWeight: 500, 
                  color: "var(--muted-foreground)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em", 
                  marginBottom: "0.75rem" 
                }}>
                  Клиент
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    background: getAvatarColor(selectedPayment.clientName),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {getInitials(selectedPayment.clientName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    {selectedPayment.clientId ? (
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          router.push(`/body/clients/${selectedPayment.clientId}`);
                        }}
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "color 0.2s ease",
                          marginBottom: "0.25rem",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "rgba(99, 102, 241, 1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--foreground)";
                        }}
                      >
                        {selectedPayment.clientName}
                      </button>
                    ) : (
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
                        {selectedPayment.clientName}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Phone className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                      <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                    {selectedPayment.clientPhone}
                  </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Методы оплаты */}
              {(selectedPayment.paymentMethods.cash > 0 || selectedPayment.paymentMethods.transfer > 0) && (
                <div style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "1px solid var(--card-border)",
                  background: "var(--muted)",
                }}>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 500, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    marginBottom: "0.75rem" 
                  }}>
                    Методы оплаты
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {selectedPayment.paymentMethods.cash > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Наличные</span>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                          {formatPrice(selectedPayment.paymentMethods.cash)} сум
                        </span>
                      </div>
                    )}
                    {selectedPayment.paymentMethods.transfer > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Перевод</span>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--foreground)" }}>
                          {formatPrice(selectedPayment.paymentMethods.transfer)} сум
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Итого */}
              <div style={{
                padding: "1.25rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--background)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>Итого</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)" }}>
                  {formatPrice(selectedPayment.amount)} сум
                </span>
              </div>

              {/* Дата и время */}
              <div style={{
                padding: "0.875rem 1rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
              }}>
                <Calendar className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>
                  {formatDate(selectedPayment.date)}
                </span>
              </div>

              {/* Комментарий */}
              {selectedPayment.comment && (
                <div style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "1px solid var(--card-border)",
                  background: "var(--muted)",
                }}>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 500, 
                    color: "var(--muted-foreground)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em", 
                    marginBottom: "0.5rem" 
                  }}>
                    Комментарий
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--foreground)", lineHeight: "1.5" }}>
                    {selectedPayment.comment}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--card-border)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <button
                  onClick={handleDownloadReceipt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Download className="h-4 w-4" />
                  Скачать чек
                </button>
                <button
                  onClick={handlePrintReceipt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Печать
                </button>
                <button
                  onClick={handleShareReceipt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  Отправить
                </button>
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Копировать ссылку
                </button>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setPaymentToDelete(selectedPayment);
                  setDeleteModalOpen(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #EF4444",
                  background: "transparent",
                  color: "#EF4444",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Trash2 className="h-4 w-4" />
                Удалить платеж
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

