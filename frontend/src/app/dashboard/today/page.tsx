"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import { fetchTodayBookings } from "@/lib/api";

type BookingStatus = "arrived" | "no_show" | "waiting" | "trial";
type BookingSource = "crm" | "ai";

interface TodayBooking {
  id: string;
  time: string;
  client: string;
  phone: string;
  service: string;
  coach: string;
  room: string;
  status: BookingStatus;
  source: BookingSource;
  note?: string | null;
}

const BOOKING_STATUS_SEQUENCE: BookingStatus[] = ["arrived", "waiting", "trial", "no_show"];

const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; tone: string; dot: string }> = {
  arrived: { label: "Пришёл", tone: "var(--success-strong)", dot: "#16a34a" },
  waiting: { label: "Ожидается", tone: "#2563eb", dot: "#2563eb" },
  trial: { label: "Первая тренировка", tone: "#1e293b", dot: "#475569" },
  no_show: { label: "Не пришёл", tone: "#dc2626", dot: "#dc2626" },
};

export default function TodayBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [bookingStatus, setBookingStatus] = useState<Record<string, BookingStatus>>({});
  const [bookings, setBookings] = useState<TodayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchTodayBookings<TodayBooking>()
      .then((data) => {
        if (ignore) return;
        setBookings(data);
        setBookingStatus(
          data.reduce<Record<string, BookingStatus>>(
            (acc, booking) => ({ ...acc, [booking.id]: booking.status }),
            {}
          )
        );
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить записи");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    const augmented = bookings.map((booking) => ({
      ...booking,
      status: bookingStatus[booking.id] ?? booking.status,
    }));
    if (statusFilter === "all") return augmented;
    return augmented.filter((booking) => booking.status === statusFilter);
  }, [bookings, bookingStatus, statusFilter]);

  const handleBookingStatusClick = (id: string) => {
    setBookingStatus((prev) => {
      const fallback = bookings.find((b) => b.id === id)?.status ?? BOOKING_STATUS_SEQUENCE[0];
      const current = prev[id] ?? fallback;
      const nextIndex = (BOOKING_STATUS_SEQUENCE.indexOf(current) + 1) % BOOKING_STATUS_SEQUENCE.length;
      return { ...prev, [id]: BOOKING_STATUS_SEQUENCE[nextIndex] };
    });
  };

  return (
    <div className="space-y-6">
      <Card className="body-clients__bookings">
        <div className="body-clients__bookings-header" style={{ justifyContent: 'flex-end' }}>
          <div className="body-clients__filters">
            {["all", ...BOOKING_STATUS_SEQUENCE].map((status) => {
              const isActive = statusFilter === status;
              const info = status === "all" ? { label: "Все", dot: "rgba(15,23,42,0.25)" } : BOOKING_STATUS_CONFIG[status as BookingStatus];
              return (
                <button
                  key={status}
                  type="button"
                  className={`body-clients__filter ${isActive ? "is-active" : ""}`}
                  onClick={() => setStatusFilter(status as BookingStatus | "all")}
                >
                  <span className="body-clients__filter-dot" style={{ background: info.dot }} />
                  {info.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="body-clients__bookings-table-wrapper">
          {error && (
            <div className="body-clients__bookings-empty">
              <p>Не удалось загрузить данные: {error}</p>
            </div>
          )}
          {!error && loading && (
            <div className="body-clients__bookings-empty">
              <p>Загружаем записи...</p>
            </div>
          )}
          {!error && !loading && filteredBookings.length === 0 && (
            <div className="body-clients__bookings-empty">
              <p>На выбранный фильтр записей нет.</p>
            </div>
          )}
          {!error && filteredBookings.length > 0 && (
            <table className="body-clients__bookings-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Услуга</th>
                  <th>Тренер / Зал</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const status = booking.status;
                  const config = BOOKING_STATUS_CONFIG[status];
                  return (
                    <tr key={booking.id}>
                      <td>{booking.time}</td>
                      <td>{booking.client}</td>
                      <td>{booking.phone}</td>
                      <td>
                        <div className="body-clients__service-cell">
                          <span>{booking.service}</span>
                          <span className={`body-clients__source body-clients__source--${booking.source}`}>
                            {booking.source === "ai" ? "AI ассистент" : "CRM"}
                          </span>
                        </div>
                      </td>
                      <td>
                        {booking.coach} · {booking.room}
                        {booking.note && <p className="body-clients__note">{booking.note}</p>}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="body-clients__status-badge"
                          style={{ color: config.tone }}
                          onClick={() => handleBookingStatusClick(booking.id)}
                          title="Сменить статус"
                        >
                          <span className="body-clients__status-dot" style={{ background: config.dot }} />
                          {config.label}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

