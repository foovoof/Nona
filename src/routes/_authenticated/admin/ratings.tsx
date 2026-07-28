import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAiRatings } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/ratings")({ component: RatingsPage });

function star(v: number | null) {
  if (v == null) return "—";
  return `⭐ ${Number(v).toFixed(2)}`;
}

function RatingsPage() {
  const fn = useServerFn(adminListAiRatings);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "ai-ratings"], queryFn: () => fn(), refetchInterval: 10000 });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">سجل تقييمات الذكاء الاصطناعي</h2>
        <p className="text-sm text-muted-foreground">تقييمات تلقائية بعد كل رحلة مكتملة — تشمل ملاحظات وعلامات سلوك مشبوهة.</p>
      </div>
      {isLoading && <p className="text-muted-foreground">جاري التحميل...</p>}
      <div className="grid gap-3">
        {(data ?? []).map((r: any) => {
          const ride = r.rides;
          return (
            <Card key={r.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {ride?.pickup_name ?? "—"} ← {ride?.drop_name ?? "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    سائق: {ride?.drivers?.name ?? "—"} · راكب: {ride?.riders?.name ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ar")}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="default">AI: {star(r.ai_rating)}</Badge>
                  <div className="text-xs text-muted-foreground">سائق: {star(r.driver_rating)} · راكب: {star(r.rider_rating)}</div>
                </div>
              </div>
              {r.ai_notes && (
                <div className="text-sm bg-muted/50 rounded p-2 whitespace-pre-wrap">{r.ai_notes}</div>
              )}
            </Card>
          );
        })}
        {data && data.length === 0 && <p className="text-muted-foreground">لا توجد تقييمات AI بعد. أكمل رحلة لتفعيل التقييم التلقائي.</p>}
      </div>
    </div>
  );
}
