"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type BookingStatus = "arrived" | "no_show" | "waiting" | "trial";

interface BookingItem {
  id: string;
  time: string;
  client: string;
  phone: string;
  service: string;
  coach: string;
  room: string;
  status: BookingStatus;
}

const BOOKING_STATUS_SEQUENCE: BookingStatus[] = ["arrived", "waiting", "trial", "no_show"];

const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; tone: string; dot: string }> = {
  arrived: { label: "Пришёл", tone: "var(--success-strong)", dot: "#16a34a" },
  waiting: { label: "Ожидается", tone: "#2563eb", dot: "#2563eb" },
  trial: { label: "Первая тренировка", tone: "#1e293b", dot: "#475569" },
  no_show: { label: "Не пришёл", tone: "#dc2626", dot: "#dc2626" },
};

const INITIAL_BOOKINGS: BookingItem[] = [
  { id: "b1", time: "09:00", client: "Иван Петров", phone: "+998 90 123 45 67", service: "Йога · База", coach: "Анна", room: "Зал 1", status: "arrived" },
  { id: "b2", time: "10:30", client: "Мария Сидорова", phone: "+998 90 123 45 67", service: "Пилатес · Мат", coach: "Ольга", room: "Зал 2", status: "no_show" },
  { id: "b3", time: "12:00", client: "Дмитрий Волков", phone: "+998 90 123 45 67", service: "Реформер · Индивид", coach: "Елена", room: "Зал 1", status: "waiting" },
  { id: "b4", time: "18:30", client: "Алина Орлова", phone: "+998 90 123 45 67", service: "Jazz-funk", coach: "Катя", room: "Зал 1", status: "trial" },
];

export default function TodayBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [bookingStatus, setBookingStatus] = useState(() => {
    const map: Record<string, BookingStatus> = {};
    for (const booking of INITIAL_BOOKINGS) {
      map[booking.id] = booking.status;
    }
    return map;
  });

  const bookings = useMemo(() => {
    if (statusFilter === "all") return INITIAL_BOOKINGS;
    return INITIAL_BOOKINGS.filter((b) => bookingStatus[b.id] === statusFilter);
  }, [statusFilter, bookingStatus]);

  const handleBookingStatusClick = (id: string) => {
    setBookingStatus((prev) => {
      const current = prev[id];
      const nextIndex = (BOOKING_STATUS_SEQUENCE.indexOf(current) + 1) % BOOKING_STATUS_SEQUENCE.length;
      return { ...prev, [id]: BOOKING_STATUS_SEQUENCE[nextIndex] };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Записи на сегодня</h1>
        <p className="text-sm text-zinc-500 mt-1">Следите за статусом посещений и реагируйте мгновенно.</p>
      </div>

      <Card className="body-clients__bookings">
        <div className="body-clients__bookings-header">
          <div>
            <span>Записи на сегодня</span>
            <p>Следите за статусом посещений и реагируйте мгновенно.</p>
          </div>
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
              {bookings.map((booking) => {
                const status = bookingStatus[booking.id];
                const config = BOOKING_STATUS_CONFIG[status];
                return (
                  <tr key={booking.id}>
                    <td>{booking.time}</td>
                    <td>{booking.client}</td>
                    <td>{booking.phone}</td>
                    <td>{booking.service}</td>
                    <td>{booking.coach} · {booking.room}</td>
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
        </div>
      </Card>
    </div>
  );
}

