import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { listenNotices, countUnreadNotices, markNoticesSeen, Notice } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";

interface Props {
  audience: "Students" | "Teachers" | "All";
  navigateTo: string;
}

export function NotificationBell({ audience, navigateTo }: Props) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = listenNotices(setNotices);
    return u;
  }, []);

  const filtered = notices.filter(
    n => n.targetAudience === "All" || n.targetAudience === audience
  );
  const unread = user ? countUnreadNotices(filtered, user.uid) : 0;

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o && user) markNoticesSeen(user.uid);
  };

  const recent = filtered.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/15" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unread > 0 && <Badge variant="destructive" className="text-xs">{unread} new</Badge>}
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notices yet.</div>
        ) : (
          <div className="divide-y max-h-72 overflow-y-auto">
            {recent.map(n => {
              const isNew = user ? new Date(n.createdAt).getTime() > (parseInt(localStorage.getItem(`mpps_notices_seen_${user.uid}`) ?? "0", 10)) : false;
              return (
                <div key={n.id} className={`px-4 py-3 ${isNew ? "bg-blue-50" : ""}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm flex-1 truncate">{n.title}</p>
                    {isNew && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {n.author}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <div className="border-t px-4 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); navigate(navigateTo); }}>
            View all notices →
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
