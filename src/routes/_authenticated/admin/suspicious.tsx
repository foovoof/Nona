import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListSuspicious, adminToggleFlag, adminSetUserStatus } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/suspicious")({ component: SuspiciousPage });

function SuspiciousPage() {
  const fn = useServerFn(adminListSuspicious);
  const toggleFn = useServerFn(adminToggleFlag);
  const statusFn = useServerFn(adminSetUserStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "suspicious"], queryFn: () => fn(), refetchInterval: 10000 });

  const inv = () => qc.invalidateQueries({ queryKey: ["admin", "suspicious"] });
  const mut = useMutation({
    mutationFn: (v: { role: "driver" | "rider"; id: string; flagged: boolean }) => toggleFn({ data: v }),
    onSuccess: () => { toast.success("تم تحديث الحالة"); inv(); },
    onError: (e: any) => toast.error(e.message),
  });
  const suspMut = useMutation({
    mutationFn: (v: { role: "driver" | "rider"; id: string }) => statusFn({ data: { role: v.role, id: v.id, suspended: true, reason: "إيقاف من قائمة المشبوهين" } }),
    onSuccess: () => { toast.success("تم الإيقاف"); inv(); },
    onError: (e: any) => toast.error(e.message),
  });

  const renderRows = (rows: any[], role: "driver" | "rider") => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الاسم</TableHead>
          <TableHead>الجوال</TableHead>
          <TableHead>التقييم</TableHead>
          <TableHead>الرحلات</TableHead>
          <TableHead>الإلغاءات</TableHead>
          <TableHead>إجراء</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((u) => {
          const rate = u.total_rides ? ((u.total_cancellations / u.total_rides) * 100).toFixed(0) : "0";
          return (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
              <TableCell>{u.phone ?? "—"}</TableCell>
              <TableCell><Badge variant="destructive">⭐ {Number(u.rating_avg).toFixed(2)}</Badge></TableCell>
              <TableCell>{u.total_rides}</TableCell>
              <TableCell>{u.total_cancellations} ({rate}%)</TableCell>
              <TableCell className="flex gap-2">
                <Button size="sm" variant="outline" disabled={mut.isPending}
                  onClick={() => mut.mutate({ role, id: u.id, flagged: false })}>
                  ✓ إزالة العلامة
                </Button>
                <Button size="sm" variant="destructive" disabled={suspMut.isPending}
                  onClick={() => suspMut.mutate({ role, id: u.id })}>
                  🚫 إيقاف
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 && (
          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">لا يوجد مشبوهون 🎉</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">قائمة مراجعة المشبوهين</h2>
        <p className="text-sm text-muted-foreground">حسابات تجاوزت حدود التعليم التلقائي أو تم تعليمها من AI.</p>
      </div>
      {isLoading && <p className="text-muted-foreground">جاري التحميل...</p>}
      <Tabs defaultValue="drivers">
        <TabsList>
          <TabsTrigger value="drivers">سائقون ({data?.drivers.length ?? 0})</TabsTrigger>
          <TabsTrigger value="riders">ركاب ({data?.riders.length ?? 0})</TabsTrigger>
          <TabsTrigger value="log">سجل المراجعات</TabsTrigger>
        </TabsList>
        <TabsContent value="drivers"><Card className="p-2">{renderRows(data?.drivers ?? [], "driver")}</Card></TabsContent>
        <TabsContent value="riders"><Card className="p-2">{renderRows(data?.riders ?? [], "rider")}</Card></TabsContent>
        <TabsContent value="log">
          <Card className="p-2">
            <Table>
              <TableHeader><TableRow>
                <TableHead>التاريخ</TableHead><TableHead>النوع</TableHead><TableHead>الإجراء</TableHead><TableHead>المصدر</TableHead><TableHead>السبب</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(data?.reviews ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("ar")}</TableCell>
                    <TableCell>{r.subject_role === "driver" ? "سائق" : "راكب"}</TableCell>
                    <TableCell><Badge>{r.action}</Badge></TableCell>
                    <TableCell>{r.source}</TableCell>
                    <TableCell className="text-sm">{r.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {(data?.reviews ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">لا توجد مراجعات بعد.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
