import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn as useSF } from "@tanstack/react-start";
import { adminListRides, adminEvaluateRide } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/rides")({
  component: RidesPage,
});

const statusColors: Record<string, string> = {
  searching: "bg-yellow-500", accepted: "bg-blue-500", in_progress: "bg-indigo-500",
  completed: "bg-green-500", cancelled: "bg-gray-500", failed: "bg-red-500",
};

function RidesPage() {
  const fn = useSF(adminListRides);
  const evalFn = useSF(adminEvaluateRide);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "rides"], queryFn: () => fn(), refetchInterval: 5000 });

  const evalMut = useMutation({
    mutationFn: (rideId: string) => evalFn({ data: { rideId } }),
    onSuccess: () => { toast.success("تم توليد التقييم الذكي"); qc.invalidateQueries({ queryKey: ["admin", "rides"] }); },
    onError: (e: any) => toast.error(e.message ?? "فشل التقييم"),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">الرحلات الأخيرة</h2>
      {isLoading && <p className="text-muted-foreground">جاري التحميل...</p>}
      <div className="grid gap-3">
        {(data ?? []).map((r: any) => (
          <Card key={r.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{r.pickup_name} ← {r.drop_name}</div>
              <div className="text-sm text-muted-foreground">
                راكب: {r.riders?.name ?? "—"} · سائق: {r.drivers?.name ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ar")}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {r.status === "completed" && (
                <Button size="sm" variant="outline"
                  disabled={evalMut.isPending}
                  onClick={() => evalMut.mutate(r.id)}>
                  🤖 تقييم AI
                </Button>
              )}
              <Badge className={statusColors[r.status] ?? "bg-gray-500"}>{r.status}</Badge>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">لا توجد رحلات بعد.</p>}
      </div>
    </div>
  );
}
