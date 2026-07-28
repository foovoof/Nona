import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminSetupWebhooks, adminGetThresholds, adminSetThresholds, adminGetWebhookTargets, adminGetWebhookStatus } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const setupFn = useServerFn(adminSetupWebhooks);
  const getThFn = useServerFn(adminGetThresholds);
  const setThFn = useServerFn(adminSetThresholds);
  const getWebhookTargetsFn = useServerFn(adminGetWebhookTargets);
  const getWebhookStatusFn = useServerFn(adminGetWebhookStatus);
  const qc = useQueryClient();

  const { data: webhookTargets } = useQuery({ queryKey: ["admin", "webhook-targets"], queryFn: () => getWebhookTargetsFn() });
  const { data: webhookStatus } = useQuery({ queryKey: ["admin", "webhook-status"], queryFn: () => getWebhookStatusFn() });
  const [baseUrl, setBaseUrl] = useState("");
  useEffect(() => {
    if (webhookTargets?.suggestedBaseUrl) {
      setBaseUrl(webhookTargets.suggestedBaseUrl);
      return;
    }
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const match = host.match(/^([0-9a-f-]{36})\./i);
    if (match?.[1]) setBaseUrl(`https://project--${match[1]}-dev.lovable.app`);
  }, [webhookTargets]);
  const setupMut = useMutation({
    mutationFn: () => setupFn({ data: { baseUrl } }),
    onSuccess: (result) => {
      toast.success(`تم ربط البوتين بنجاح على ${result.baseUrl}`);
      qc.invalidateQueries({ queryKey: ["admin", "webhook-status"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: th } = useQuery({ queryKey: ["admin", "thresholds"], queryFn: () => getThFn() });
  const [minRating, setMinRating] = useState("2.5");
  const [maxCancel, setMaxCancel] = useState("0.35");
  const [minRides, setMinRides] = useState("5");
  const [aiAuto, setAiAuto] = useState(true);
  useEffect(() => {
    if (th) {
      setMinRating(String(th.min_rating)); setMaxCancel(String(th.max_cancel_rate));
      setMinRides(String(th.min_rides_for_eval)); setAiAuto(th.ai_flag_on_any_flag);
    }
  }, [th]);

  const thMut = useMutation({
    mutationFn: () => setThFn({ data: {
      min_rating: Number(minRating), max_cancel_rate: Number(maxCancel),
      min_rides_for_eval: Number(minRides), ai_flag_on_any_flag: aiAuto,
    }}),
    onSuccess: () => { toast.success("تم حفظ الحدود"); qc.invalidateQueries({ queryKey: ["admin", "thresholds"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">الإعدادات</h2>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">حدود تعليم الحسابات المشبوهة</h3>
          <p className="text-sm text-muted-foreground">يتم تعليم السائق/الراكب تلقائياً عند تجاوز أي حد. التغيير يسري على التقييمات القادمة.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>أدنى متوسط تقييم</Label>
            <Input type="number" step="0.1" min="1" max="5" value={minRating} onChange={(e) => setMinRating(e.target.value)} />
          </div>
          <div>
            <Label>أعلى نسبة إلغاء (0-1)</Label>
            <Input type="number" step="0.05" min="0" max="1" value={maxCancel} onChange={(e) => setMaxCancel(e.target.value)} />
          </div>
          <div>
            <Label>أقل عدد رحلات للتقييم</Label>
            <Input type="number" min="1" value={minRides} onChange={(e) => setMinRides(e.target.value)} />
          </div>
          <div className="flex items-center justify-between border rounded-md p-3">
            <Label>تعليم تلقائي من علامات AI</Label>
            <Switch checked={aiAuto} onCheckedChange={setAiAuto} />
          </div>
        </div>
        <Button onClick={() => thMut.mutate()} disabled={thMut.isPending}>
          {thMut.isPending ? "جاري الحفظ..." : "حفظ الحدود"}
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-2">تسجيل Webhooks البوتات</h3>
          <p className="text-sm text-muted-foreground mb-3">
            هذا يربط بوت السائق وبوت الراكب بعنوان عام ثابت. لا تستخدم رابط preview لأنه لا يعمل مع Telegram.
          </p>
        </div>
        <div>
          <Label htmlFor="baseUrl">عنوان الموقع (Base URL)</Label>
          <Input id="baseUrl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://your-app.lovable.app" />
          <p className="text-xs text-muted-foreground mt-1">الموصى به الآن: <code dir="ltr">{baseUrl || "https://project--...-dev.lovable.app"}</code></p>
        </div>
        <Button onClick={() => setupMut.mutate()} disabled={setupMut.isPending || !baseUrl}>
          {setupMut.isPending ? "جاري التسجيل..." : "تسجيل Webhooks الآن"}
        </Button>
        {webhookStatus && (
          <div className="text-xs text-muted-foreground space-y-1 rounded-md border p-3">
            <div><b>Bot driver:</b> <span dir="ltr">{webhookStatus.driver?.url || "—"}</span></div>
            <div><b>Bot rider:</b> <span dir="ltr">{webhookStatus.rider?.url || "—"}</span></div>
            {!!webhookStatus.driver?.last_error_message && <div>Driver error: {webhookStatus.driver.last_error_message}</div>}
            {!!webhookStatus.rider?.last_error_message && <div>Rider error: {webhookStatus.rider.last_error_message}</div>}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-2">
        <h3 className="font-semibold">تعيين دور admin</h3>
        <p className="text-sm text-muted-foreground">
          إذا كان حسابك أول مشرف فسيظهر لك زر المطالبة تلقائياً. وإذا كنت مشرفاً بالفعل فلن تحتاج أي خطوة يدوية إضافية.
        </p>
      </Card>
    </div>
  );
}
