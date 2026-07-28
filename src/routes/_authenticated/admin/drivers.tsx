import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListDrivers, adminActivateSubscription, adminSetUserStatus, adminDeleteUser, adminToggleFlag } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/drivers")({ component: DriversPage });

function DriversPage() {
  const fn = useServerFn(adminListDrivers);
  const activate = useServerFn(adminActivateSubscription);
  const setStatus = useServerFn(adminSetUserStatus);
  const del = useServerFn(adminDeleteUser);
  const flag = useServerFn(adminToggleFlag);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin", "drivers"], queryFn: () => fn() });

  function invalidate() { qc.invalidateQueries({ queryKey: ["admin", "drivers"] }); }

  const sub = useMutation({ mutationFn: (id: string) => activate({ data: { driverId: id, plan: "monthly_60", days: 30 } }),
    onSuccess: () => { toast.success("تم تفعيل الاشتراك"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const susp = useMutation({ mutationFn: (v: { id: string; suspended: boolean }) => setStatus({ data: { role: "driver", id: v.id, suspended: v.suspended } }),
    onSuccess: (_, v) => { toast.success(v.suspended ? "تم الإيقاف" : "تمت الإعادة"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const delMut = useMutation({ mutationFn: (id: string) => del({ data: { role: "driver", id } }),
    onSuccess: () => { toast.success("تم الحذف"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const flagMut = useMutation({ mutationFn: (v: { id: string; flagged: boolean }) => flag({ data: { role: "driver", id: v.id, flagged: v.flagged } }),
    onSuccess: () => { toast.success("تم"); invalidate(); }, onError: (e: any) => toast.error(e.message) });

  const filtered = (data ?? []).filter((d: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (d.name ?? "").toLowerCase().includes(q) || (d.phone ?? "").includes(q) || (d.car_plate ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">السائقون ({filtered.length})</h2>
        <Input placeholder="بحث بالاسم/الجوال/اللوحة..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      {isLoading && <p className="text-muted-foreground">جاري التحميل...</p>}
      <div className="grid gap-3">
        {filtered.map((d: any) => (
          <Card key={d.id} className={`p-4 ${d.suspended ? "opacity-60 border-destructive" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  {d.name ?? "بدون اسم"}
                  {d.flagged && <Badge variant="destructive">مُعلَّم</Badge>}
                  {d.suspended && <Badge variant="destructive">موقوف</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {d.car_type} {d.car_model} - {d.car_color} - {d.car_plate} · {d.phone ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  TG:{d.telegram_id} · ⭐ {Number(d.rating_avg).toFixed(2)} · رحلات: {d.total_rides} · إلغاءات: {d.total_cancellations}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{d.subscription_status}</Badge>
                <Badge variant="outline">{d.status}</Badge>
                {d.subscription_status !== "active" && d.registration_complete && (
                  <Button size="sm" onClick={() => sub.mutate(d.id)} disabled={sub.isPending}>تفعيل اشتراك</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => flagMut.mutate({ id: d.id, flagged: !d.flagged })}>
                  {d.flagged ? "إزالة العلامة" : "تعليم"}
                </Button>
                {d.suspended ? (
                  <Button size="sm" variant="outline" onClick={() => susp.mutate({ id: d.id, suspended: false })}>إعادة تفعيل</Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => susp.mutate({ id: d.id, suspended: true })}>إيقاف</Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => { if (confirm(`حذف السائق ${d.name ?? d.id}؟ لا يمكن التراجع.`)) delMut.mutate(d.id); }}>
                  حذف
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !isLoading && <p className="text-muted-foreground">لا يوجد سائقون.</p>}
      </div>
    </div>
  );
}
