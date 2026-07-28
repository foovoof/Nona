import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetPricing, adminUpsertPricing } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pricing")({ component: PricingPage });

const FIELDS: Array<{ key: string; label: string; step?: string }> = [
  { key: "base_fare", label: "السعر الأساسي (ر.س)", step: "0.5" },
  { key: "per_km", label: "للكيلومتر (ر.س)", step: "0.1" },
  { key: "per_min", label: "للدقيقة (ر.س)", step: "0.05" },
  { key: "min_fare", label: "أدنى أجرة (ر.س)", step: "0.5" },
  { key: "max_surge", label: "أقصى مضاعف Surge", step: "0.1" },
  { key: "peak_surge_factor", label: "مضاعف الذروة", step: "0.05" },
  { key: "weather_surge_factor", label: "مضاعف الطقس السيئ", step: "0.05" },
  { key: "holiday_surge_factor", label: "مضاعف الأعياد/المناسبات", step: "0.05" },
];

function PricingPage() {
  const getFn = useServerFn(adminGetPricing);
  const setFn = useServerFn(adminUpsertPricing);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "pricing"], queryFn: () => getFn() });

  const row: any = (data ?? [])[0] ?? {};
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (row) {
      const v: Record<string, string> = {};
      for (const f of FIELDS) v[f.key] = String(row[f.key] ?? "");
      setValues(v);
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: () => setFn({ data: {
      id: row.id,
      base_fare: Number(values.base_fare), per_km: Number(values.per_km), per_min: Number(values.per_min),
      min_fare: Number(values.min_fare), max_surge: Number(values.max_surge),
      peak_surge_factor: Number(values.peak_surge_factor),
      weather_surge_factor: Number(values.weather_surge_factor),
      holiday_surge_factor: Number(values.holiday_surge_factor),
    }}),
    onSuccess: () => { toast.success("تم حفظ الأسعار"); qc.invalidateQueries({ queryKey: ["admin", "pricing"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">💰 الأسعار والمضاعفات</h2>
        <p className="text-sm text-muted-foreground">يُحتسب السعر النهائي = max(min_fare, (base + per_km × المسافة + per_min × الوقت) × min(max_surge, ذروة × طقس × عيد)).</p>
      </div>
      <Card className="p-6 grid grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Input type="number" step={f.step ?? "0.1"} value={values[f.key] ?? ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
          </div>
        ))}
        <div className="col-span-2">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "..." : "حفظ"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
