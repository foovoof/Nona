import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListEmergencies } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/emergencies")({ component: EmergPage });

function EmergPage() {
  const fn = useServerFn(adminListEmergencies);
  const { data } = useQuery({ queryKey: ["admin", "emerg"], queryFn: () => fn(), refetchInterval: 3000 });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">تنبيهات الطوارئ</h2>
      <div className="grid gap-3">
        {(data ?? []).map((e: any) => (
          <Card key={e.id} className="p-4 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">🚨 رحلة: {e.rides?.pickup_name ?? "—"} ← {e.rides?.drop_name ?? "—"}</div>
                <div className="text-sm">راكب: {e.riders?.name ?? "—"} (TG:{e.riders?.telegram_id})</div>
                <div className="text-sm">سائق: {e.drivers?.name ?? "—"} - {e.drivers?.car_plate ?? "—"}</div>
                {e.location_lat && (
                  <a href={`https://maps.google.com/?q=${e.location_lat},${e.location_lng}`} target="_blank" rel="noreferrer" className="text-sm text-blue-500 underline">📍 الموقع على الخريطة</a>
                )}
                <div className="text-xs text-muted-foreground mt-1">{new Date(e.created_at).toLocaleString("ar")}</div>
              </div>
              <Badge variant={e.resolved ? "outline" : "destructive"}>{e.resolved ? "تم الحل" : "نشط"}</Badge>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">لا توجد تنبيهات طوارئ.</p>}
      </div>
    </div>
  );
}
