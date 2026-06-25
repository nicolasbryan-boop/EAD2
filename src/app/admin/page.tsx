import Link from "next/link";
import {
  Users,
  BookOpen,
  GraduationCap,
  Ticket,
  ShoppingBag,
  Clock,
  Plus,
  Eye,
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { enterStudentPreview } from "@/lib/actions/preview";
import { formatBRL } from "@/lib/constants";

export const metadata = { title: "Admin — Trilogia do Sucesso" };

export default async function AdminHome() {
  const { admin } = await requireAdmin();

  const [
    students,
    publishedCourses,
    lessons,
    activeEnrollments,
    courseSales,
    pendingPayments,
    openTickets,
    recentProfiles,
    recentOrders,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    admin.from("lessons").select("id", { count: "exact", head: true }),
    admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .not("course_id", "is", null),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("profiles")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("orders")
      .select("id, amount_cents, status, course_id, credits_total, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Alunos", value: students.count ?? 0, icon: Users, href: "/admin/alunos" },
    { label: "Cursos publicados", value: publishedCourses.count ?? 0, icon: BookOpen, href: "/admin/conteudo" },
    { label: "Aulas cadastradas", value: lessons.count ?? 0, icon: GraduationCap, href: "/admin/conteudo" },
    { label: "Matrículas ativas", value: activeEnrollments.count ?? 0, icon: GraduationCap, href: "/admin/alunos" },
    { label: "Vendas de cursos", value: courseSales.count ?? 0, icon: ShoppingBag, href: "/admin/pagamentos" },
    { label: "Pagamentos pendentes", value: pendingPayments.count ?? 0, icon: Clock, href: "/admin/pagamentos" },
    { label: "Chamados abertos", value: openTickets.count ?? 0, icon: Ticket, href: "/admin/chamados" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Visão geral</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/conteudo">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> Novo curso
            </span>
          </Link>
          <Link href="/admin/alunos">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-surface-2">
              <Users className="h-4 w-4" /> Alunos
            </span>
          </Link>
          <form action={enterStudentPreview}>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-surface-2">
              <Eye className="h-4 w-4" /> Ver como aluno
            </button>
          </form>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href}>
              <Card className="hover:bg-surface-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-2xl font-semibold">{c.value}</p>
                <p className="text-sm text-muted">{c.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Últimos alunos */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Últimos alunos</h2>
          <Card className="divide-y divide-border p-0">
            {(recentProfiles.data ?? []).length === 0 ? (
              <CardDescription className="p-4">Nenhum aluno ainda.</CardDescription>
            ) : (
              (recentProfiles.data ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">{p.full_name ?? "Aluno"}</span>
                  <span className="text-xs text-muted">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Últimas compras */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Últimas compras</h2>
          <Card className="divide-y divide-border p-0">
            {(recentOrders.data ?? []).length === 0 ? (
              <CardDescription className="p-4">Nenhuma compra ainda.</CardDescription>
            ) : (
              (recentOrders.data ?? []).map((o) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm">
                      {o.course_id ? "Curso" : `${o.credits_total} créditos`}
                    </p>
                    <p className="text-xs text-muted">{formatBRL(o.amount_cents)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      o.status === "paid"
                        ? "bg-success/15 text-success"
                        : o.status === "pending"
                        ? "bg-warning/15 text-warning"
                        : "bg-surface-2 text-muted"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      <Card>
        <CardTitle>Atalhos</CardTitle>
        <CardDescription className="mb-3">
          Crie e organize o conteúdo no construtor de curso.
        </CardDescription>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/conteudo" className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-surface-2">
            Novo módulo / aula
          </Link>
          <Link href="/admin/alunos" className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-surface-2">
            Gerenciar alunos
          </Link>
          <Link href="/admin/pagamentos" className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-surface-2">
            Pagamentos
          </Link>
        </div>
      </Card>
    </div>
  );
}
