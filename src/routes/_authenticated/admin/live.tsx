import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMapboxToken, adminGetLiveOps } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/live")({
  component: LivePage,
});

interface DriverLoc { driver_id: string; latitude: number; longitude: number; updated_at: string; }
interface RideRow { id: string; pickup_lat: number; pickup_lng: number; drop_lat: number; drop_lng: number; status: string; pickup_address_resolved?: string | null; }

function LivePage() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">الخريطة الحية</h2>
      <p className="text-sm text-muted-foreground">السائقون المتاحون (أخضر) والرحلات الجارية (أزرق). يتحدث تلقائياً.</p>
      <Card className="overflow-hidden" style={{ height: "70vh" }}>
        <ClientOnly fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل الخريطة...</div>}>
          <LiveMap />
        </ClientOnly>
      </Card>
    </div>
  );
}

function LiveMap() {
  const [locs, setLocs] = useState<DriverLoc[]>([]);
  const [rides, setRides] = useState<RideRow[]>([]);
  const [Comp, setComp] = useState<any>(null);
  const tokenFn = useServerFn(getMapboxToken);
  const liveOpsFn = useServerFn(adminGetLiveOps);
  const { data: mb } = useQuery({ queryKey: ["mapbox", "token"], queryFn: () => tokenFn(), staleTime: Infinity });
  const { data: snapshot } = useQuery({ queryKey: ["admin", "live-ops"], queryFn: () => liveOpsFn(), refetchInterval: 10000 });
  const mbToken = mb?.token ?? "";

  useEffect(() => {
    if (!snapshot) return;
    setLocs((snapshot.locs ?? []) as DriverLoc[]);
    setRides((snapshot.rides ?? []) as RideRow[]);
  }, [snapshot]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const RL = await import("react-leaflet");
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      // Fix marker icon paths for Leaflet
      const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
      const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
      const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
      (L as any).Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
      if (mounted) setComp({ RL, L });
    })();
    return () => { mounted = false; };
  }, []);

  if (!Comp) return <div className="p-8 text-center text-muted-foreground">جاري تحميل الخريطة...</div>;
  const { MapContainer, TileLayer, CircleMarker, Popup, Marker, Polyline } = Comp.RL;

  // Center on Riyadh by default; recenter to avg of points if any
  const all = [...locs.map((l) => [l.latitude, l.longitude] as [number, number]), ...rides.map((r) => [r.pickup_lat, r.pickup_lng] as [number, number])];
  const center: [number, number] = all.length > 0
    ? [all.reduce((s, p) => s + p[0], 0) / all.length, all.reduce((s, p) => s + p[1], 0) / all.length]
    : [24.7136, 46.6753];

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <Badge className="bg-green-600">🟢 سائقون: {locs.length}</Badge>
        <Badge className="bg-blue-600">🔵 رحلات: {rides.length}</Badge>
      </div>
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
        {mbToken ? (
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${mbToken}`}
            tileSize={512}
            zoomOffset={-1}
          />
        ) : (
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        )}
        {locs.map((l) => (
          <CircleMarker key={l.driver_id} center={[l.latitude, l.longitude]} radius={8} pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.8 }}>
            <Popup>سائق<br/>{new Date(l.updated_at).toLocaleTimeString("ar-SA")}</Popup>
          </CircleMarker>
        ))}
        {rides.flatMap((r) => [
          <Marker key={`m-${r.id}`} position={[r.pickup_lat, r.pickup_lng]}>
            <Popup>📍 {r.pickup_address_resolved ?? "نقطة الانطلاق"}<br/>الحالة: {r.status}</Popup>
          </Marker>,
          <Polyline key={`l-${r.id}`} positions={[[r.pickup_lat, r.pickup_lng], [r.drop_lat, r.drop_lng]]} pathOptions={{ color: "#2563eb", weight: 3, opacity: 0.6, dashArray: "6, 8" }} />,
        ])}
      </MapContainer>
    </div>
  );
}
