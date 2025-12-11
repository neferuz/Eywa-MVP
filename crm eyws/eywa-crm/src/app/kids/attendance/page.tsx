"use client";

import Card from "@/components/Card";
import { Calendar, Users } from "lucide-react";

const attendance = [
  { program: "STEAM Lab", week: "11–17 ноября", average: 8, load: 82 },
  { program: "Art Kids", week: "11–17 ноября", average: 7, load: 74 },
  { program: "Dance junior", week: "11–17 ноября", average: 6, load: 68 },
];

export default function KidsAttendancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Посещаемость Kids</h1>
      </div>
      <p className="text-sm text-zinc-500">Данные по группам за текущую неделю. Используйте, чтобы управлять расписанием и удержанием.</p>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {attendance.map((item) => (
            <div key={item.program} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.program}</div>
              <div className="text-xs text-zinc-500 mt-1">{item.week}</div>
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Users className="h-4 w-4 text-zinc-500" />
                <span>Средняя посещаемость: {item.average} детей</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full" style={{ background: 'var(--muted)' }}>
                <div className="h-full rounded-full" style={{ width: `${item.load}%`, background: '#6366F1' }} />
              </div>
              <div className="text-xs text-zinc-500 mt-1">Заполненность {item.load}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
