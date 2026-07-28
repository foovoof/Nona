import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — لوحة تحكم النقل" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const helperText = mode === "signin"
    ? "ادخل بنفس البريد وكلمة المرور اللذين أنشأت بهما الحساب للوصول إلى مركز العمليات."
    : "أنشئ حساب الإدارة. إذا لم يكن هناك أي مشرف بعد، ستستطيع تفعيل صلاحية المشرف مباشرة بعد الدخول.";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin/live" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("تم تسجيل الدخول");
        navigate({ to: "/admin/live" });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin/live" } });
        if (error) throw error;
        if (data.session) {
          toast.success("تم إنشاء الحساب. سيتم منحك صلاحية المشرف إذا كنت أول مستخدم.");
          navigate({ to: "/admin/live" });
        } else {
          toast.success("تم إنشاء الحساب. تحقق من بريدك لتفعيله ثم سجل دخول.");
          setMode("signin");
        }
      }
    } catch (e: any) {
      toast.error(e.message ?? "خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">🚖 لوحة تحكم النقل الذكي</h1>
          <p className="text-sm text-muted-foreground">
            {helperText}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" />
            {mode === "signup" && <p className="text-xs text-muted-foreground mt-1">6 أحرف على الأقل</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "..." : mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
          </Button>
        </form>
        <div className="text-center space-y-2">
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-sm text-primary hover:underline">
            {mode === "signin" ? "ليس عندك حساب؟ أنشئ واحداً جديداً" : "لديك حساب؟ سجّل الدخول"}
          </button>
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
              💡 <b>إذا لم يوجد مشرف بعد، ستظهر لك شاشة تمنحك صلاحية المشرف فوراً.</b> إذا كان هناك مشرف موجود بالفعل فالحساب يدخل بشكل طبيعي لكنه يحتاج ترقية إدارية منفصلة.
            </p>
          )}
          {mode === "signin" && (
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
              إذا ظهرت رسالة صلاحيات بعد الدخول، فهذا يعني أن تسجيل الدخول نجح لكن الحساب لا يملك دور الإدارة بعد.
            </p>
          )}
        </div>
        <Link to="/" className="block text-center text-xs text-muted-foreground">← العودة للرئيسية</Link>
      </Card>
    </div>
  );
}
