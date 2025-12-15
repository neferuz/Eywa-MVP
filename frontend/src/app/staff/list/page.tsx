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

  // Статистика
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.is_active).length;
    const admins = employees.filter((e) => e.role === "admin" || e.role === "super_admin").length;
    const managers = employees.filter((e) => e.role === "manager").length;
    
    return {
      total,
      active,
      admins,
      managers,
    };
  }, [employees]);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Всего сотрудников
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.total}</p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Активные
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.active}</p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Администраторы
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.admins}</p>
          </div>
        </Card>
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Менеджеры
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.managers}</p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card style={{ padding: "1.25rem" }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              placeholder="Поиск по имени, email, роли..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem 0.625rem 2.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  background: "var(--background)",
                  fontSize: "0.875rem",
                  color: "var(--foreground)",
                  outline: "none",
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
          <button
            type="button"
            onClick={openCreate}
              style={{
                padding: "0.625rem 1rem",
                borderRadius: "8px",
                border: "1px solid transparent",
                background: "var(--foreground)",
                color: "var(--background)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
          >
            <Plus className="h-4 w-4" />
            Добавить сотрудника
          </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
              Роль
            </span>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "all", label: "Все" },
                { value: "super_admin", label: "Супер Админ" },
                { value: "admin", label: "Админ" },
                { value: "manager", label: "Менеджер" },
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setRoleFilter(role.value as any)}
                  style={{
                    padding: "0.5rem 0.875rem",
                    borderRadius: "999px",
                    border: `1px solid ${roleFilter === role.value ? "transparent" : "var(--card-border)"}`,
                    background: roleFilter === role.value ? "var(--foreground)" : "transparent",
                    color: roleFilter === role.value ? "var(--background)" : "var(--foreground)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (roleFilter !== role.value) {
                      e.currentTarget.style.borderColor = "var(--foreground)";
                      e.currentTarget.style.opacity = "0.7";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (roleFilter !== role.value) {
                      e.currentTarget.style.borderColor = "var(--card-border)";
                      e.currentTarget.style.opacity = "1";
                    }
                  }}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)", background: "var(--muted)" }}>
              <tr>
                <th className="py-4 px-4" style={{ color: "var(--foreground)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Имя</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Роль</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Разрешения</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Статус</th>
                <th className="py-4 px-4" style={{ color: "var(--foreground)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Загрузка...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {search || roleFilter !== "all" ? "Сотрудники не найдены" : "Нет сотрудников"}
                  </td>
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
                  <tr 
                    key={employee.id} 
                    style={{ 
                      borderTop: "1px solid var(--card-border)",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--muted)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: roleColor + "20", color: roleColor }}>
                          {initials}
                        </div>
                        <span className="font-medium" style={{ color: "var(--foreground)", fontSize: "0.875rem" }}>{employee.name || employee.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-2" style={{ color: "var(--foreground)", fontSize: "0.875rem" }}>
                        <Mail className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                        {employee.email}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: roleColor + "15", color: roleColor }}>
                        {roleLabel}
                      </span>
                    </td>
                    <td className="py-4 px-4" style={{ color: "var(--foreground)", fontSize: "0.875rem" }}>{permissionsLabel}</td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium" style={{ color: employee.is_active ? "#10B981" : "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: employee.is_active ? "#10B981" : "var(--muted-foreground)" }} />
                        {employee.is_active ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 rounded-lg border transition-all"
                          style={{ 
                            borderColor: "var(--card-border)", 
                            color: "var(--foreground)",
                            background: "transparent",
                          }}
                          onClick={() => openEdit(employee)}
                          title="Редактировать"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--muted)";
                            e.currentTarget.style.borderColor = "var(--foreground)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "var(--card-border)";
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg border transition-all"
                          style={{ 
                            borderColor: "rgba(239, 68, 68, 0.2)", 
                            color: "#ef4444",
                            background: "rgba(239, 68, 68, 0.08)"
                          }}
                          onClick={() => handleDeleteClick(employee.id, employee.name || employee.email)}
                          title="Удалить"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                          }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Имя *
                </label>
                <div style={{ position: "relative" }}>
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                  <input
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
                    placeholder="Иван Иванов"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
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
                  Почта *
                </label>
                <div style={{ position: "relative" }}>
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                  <input
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
                    placeholder="user@mail.com"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
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
                  Пароль {editing ? "" : "*"}
                </label>
                <div style={{ position: "relative" }}>
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                  <input
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
                    placeholder={editing ? "Оставьте пустым, чтобы не менять" : "••••••••"}
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
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
                {editing && (
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                    Оставьте пустым, чтобы не менять пароль
                  </p>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Роль *
                </label>
                <select
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
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as Employee["role"])}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="super_admin">Супер-админ</option>
                  <option value="admin">Админ</option>
                  <option value="manager">Менеджер</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Доступ к страницам
                  </label>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                    Отметьте, что видно сотруднику
                  </p>
                </div>
                <button
                  type="button"
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    color: "var(--foreground)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setFormAccess(ACCESS_OPTIONS.map((o) => o.key))}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Выбрать все
                </button>
              </div>
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2" 
                style={{ 
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "var(--muted)",
                  border: "1px solid var(--card-border)",
                }}
              >
                {ACCESS_OPTIONS.map((opt) => {
                  const checked = formAccess.includes(opt.key);
                  return (
                    <label
                      key={opt.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: checked ? "var(--background)" : "transparent",
                        border: checked ? "1px solid var(--card-border)" : "1px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) {
                          e.currentTarget.style.background = "var(--background)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!checked) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{
                          width: "1rem",
                          height: "1rem",
                          borderRadius: "4px",
                          border: `2px solid ${checked ? "#6366F1" : "var(--card-border)"}`,
                          background: checked ? "#6366F1" : "transparent",
                          cursor: "pointer",
                          accentColor: "#6366F1",
                        }}
                        checked={checked}
                        onChange={() => toggleAccess(opt.key)}
                      />
                      <span style={{ fontSize: "0.875rem", color: "var(--foreground)", fontWeight: checked ? 500 : 400 }}>
                      {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--card-border)", justifyContent: "flex-end" }}>
            <button
              type="button"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid transparent",
                background: saving
                  ? "#9ca3af"
                  : "var(--foreground)",
                color: saving
                  ? "#ffffff"
                  : "var(--background)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: saving || !formName.trim() || !formEmail.trim() || (!editing && !formPassword.trim()) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: saving || !formName.trim() || !formEmail.trim() || (!editing && !formPassword.trim()) ? 0.5 : 1,
              }}
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formEmail.trim() || (!editing && !formPassword.trim())}
              onMouseEnter={(e) => {
                if (!saving && formName.trim() && formEmail.trim() && (editing || formPassword.trim())) {
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && formName.trim() && formEmail.trim() && (editing || formPassword.trim())) {
                  e.currentTarget.style.opacity = "1";
                }
              }}
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
