import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, ShieldCheck } from "lucide-react";
import { checkIsAdmin, claimAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const tabs = [
  { to: "/admin/live", label: "🗺 حي" },
  { to: "/admin/rides", label: "الرحلات" },
  { to: "/admin/drivers", label: "السائقون" },
  { to: "/admin/broadcast", label: "📢 بث" },
  { to: "/admin/pricing", label: "💰 الأسعار" },
  { to: "/admin/ratings", label: "تقييمات AI" },
  { to: "/admin/suspicious", label: "المشبوهون" },
  { to: "/admin/cities", label: "المدن والقروبات" },
  { to: "/admin/emergencies", label: "الطوارئ" },
  { to: "/admin/support", label: "الدعم" },
  { to: "/admin/settings", label: "الإعدادات" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const checkFn = useServerFn(checkIsAdmin);
  const claimFn = useServerFn(claimAdmin);

  const { data: roleInfo, isLoading, refetch } = useQuery({
    queryKey: ["me", "isAdmin"],
    queryFn: () => checkFn(),
    retry: 1,
  });

  const claimMut = useMutation({
    mutationFn: () => claimFn(),
    onSuccess: (r) => {
      if (r.claimed) { toast.success("تم منحك صلاحية المشرف ✓"); refetch(); }
      else toast.error("يوجد مشرف بالفعل — لا يمكن المطالبة. اطلب الترقية يدوياً.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center" dir="rtl"><p className="text-muted-foreground">جاري التحقق من الصلاحية...</p></div>;
  }

  if (!roleInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full p-8 space-y-4 text-center">
          <h1 className="text-xl font-bold">تعذر التحقق من الصلاحيات الآن</h1>
          <p className="text-sm text-muted-foreground">قد تكون الجلسة انتهت أو حدثت مشكلة اتصال مؤقتة.</p>
          <Button onClick={() => refetch()} className="w-full">إعادة المحاولة</Button>
          <Button variant="outline" onClick={signOut} className="w-full">خروج</Button>
        </Card>
      </div>
    );
  }

  if (!roleInfo?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full p-8 space-y-4 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-xl font-bold">حسابك مسجَّل لكن لا يملك صلاحية المشرف</h1>
          <p className="text-sm text-muted-foreground">
            إذا كنت أول مستخدم في النظام، اضغط الزر لمنح نفسك دور <code>admin</code> تلقائياً.
            إذا كان هناك مشرف بالفعل، اطلب منه إضافتك.
          </p>
          <Button onClick={() => claimMut.mutate()} disabled={claimMut.isPending} className="w-full">
            {claimMut.isPending ? "..." : "🛡 منحي صلاحية المشرف (إن لم يوجد مشرف)"}
          </Button>
          <Button variant="outline" onClick={signOut} className="w-full">خروج</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto flex items-center justify-between p-4 gap-4">
          <h1 className="font-bold whitespace-nowrap">🚖 لوحة النقل الذكي</h1>
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <Link key={t.to} to={t.to} className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition ${pathname === t.to ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                {t.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 ml-2" />خروج</Button>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
