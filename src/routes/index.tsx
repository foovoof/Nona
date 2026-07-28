import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, MapPin, ShieldAlert, Star, Zap, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام النقل الذكي عبر تيليجرام" },
      { name: "description", content: "منصّة نقل يومي تعمل بالكامل عبر بوتات تيليجرام — سائق وراكب — مع توزيع ذكي وطوارئ ودعم فني." },
    ],
  }),
  component: Index,
});

function Index() {
  const features = [
    { icon: Bot, title: "بوتان متكاملان", desc: "بوت للسائق وآخر للراكب يعملان معاً عبر خلفية واحدة." },
    { icon: MapPin, title: "توزيع جغرافي ذكي", desc: "أقرب السائقين المتاحين تلقائياً، مع موجة احتياطية." },
    { icon: ShieldAlert, title: "زر طوارئ حقيقي", desc: "تنبيه فوري للدعم مع موقع الراكب وبيانات السائق." },
    { icon: Star, title: "تقييم متبادل + AI", desc: "تقييم بعد كل رحلة يؤثر على ترتيب السائقين." },
    { icon: Zap, title: "خصوصية ومراسلة Relay", desc: "تواصل مباشر عبر البوت بدون كشف الأرقام." },
    { icon: Users, title: "لوحة تحكم للإدارة", desc: "إدارة السائقين والرحلات والطوارئ والدعم." },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="font-bold">🚖 نظام النقل الذكي</h1>
          <Link to="/auth"><Button variant="outline" size="sm">دخول الإدارة</Button></Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-16 space-y-16">
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            نقل ذكي بالكامل عبر <span className="text-primary">تيليجرام</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            بدون تطبيقات ثقيلة. تسجيل بسيط، توزيع ذكي، خصوصية كاملة، طوارئ حقيقية، ودعم فني فوري.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="p-6 space-y-3">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </section>

        <section className="text-center text-sm text-muted-foreground">
          المنصة قيد التشغيل. لتفعيل بوتاتك، سجّل دخولك إلى لوحة الإدارة ثم انتقل إلى الإعدادات لتسجيل Webhooks.
        </section>
      </main>
    </div>
  );
}
