import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminBroadcast, adminListCities } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/broadcast")({ component: BroadcastPage });

function BroadcastPage() {
  const sendFn = useServerFn(adminBroadcast);
  const citiesFn = useServerFn(adminListCities);
  const { data: cities } = useQuery({ queryKey: ["admin", "cities"], queryFn: () => citiesFn() });

  const [audience, setAudience] = useState<"drivers" | "riders" | "both">("drivers");
  const [cityId, setCityId] = useState<string>("all");
  const [message, setMessage] = useState("");

  const mut = useMutation({
    mutationFn: () => sendFn({ data: { audience, city_id: cityId === "all" ? null : cityId, message } }),
    onSuccess: (r) => {
      toast.success(`تم الإرسال إلى ${r.sent} مستخدم (فشل ${r.failed} من إجمالي ${r.total})`);
      setMessage("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">📢 بث رسالة جماعية</h2>
        <p className="text-sm text-muted-foreground">ترسل عبر بوت تيليجرام للسائقين والركاب. يستثني الموقوفين تلقائياً.</p>
      </div>
      <Card className="p-6 space-y-4">
        <div>
          <Label>الجمهور</Label>
          <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="drivers">السائقون فقط</SelectItem>
              <SelectItem value="riders">الركاب فقط</SelectItem>
              <SelectItem value="both">الاثنان</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>المدينة (اختياري — يقصر السائقين على هذه المدينة)</Label>
          <Select value={cityId} onValueChange={setCityId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدن</SelectItem>
              {(cities ?? []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name_ar} — {c.region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>الرسالة</Label>
          <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب الرسالة هنا..." />
          <p className="text-xs text-muted-foreground mt-1">{message.length} حرف · يدعم HTML بسيط (b, i, u, code)</p>
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || !message.trim()} className="w-full">
          {mut.isPending ? "جاري الإرسال..." : "إرسال البث الآن"}
        </Button>
      </Card>
    </div>
  );
}
