import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListCities, adminUpdateCity, adminCreateCity } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/cities")({ component: CitiesPage });

function CitiesPage() {
  const fn = useServerFn(adminListCities);
  const updateFn = useServerFn(adminUpdateCity);
  const createFn = useServerFn(adminCreateCity);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "cities"], queryFn: () => fn() });

  const mut = useMutation({
    mutationFn: (v: any) => updateFn({ data: v }),
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["admin", "cities"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: (v: any) => createFn({ data: v }),
    onSuccess: () => { toast.success("تمت إضافة المدينة"); qc.invalidateQueries({ queryKey: ["admin", "cities"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = (data ?? []).reduce<Record<string, any[]>>((acc, c: any) => {
    (acc[c.region] ??= []).push(c); return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">مدن المملكة وقروبات تيليجرام</h2>
          <p className="text-sm text-muted-foreground">
            خصص لكل مدينة قروب تيليجرام يستقبل الطلبات اللتي لا يأخذها السائقون المشتركون.
            البوت لازم يكون مشرفاً في القروب.
          </p>
        </div>
        <NewCityDialog onCreate={(v) => createMut.mutate(v)} pending={createMut.isPending} />
      </div>
      {isLoading && <p className="text-muted-foreground">جاري التحميل...</p>}
      {Object.entries(grouped).map(([region, rows]) => (
        <Card key={region} className="p-2">
          <h3 className="font-semibold p-2">{region}</h3>
          <Table>
            <TableHeader><TableRow>
              <TableHead>المدينة</TableHead>
              <TableHead>نصف القطر (كم)</TableHead>
              <TableHead>قروب تيليجرام (chat_id)</TableHead>
              <TableHead>مفعّل</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((c) => <CityRow key={c.id} city={c} onSave={mut.mutate} saving={mut.isPending} />)}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
}

function CityRow({ city, onSave, saving }: { city: any; onSave: (v: any) => void; saving: boolean }) {
  const [chatId, setChatId] = useState(city.telegram_group_chat_id ?? "");
  const [radius, setRadius] = useState(String(city.radius_km));
  const [active, setActive] = useState(city.active);
  const dirty = chatId !== (city.telegram_group_chat_id ?? "") || Number(radius) !== Number(city.radius_km) || active !== city.active;
  return (
    <TableRow>
      <TableCell className="font-medium">{city.name_ar}</TableCell>
      <TableCell><Input className="w-20" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} /></TableCell>
      <TableCell><Input className="w-56" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="-100..." dir="ltr" /></TableCell>
      <TableCell><Switch checked={active} onCheckedChange={setActive} /></TableCell>
      <TableCell>
        <Button size="sm" disabled={!dirty || saving}
          onClick={() => onSave({ id: city.id, telegram_group_chat_id: chatId, radius_km: Number(radius), active })}>
          حفظ
        </Button>
      </TableCell>
    </TableRow>
  );
}

function NewCityDialog({ onCreate, pending }: { onCreate: (v: any) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name_ar: "", name_en: "", region: "", lat: "", lng: "", radius_km: "15", telegram_group_chat_id: "" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ إضافة مدينة</Button></DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>إضافة مدينة جديدة</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>الاسم بالعربي *</Label><Input value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} /></div>
          <div><Label>الاسم بالإنجليزي</Label><Input value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} dir="ltr" /></div>
          <div className="col-span-2"><Label>المنطقة *</Label><Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} placeholder="مكة المكرمة، الرياض، ..." /></div>
          <div><Label>Latitude *</Label><Input type="number" step="0.000001" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} /></div>
          <div><Label>Longitude *</Label><Input type="number" step="0.000001" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} /></div>
          <div><Label>نصف القطر (كم)</Label><Input type="number" value={f.radius_km} onChange={(e) => setF({ ...f, radius_km: e.target.value })} /></div>
          <div><Label>chat_id القروب</Label><Input value={f.telegram_group_chat_id} onChange={(e) => setF({ ...f, telegram_group_chat_id: e.target.value })} placeholder="-100..." dir="ltr" /></div>
        </div>
        <Button disabled={pending || !f.name_ar || !f.region || !f.lat || !f.lng}
          onClick={() => {
            onCreate({ name_ar: f.name_ar, name_en: f.name_en || undefined, region: f.region, lat: Number(f.lat), lng: Number(f.lng), radius_km: Number(f.radius_km), telegram_group_chat_id: f.telegram_group_chat_id || null });
            setOpen(false);
          }}>
          إضافة
        </Button>
      </DialogContent>
    </Dialog>
  );
}
