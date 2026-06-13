import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { listenTestsByClass, Test } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen, RefreshCw } from "lucide-react";

export default function UpcomingTests() {
  const { studentProfile } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!studentProfile) return;
    const unsub = listenTestsByClass(studentProfile.class, (all) => {
      const now = new Date();
      setTests(all.filter((t) => new Date(t.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
    });
    return unsub;
  }, [studentProfile, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upcoming Tests</h2>
          <p className="text-muted-foreground">Tests scheduled for your class.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      {tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Upcoming Tests</h3>
          <p className="text-muted-foreground mt-2">Check back later for scheduled tests.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Check Again
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((t) => (
            <Card key={t.id} className="border-l-4 border-l-blue-400">
              <CardHeader>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{t.subject} · {t.targetClass}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(t.scheduledAt).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t.duration} minutes · {t.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t.questions?.length ?? 0} questions</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
