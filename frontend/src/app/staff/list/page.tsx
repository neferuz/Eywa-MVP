"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Plus, Search, Mail, User, Lock, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { fetchStaff, createStaff, updateStaff, deleteStaff, type StaffMember } from "@/lib/api";
import { toast } from "@pheralb/toast";

type AccessKey =
  | "dashboard"
  | "schedule"
  | "applications"
  | "payments"
  | "staff"
  | "analytics";

type Employee = {
  id: number;
  name?: string | null;
  email: string;
  role: "super_admin" | "admin" | "manager";
  access: AccessKey[];
  is_active: boolean;
};

const ACCESS_OPTIONS: { key: AccessKey; label: string }[] = [
  { key: "dashboard", label: "Дашборд" },
  { key: "schedule", label: "Расписание" },
  { key: "applications", label: "Заявки (канбан)" },
  { key: "payments", label: "Оплаты" },
  { key: "staff", label: "Сотрудники" },
  { key: "analytics", label: "Аналитика" },
];

export default function StaffListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Employee["role"]>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<Employee["role"]>("manager");
  const [formAccess, setFormAccess] = useState<AccessKey[]>(["dashboard", "schedule"]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesQ =
        !search ||
        (e.name && e.name.toLowerCase().includes(search.toLowerCase())) ||
        e.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || e.role === roleFilter;
      return matchesQ && matchesRole;
    });
  }, [employees, search, roleFilter]);

  const toggleAccess = (key: AccessKey) => {
    setFormAccess((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchStaff();
        setEmployees(
          data.map((u) => ({
            id: u.id,
            name: u.name ?? "",
            email: u.email,
            role: u.role,
            access: (u.access as AccessKey[]) ?? [],
            is_active: u.is_active,
          })),
        );
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить сотрудников");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = () => {
    if (!formName.trim() || !formEmail.trim()) {
      return;
    }
    
    // При редактировании пароль не обязателен, если он не меняется
    if (!editing && !formPassword.trim()) {
      return;
    }

    const payload: any = {
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      access: formAccess.length ? formAccess : ["dashboard"],
      is_active: true,
    };

    // Добавляем пароль только если он был введен
    if (editing) {
      if (formPassword && formPassword.trim()) {
        payload.password = formPassword;
      }
    } else {
      payload.password = formPassword;
    }

    const save = async () => {
      try {
        setSaving(true);
        if (editing) {
          const updated = await updateStaff(editing.id, payload);
          setEmployees((prev) =>
            prev.map((e) =>
              e.id === editing.id
                ? {
                    id: updated.id,
                    name: updated.name ?? payload.name,
                    email: updated.email,
                    role: updated.role,
                    access: (updated.access as AccessKey[]) ?? payload.access,
                    is_active: updated.is_active ?? true,
                  }
                : e
            )
          );
          setNotice({ type: "success", title: "Успешно", message: "Сотрудник обновлен." });
          toast.success({
            text: "Сотрудник обновлен",
          });
        } else {
          const created = await createStaff(payload);
          setEmployees((prev) => [
            {
              id: created.id,
              name: created.name ?? payload.name,
              email: created.email,
              role: created.role,
              access: (created.access as AccessKey[]) ?? payload.access,
              is_active: created.is_active ?? true,
            },
            ...prev,
          ]);
          setNotice({ type: "success", title: "Успешно", message: "Сотрудник добавлен." });
          toast.success({
            text: "Сотрудник добавлен",
          });
        }
        setFormName("");
        setFormEmail("");
        setFormPassword("");
        setFormRole("manager");
        setFormAccess(["dashboard", "schedule"]);
        setEditing(null);
        setOpen(false);
      } catch (err) {
        console.error(err);
        setError("Не удалось сохранить сотрудника");
        setNotice({ type: "error", title: "Ошибка", message: "Не удалось сохранить сотрудника." });
        toast.error({
          text: "Не удалось сохранить сотрудника",
        });
      } finally {
        setSaving(false);
      }
    };
    void save();
  };

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("manager");
    setFormAccess(["dashboard", "schedule"]);
    setOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setFormName(employee.name || "");
    setFormEmail(employee.email);
    setFormPassword(""); // Пустой пароль при редактировании
    setFormRole(employee.role);
    setFormAccess(employee.access);
    setOpen(true);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setEmployeeToDelete({ id, name: name || "сотрудника" });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteStaff(employeeToDelete.id);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      toast.success({
        text: `Сотрудник "${employeeToDelete.name}" успешно удален`,
      });
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить сотрудника");
      toast.error({
        text: "Не удалось удалить сотрудника",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5" style={{ background: "var(--background)" }}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              placeholder="Поиск по имени, email, роли..."
              className="h-12 w-full pl-10 pr-3 text-sm rounded-2xl"
              style={{ background: "var(--muted)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-12 px-4 rounded-2xl text-sm"
            style={{ background: "var(--muted)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="all">Все</option>
            <option value="super_admin">Супер Админ</option>
            <option value="admin">Админ</option>
            <option value="manager">Менеджер</option>
          </select>
          <button
            type="button"
            className="payments-add-btn"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Добавить сотрудника
          </button>
        </div>
      </Card>

      <Card className="p-0" style={{ background: "var(--background)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
              <tr>
                <th className="py-4 px-4" style={{ color: "var(--foreground)" }}>Имя</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)" }}>Email</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)" }}>Роль</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)" }}>Разрешения</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)" }}>Статус</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-zinc-500">Загрузка...</td>
                </tr>
              )}
              {!loading && filtered.map((employee) => {
                const initials = employee.name && employee.name.trim()
                  ? employee.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : employee.email.slice(0, 2).toUpperCase();
                const roleLabel =
                  employee.role === "super_admin"
                    ? "Супер Админ"
                    : employee.role === "admin"
                      ? "Админ"
                      : "Менеджер";
                const roleColor =
                  employee.role === "super_admin"
                    ? "#EF4444"
                    : employee.role === "admin"
                      ? "#F59E0B"
                      : "#0EA5E9";
                const permissionsLabel = `${employee.access.length} страниц`;
                return (
                  <tr key={employee.id} style={{ borderTop: "1px solid var(--card-border)" }} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: roleColor + "20", color: roleColor }}>
                          {initials}
                        </div>
                        <span className="font-medium" style={{ color: "var(--foreground)" }}>{employee.name || employee.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4" style={{ color: "var(--foreground)" }}>
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-zinc-500" />
                        {employee.email}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: roleColor + "15", color: roleColor }}>
                        {roleLabel}
                      </span>
                    </td>
                    <td className="py-4 px-4" style={{ color: "var(--foreground)" }}>{permissionsLabel}</td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium" style={{ color: "#10B981", display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: "#10B981" }} />
                        Активен
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 rounded-lg border transition-all hover:bg-black/[.02] dark:hover:bg-white/[.03]"
                          style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                          onClick={() => openEdit(employee)}
                          title="Редактировать"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg border transition-all staff-delete-btn"
                          style={{ 
                            borderColor: "rgba(239, 68, 68, 0.2)", 
                            color: "#ef4444",
                            background: "rgba(239, 68, 68, 0.08)"
                          }}
                          onClick={() => handleDeleteClick(employee.id, employee.name || employee.email)}
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? "Редактировать сотрудника" : "Добавить сотрудника"}>
        <div className="space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Имя *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                  <input
                    className="h-11 w-full rounded-xl border pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--muted)",
                      borderColor: "var(--card-border)",
                      color: "var(--foreground)",
                    }}
                    placeholder="Иван Иванов"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Почта *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                  <input
                    className="h-11 w-full rounded-xl border pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--muted)",
                      borderColor: "var(--card-border)",
                      color: "var(--foreground)",
                    }}
                    placeholder="user@mail.com"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Пароль {editing ? "" : "*"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                  <input
                    className="h-11 w-full rounded-xl border pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--muted)",
                      borderColor: "var(--card-border)",
                      color: "var(--foreground)",
                    }}
                    placeholder={editing ? "Оставьте пустым, чтобы не менять" : "••••••••"}
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                </div>
                {editing && (
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Оставьте пустым, чтобы не менять пароль
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Роль *
                </label>
                <select
                  className="h-11 w-full rounded-xl border px-4 text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--muted)",
                    borderColor: "var(--card-border)",
                    color: "var(--foreground)",
                  }}
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as Employee["role"])}
                >
                  <option value="super_admin">Супер-админ</option>
                  <option value="admin">Админ</option>
                  <option value="manager">Менеджер</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    Доступ к страницам
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Отметьте, что видно сотруднику</p>
                </div>
                <button
                  className="text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--foreground)" }}
                  onClick={() => setFormAccess(ACCESS_OPTIONS.map((o) => o.key))}
                >
                  Выбрать все
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--card-border)" }}>
                {ACCESS_OPTIONS.map((opt) => {
                  const checked = formAccess.includes(opt.key);
                  return (
                    <label
                      key={opt.key}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all hover:bg-black/[.02] dark:hover:bg-white/[.03]"
                      style={{
                        color: "var(--foreground)",
                      }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-2 transition-all"
                        style={{
                          accentColor: "#6366F1",
                          borderColor: checked ? "#6366F1" : "var(--card-border)",
                        }}
                        checked={checked}
                        onChange={() => toggleAccess(opt.key)}
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
              }}
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
            >
              Отмена
            </button>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{
                background: saving
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                boxShadow: saving ? "none" : "0 4px 12px rgba(99, 102, 241, 0.25)",
              }}
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formEmail.trim() || (!editing && !formPassword.trim())}
            >
              {saving ? "Сохраняю..." : "Сохранить"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmOpen(false);
            setEmployeeToDelete(null);
          }
        }}
        title="Подтверждение удаления"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
              <AlertTriangle className="h-6 w-6" style={{ color: "#EF4444" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Вы уверены, что хотите удалить сотрудника?
              </p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Сотрудник <strong>{employeeToDelete?.name}</strong> будет удален. Это действие нельзя отменить.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
              }}
              onClick={() => {
                setDeleteConfirmOpen(false);
                setEmployeeToDelete(null);
              }}
              disabled={isDeleting}
            >
              Отмена
            </button>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{
                background: isDeleting
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                boxShadow: isDeleting ? "none" : "0 4px 12px rgba(239, 68, 68, 0.25)",
              }}
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
