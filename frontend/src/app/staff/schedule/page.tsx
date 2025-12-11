"use client";

import { useState, useMemo } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Plus, Calendar, Filter, ChevronLeft, ChevronRight, Copy, Dumbbell, Building2, Coffee } from "lucide-react";

type Shift = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: "Body" | "Coffee" | "Coworking";
  date: string;
  startTime: string;
  endTime: string;
  zone?: string;
};

const MOCK_SHIFTS: Shift[] = [
  { id: "s1", employeeId: "e1", employeeName: "Иван Петров", department: "Body", date: "2025-11-10", startTime: "09:00", endTime: "17:00", zone: "Зал 1" },
  { id: "s2", employeeId: "e2", employeeName: "Мария Сидорова", department: "Coffee", date: "2025-11-10", startTime: "08:00", endTime: "16:00", zone: "Касса" },
  { id: "s3", employeeId: "e4", employeeName: "Дмитрий Волков", department: "Body", date: "2025-11-11", startTime: "10:00", endTime: "18:00", zone: "Зал 2" },
];

const EMPLOYEES = [
  { id: "e1", name: "Иван Петров", department: "Body" },
  { id: "e2", name: "Мария Сидорова", department: "Coffee" },
  { id: "e3", name: "Анна Козлова", department: "Coworking" },
  { id: "e4", name: "Дмитрий Волков", department: "Body" },
];

