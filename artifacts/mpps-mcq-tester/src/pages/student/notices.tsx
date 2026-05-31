import { useEffect, useState } from "react";
import { listenNotices, Notice } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";

export default function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const unsub = listenNotices((all) =>
      setNotices(all.filter((n) => n.targetAudience === "All" || n.targetAudience === "Students"))
    );
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notices</h2>
        <p className="text-muted-foreground">Announcements from the school.</p>
      </div>
      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Notices</h3>
          <p className="text-muted-foreground mt-2">Check back later for school announcements.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <Card key={n.id} className="border-l-4 border-l-accent">
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{n.title}</h3>
                  <Badge variant="outline">{n.targetAudience}</Badge>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })} — {n.author}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
