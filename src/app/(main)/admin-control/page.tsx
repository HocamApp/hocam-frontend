"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, CreditCard, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  approveAdminTestBooking,
  fetchAdminMonitor,
  grantAdminTestCredits,
  startAdminImpersonation,
  updateAdminTutorTestSettings,
} from "@/lib/adminControlApi";
import type { AdminTestAccount } from "@/types";

function displayName(account: AdminTestAccount) {
  const name = `${account.profile?.name ?? ""} ${account.profile?.surname ?? ""}`.trim();
  return name || account.email;
}

function AdminControlContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [credits, setCredits] = useState(10);

  const monitor = useQuery({
    queryKey: ["admin-control-monitor"],
    queryFn: fetchAdminMonitor,
    refetchInterval: 5_000,
  });

  const accounts = useMemo(() => monitor.data?.accounts ?? [], [monitor.data?.accounts]);
  const students = useMemo(() => accounts.filter((account) => account.role === "student"), [accounts]);
  const tutors = useMemo(() => accounts.filter((account) => account.role === "tutor" && account.profile), [accounts]);

  const impersonate = useMutation({
    mutationFn: ({ accountId }: { accountId: string; nextPath?: string }) => startAdminImpersonation(accountId),
    onSuccess: (user, variables) => {
      queryClient.clear();
      updateUser(user);
      router.push(variables.nextPath ?? (user.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student"));
    },
    onError: () => toast.error("Test hesabına geçilemedi."),
  });

  const approve = useMutation({
    mutationFn: approveAdminTestBooking,
    onSuccess: () => {
      toast.success("Test dersi onaylandı ve JaaS odası hazırlandı.");
      queryClient.invalidateQueries({ queryKey: ["admin-control-monitor"] });
    },
    onError: () => toast.error("Ders onaylanamadı."),
  });

  const grantCredits = useMutation({
    mutationFn: grantAdminTestCredits,
    onSuccess: () => {
      toast.success("Test kredileri tanımlandı. Gerçek ödeme kaydı oluşturulmadı.");
      queryClient.invalidateQueries({ queryKey: ["admin-control-monitor"] });
    },
    onError: () => toast.error("Test kredileri tanımlanamadı."),
  });

  const toggleAutoApprove = useMutation({
    mutationFn: ({ tutorProfileId, next }: { tutorProfileId: string; next: boolean }) =>
      updateAdminTutorTestSettings(tutorProfileId, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-control-monitor"] }),
    onError: () => toast.error("Otomatik onay ayarı değiştirilemedi."),
  });

  if (monitor.isLoading) {
    return <div className="mx-auto max-w-7xl p-8 text-sm text-muted-foreground">QA paneli yükleniyor…</div>;
  }
  if (monitor.isError || !monitor.data) {
    return <div className="mx-auto max-w-7xl p-8 text-sm text-destructive">QA paneli yüklenemedi.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" /> Staff-only QA tools</div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Test Merkezi</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Test hesapları, hızlandırılmış ders onayı ve ödeme dışı QA kredileri.</p>
        </div>
        <Button variant="outline" onClick={() => monitor.refetch()} disabled={monitor.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${monitor.isFetching ? "animate-spin" : ""}`} /> Yenile
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Test hesapları</CardDescription><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{accounts.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Aktif ders akışları</CardDescription><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5" />{monitor.data.bookings.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Kalan test kredileri</CardDescription><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{monitor.data.test_credit_grants.reduce((sum, grant) => sum + grant.remaining_credits, 0)}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Test kredisi tanımla</CardTitle><CardDescription>Bu kredi gerçek satın alma, ödeme veya hoca kazancı oluşturmaz.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            <option value="">Öğrenci seç</option>{students.map((student) => <option key={student.id} value={student.id}>{displayName(student)} · {student.email}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={tutorId} onChange={(event) => setTutorId(event.target.value)}>
            <option value="">Hoca seç</option>{tutors.map((tutor) => <option key={tutor.id} value={tutor.profile!.id}>{displayName(tutor)} · {tutor.email}</option>)}
          </select>
          <Input type="number" min={1} max={50} value={credits} onChange={(event) => setCredits(Number(event.target.value))} aria-label="Kredi adedi" />
          <Button disabled={!studentId || !tutorId || grantCredits.isPending} onClick={() => grantCredits.mutate({ student_id: studentId, tutor_id: tutorId, credits, expires_in_days: 30 })}>Kredi ver</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hesap monitörü</CardTitle><CardDescription>Yalnızca sunucuda test hesabı olarak işaretlenen kullanıcılar gösterilir.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 md:flex-row md:items-center">
              <div><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{displayName(account)}</span><Badge variant="secondary">{account.role === "tutor" ? "Hoca" : "Öğrenci"}</Badge>{account.last_seen_at && <Badge variant="outline">Son görülme {new Date(account.last_seen_at).toLocaleTimeString("tr-TR")}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{account.email}</p></div>
              <div className="flex flex-wrap gap-2">
                {account.role === "tutor" && account.profile && <Button variant="outline" size="sm" onClick={() => toggleAutoApprove.mutate({ tutorProfileId: account.profile!.id, next: !account.profile!.auto_approve_bookings })}>Oto onay: {account.profile.auto_approve_bookings ? "Açık" : "Kapalı"}</Button>}
                <Button size="sm" onClick={() => impersonate.mutate({ accountId: account.id })} disabled={impersonate.isPending}>Hesaba geç</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ders monitörü</CardTitle><CardDescription>Test öğrenci ve test hoca arasındaki aktif rezervasyonlar.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {monitor.data.bookings.length === 0 && <p className="text-sm text-muted-foreground">Aktif test rezervasyonu yok.</p>}
          {monitor.data.bookings.map((booking) => (
            <div key={booking.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 lg:flex-row lg:items-center">
              <div><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{displayName(booking.student)} → {displayName(booking.tutor)}</span><Badge>{booking.status}</Badge>{booking.uses_test_credit && <Badge variant="secondary">TEST CREDIT</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{booking.subject.name} · {new Date(booking.start_time).toLocaleString("tr-TR")} · {booking.duration_minutes} dk</p></div>
              <div className="flex flex-wrap gap-2">{booking.status === "pending" && <Button size="sm" onClick={() => approve.mutate(booking.id)} disabled={approve.isPending}><CheckCircle2 className="mr-2 h-4 w-4" />Hızlı onayla</Button>}{booking.room_url && <><Button size="sm" variant="outline" onClick={() => impersonate.mutate({ accountId: booking.student.id, nextPath: `/session/${booking.id}` })}>Öğrenci olarak JaaS</Button><Button size="sm" variant="outline" onClick={() => impersonate.mutate({ accountId: booking.tutor.id, nextPath: `/session/${booking.id}` })}>Hoca olarak JaaS</Button></>}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Son admin işlemleri</CardTitle></CardHeader>
        <CardContent className="space-y-2">{monitor.data.actions.slice(0, 12).map((action) => <div key={action.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm"><span><strong>{action.action}</strong>{action.target_email ? ` · ${action.target_email}` : ""}</span><span className="text-muted-foreground">{new Date(action.created_at).toLocaleString("tr-TR")}</span></div>)}</CardContent>
      </Card>
    </div>
  );
}

export default function AdminControlPage() {
  return <RouteGuard requireAdmin><AdminControlContent /></RouteGuard>;
}
