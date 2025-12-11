"use client";

import { useState, useEffect, useMemo } from "react";
import Modal from "@/components/Modal";
import Card from "@/components/Card";
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
} from "lucide-react";
import { fetchPayments, Payment } from "@/lib/api";

interface PaymentHistoryItem {
  id: string;
  orderId: string;
  date: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
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
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const data = await fetchPayments(serviceFilter !== "all" ? serviceFilter : undefined);
        const mapped: PaymentHistoryItem[] = data.map((p: Payment) => ({
          id: p.public_id,
          orderId: p.public_id.substring(0, 8).toUpperCase(),
          date: p.created_at,
          clientName: p.client_name || "Не указан",
          clientPhone: p.client_phone || "—",
          serviceName: p.service_name,
          amount: p.total_amount,
          paymentMethods: {
            cash: p.cash_amount,
            transfer: p.transfer_amount,
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
      
      return matchesSearch && matchesService;
    });
  }, [payments, search, serviceFilter]);

  const handlePaymentClick = (payment: PaymentHistoryItem) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
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

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Поиск и фильтры */}
      <Card style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "400px", minWidth: "250px" }}>
            <Search className="h-4 w-4" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по клиенту, услуге..."
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem 0.625rem 2.5rem",
                borderRadius: "10px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "8px", background: "var(--muted)", border: "1px solid var(--card-border)" }}>
              <Filter className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Услуга
              </span>
            </div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{
                padding: "0.625rem 2.5rem 0.625rem 0.875rem",
                borderRadius: "10px",
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
                minWidth: "220px",
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
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)", background: "var(--muted)" }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    КЛИЕНТ
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ЧТО ОПЛАЧЕНО
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    СУММА
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    СПОСОБ ОПЛАТЫ
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    СТАТУС
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ВРЕМЯ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
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
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--foreground)" }}>
                      {payment.clientName}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--foreground)", fontWeight: 500 }}>
                      {payment.serviceName}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--foreground)", fontWeight: 600 }}>
                      {formatPrice(payment.amount)} сум
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--foreground)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {payment.paymentMethods.cash > 0 && (
                          <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                            Наличные: {formatPrice(payment.paymentMethods.cash)} сум
                          </span>
                        )}
                        {payment.paymentMethods.transfer > 0 && (
                          <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                            Перевод: {formatPrice(payment.paymentMethods.transfer)} сум
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        padding: "0.375rem 0.625rem",
                        borderRadius: "6px",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        background: getStatusColor(payment.status) + "20",
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
          <div style={{ padding: "0", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Заголовок с номером заказа */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--card-border)",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                    Номер заказа
                  </div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)" }}>
                    {selectedPayment.orderId}
                  </div>
                </div>
                <div style={{
                  padding: "0.5rem 0.875rem",
                  borderRadius: "8px",
                  background: getStatusColor(selectedPayment.status) + "20",
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
            </div>

            {/* Основная информация */}
            <div style={{ padding: "0 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Услуга */}
              <div style={{
                padding: "1rem 1.25rem",
                borderRadius: "12px",
                background: "var(--muted)",
                border: "1px solid var(--card-border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <CreditCard className="h-5 w-5" style={{ color: "#fff" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                      Услуга
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--foreground)" }}>
                      {selectedPayment.serviceName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Клиент и контакты */}
              <div style={{
                padding: "1rem 1.25rem",
                borderRadius: "12px",
                background: "var(--muted)",
                border: "1px solid var(--card-border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <User className="h-5 w-5" style={{ color: "#fff" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                      Клиент
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--foreground)" }}>
                      {selectedPayment.clientName}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--card-border)" }}>
                  <Phone className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                  <span style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>
                    {selectedPayment.clientPhone}
                  </span>
                </div>
              </div>

              {/* Методы оплаты */}
              {(selectedPayment.paymentMethods.cash > 0 || selectedPayment.paymentMethods.transfer > 0) && (
                <div style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  background: "var(--muted)",
                  border: "1px solid var(--card-border)",
                }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                    Методы оплаты
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
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
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1.5px solid rgba(99, 102, 241, 0.2)",
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
                borderRadius: "10px",
                background: "var(--muted)",
                border: "1px solid var(--card-border)",
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
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  background: "var(--muted)",
                  border: "1px solid var(--card-border)",
                }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                    Комментарий
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--foreground)", lineHeight: "1.5" }}>
                    {selectedPayment.comment}
                  </div>
                </div>
              )}
            </div>

            {/* Быстрые действия */}
            <div style={{
              padding: "1.5rem",
              borderTop: "1px solid var(--card-border)",
              background: "var(--muted)",
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                Быстрые действия
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                <button
                  onClick={handleDownloadReceipt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.625rem",
                    padding: "0.875rem 1rem",
                    borderRadius: "10px",
                    border: "1.5px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.transform = "translateY(0)";
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
                    gap: "0.625rem",
                    padding: "0.875rem 1rem",
                    borderRadius: "10px",
                    border: "1.5px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.transform = "translateY(0)";
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
                    gap: "0.625rem",
                    padding: "0.875rem 1rem",
                    borderRadius: "10px",
                    border: "1.5px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.transform = "translateY(0)";
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
                    gap: "0.625rem",
                    padding: "0.875rem 1rem",
                    borderRadius: "10px",
                    border: "1.5px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Копировать ссылку
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

