import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListTickets, adminReplyTicket } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/support")({ component: SupportPage });

function SupportPage() {
  const fn = useServerFn(adminListTickets);
  const reply = useServerFn(adminReplyTicket);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "tickets"], queryFn: () => fn(), refetchInterval: 5000 });
  const [replies, setReplies] = useState<Record<string, string>>({});
  const mut = useMutation({
    mutationFn: ({ ticketId, replyText }: { ticketId: string; replyText: string }) => reply({ data: { ticketId, reply: replyText } }),
    onSuccess: () => { toast.success("تم الإرسال"); qc.invalidateQueries({ queryKey: ["admin", "tickets"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">تذاكر الدعم</h2>
      <div className="grid gap-3">
        {(data ?? []).map((t: any) => (
          <Card key={t.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{t.user_role === "driver" ? "🚖 سائق" : "🧍 راكب"} · TG:{t.user_telegram_id}</div>
              <Badge variant={t.status === "open" ? "default" : "outline"}>{t.status}</Badge>
            </div>
            <p className="text-sm">{t.message}</p>
            {t.reply && <p className="text-xs text-muted-foreground border-r-2 pr-3">رد: {t.reply}</p>}
            {t.status === "open" && (
              <div className="flex gap-2">
                <Textarea value={replies[t.id] ?? ""} onChange={(e) => setReplies({ ...replies, [t.id]: e.target.value })} placeholder="اكتب الرد..." className="min-h-16" />
                <Button size="sm" onClick={() => replies[t.id] && mut.mutate({ ticketId: t.id, replyText: replies[t.id] })} disabled={mut.isPending}>إرسال</Button>
              </div>
            )}
            <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("ar")}</div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">لا توجد تذاكر مفتوحة.</p>}
      </div>
    </div>
  );
}