export default function StaffSchedulePage() {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [filterDepartment, setFilterDepartment] = useState("Все");
  const [filterRole, setFilterRole] = useState("Все");

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const dates: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i));
    }
    return dates;
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return MOCK_SHIFTS.filter(s => s.date === dateStr);
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Body": return "#6366F1";
      case "Coffee": return "#F59E0B";
      case "Coworking": return "#10B981";
      default: return "#6B7280";
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case "Body": return Dumbbell;
      case "Coffee": return Coffee;
      case "Coworking": return Building2;
      default: return Building2;
    }
  };

  const filteredShifts = useMemo(() => {
    return MOCK_SHIFTS.filter(s => {
      if (filterDepartment !== "Все" && s.department !== filterDepartment) return false;
      return true;
    });
  }, [filterDepartment]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA STAFF · График и смены</h1>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            <Copy className="h-4 w-4" /> Дублировать шаблон
          </button>
          <button className="btn-outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Назначить смену
          </button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>Вид:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === "day" ? "font-medium" : ""}`}
              style={view === "day" ? { background: '#6366F1' + "20", color: '#6366F1' } : { background: 'var(--muted)', color: 'var(--foreground)' }}
              onClick={() => setView("day")}
            >
              День
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === "week" ? "font-medium" : ""}`}
              style={view === "week" ? { background: '#6366F1' + "20", color: '#6366F1' } : { background: 'var(--muted)', color: 'var(--foreground)' }}
              onClick={() => setView("week")}
            >
              Неделя
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === "month" ? "font-medium" : ""}`}
              style={view === "month" ? { background: '#6366F1' + "20", color: '#6366F1' } : { background: 'var(--muted)', color: 'var(--foreground)' }}
              onClick={() => setView("month")}
            >
              Месяц
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="h-8 px-3 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}
              onClick={() => setCurrentDate(new Date())}
            >
              Сегодня
            </button>
            <button
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              onClick={() => navigateDate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 py-1.5 text-sm font-medium min-w-[200px] text-center" style={{ color: 'var(--foreground)' }}>
              {view === "day" && currentDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              {view === "week" && (
                <>
                  {getWeekDates()[0].toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} - {getWeekDates()[6].toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                </>
              )}
              {view === "month" && currentDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
            </div>
            <button
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              onClick={() => navigateDate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
              <Filter className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500">Отдел</span>
              <select
                className="bg-transparent px-2 py-0.5 text-sm border-0 focus:outline-none"
                style={{ border: 'none' }}
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option>Все</option>
                <option>Body</option>
                <option>Coffee</option>
                <option>Coworking</option>
              </select>
            </div>
          </div>
        </div>

        {/* Week View */}
        {view === "week" && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 8 }}>
              <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
                <tr>
                  <th className="py-3 pr-4" style={{ color: 'var(--foreground)' }}>Сотрудник</th>
                  {getWeekDates().map((date, idx) => (
                    <th key={idx} className="py-3 pr-4 text-center" style={{ color: 'var(--foreground)' }}>
                      <div>{weekDays[idx]}</div>
                      <div className="text-xs text-zinc-500">{date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.filter(e => filterDepartment === "Все" || e.department === filterDepartment).map((employee) => {
                  const departmentColor = getDepartmentColor(employee.department);
                  return (
                    <tr key={employee.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                      <td className="py-3 pr-4">
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{employee.name}</span>
                      </td>
                      {getWeekDates().map((date, idx) => {
                        const shifts = getShiftsForDate(date).filter(s => s.employeeId === employee.id);
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                          <td key={idx} className="py-2 pr-4">
                            {shifts.length > 0 ? (
                              <button
                                className="w-full p-2 rounded-xl text-left transition-all hover:scale-105"
                                style={{
                                  background: departmentColor + "15",
                                  border: `1px solid ${isToday ? '#6366F1' : departmentColor + "40"}`,
                                  boxShadow: isToday ? '0 0 0 2px rgba(99, 102, 241, 0.25)' : undefined,
                                }}
                                onClick={() => setSelectedShift(shifts[0])}
                              >
                                <div className="text-xs font-medium mb-1" style={{ color: departmentColor }}>
                                  {shifts[0].startTime} - {shifts[0].endTime}
                                </div>
                                {shifts[0].zone && (
                                  <div className="text-[10px] text-zinc-500">{shifts[0].zone}</div>
                                )}
                              </button>
                            ) : (
                              <button
                                className="w-full h-12 rounded-xl transition-all hover:scale-105"
                                style={{
                                  background: isToday ? '#6366F1' + "10" : 'var(--muted)',
                                  border: `1px solid ${isToday ? '#6366F1' : 'var(--card-border)'}`,
                                }}
                                onClick={() => {
                                  setOpen(true);
                                  setCurrentDate(date);
                                }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Month View */}
        {view === "month" && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium py-2" style={{ color: 'var(--foreground)' }}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getMonthDates().map((date, idx) => {
                if (!date) {
                  return <div key={idx} className="h-24" />;
                }
                const shifts = getShiftsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <button
                    key={idx}
                    className="h-24 p-1.5 rounded-xl transition-all hover:scale-105 text-left"
                    style={{
                      background: isToday ? '#6366F1' + "10" : 'var(--muted)',
                      border: `1px solid ${isToday ? '#6366F1' : 'var(--card-border)'}`,
                    }}
                    onClick={() => {
                      setCurrentDate(date);
                      setView("day");
                    }}
                  >
                    <div className="text-xs font-medium mb-1" style={{ color: isToday ? '#6366F1' : 'var(--foreground)' }}>
                      {date.getDate()}
                    </div>
                    {shifts.slice(0, 2).map((shift) => {
                      const departmentColor = getDepartmentColor(shift.department);
                      return (
                        <div
                          key={shift.id}
                          className="text-[9px] px-1 py-0.5 rounded truncate mb-0.5"
                          style={{ background: departmentColor + "30", color: departmentColor }}
                        >
                          {shift.employeeName}
                        </div>
                      );
                    })}
                    {shifts.length > 2 && (
                      <div className="text-[9px] text-zinc-500">+{shifts.length - 2}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Назначить смену">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Сотрудник</label>
              <select
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              >
                <option value="">Выберите сотрудника</option>
                {EMPLOYEES.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Дата</label>
              <input
                type="date"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                defaultValue={currentDate.toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Время начала</label>
              <input
                type="time"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Время окончания</label>
              <input
                type="time"
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Зона</label>
              <input
                className="h-9 w-full px-3 text-sm"
                style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}
                placeholder="Введите зону"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn-outline flex-1" onClick={() => setOpen(false)}>
              Отмена
            </button>
            <button
              className="btn-outline flex-1"
              style={{ background: '#10B981' + "20", color: '#10B981', borderColor: '#10B981' }}
              onClick={() => setOpen(false)}
            >
              Сохранить
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selectedShift} onClose={() => setSelectedShift(null)} title={`Смена: ${selectedShift?.employeeName}`}>
        {selectedShift && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-xs text-zinc-500 mb-1">Дата</div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {new Date(selectedShift.date).toLocaleDateString("ru-RU")}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-xs text-zinc-500 mb-1">Время</div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {selectedShift.startTime} - {selectedShift.endTime}
                </div>
              </div>
              {selectedShift.zone && (
                <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                  <div className="text-xs text-zinc-500 mb-1">Зона</div>
                  <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedShift.zone}</div>
                </div>
              )}
            </div>
            <button className="btn-outline w-full" onClick={() => setSelectedShift(null)}>
              Закрыть
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}


