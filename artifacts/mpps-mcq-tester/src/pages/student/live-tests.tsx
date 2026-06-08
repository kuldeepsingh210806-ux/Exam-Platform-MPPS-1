import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { listenTestsByClass, getAttemptByStudentAndTest, Test } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function LiveTests() {
  const [, navigate] = useLocation();
  const { studentProfile, user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!studentProfile) return;
    const unsub = listenTestsByClass(studentProfile.class, (all) => {
      const now = new Date();
      setTests(all.filter((t) => new Date(t.scheduledAt) <= now && new Date(t.endsAt) >= now));
    });
    return unsub;
  }, [studentProfile, refreshKey]);

  useEffect(() => {
    if (!user || tests.length === 0) return;
    Promise.all(tests.map((t) => getAttemptByStudentAndTest(user.uid, t.id))).then((results) => {
      const ids = new Set<string>();
      results.forEach((a, i) => { if (a?.submitted) ids.add(tests[i].id); });
      setAttemptedIds(ids);
    });
  }, [user, tests]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const formatTime = (mins: number) => `${mins} min${mins !== 1 ? "s" : ""}`;
  const timeLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m left` : `${m}m left`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Tests</h2>
          <p className="text-muted-foreground">Tests currently available for your class.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      {tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Live Tests Right Now</h3>
          <p className="text-muted-foreground mt-2">Check back later or view upcoming tests.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Check Again
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => {
            const done = attemptedIds.has(test.id);
            return (
              <Card key={test.id} className={`border-l-4 ${done ? "border-l-muted-foreground" : "border-l-green-500"}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    {done ? (
                      <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Done</Badge>
                    ) : (
                      <Badge className="bg-green-600"><AlertCircle className="w-3 h-3 mr-1" />Live</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{test.subject} · {test.targetClass}</p>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(test.duration)} · {timeLeft(test.endsAt)}</span>
                  </div>
                  <div className="text-muted-foreground">{test.questions.length} questions · {test.totalMarks} marks</div>
                </CardContent>
                <CardFooter>
                  {done ? (
                    <Button variant="outline" className="w-full" onClick={() => navigate(`/student/review/${test.id}`)}>
                      View Answers
                    </Button>
                  ) : (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate(`/student/take/${test.id}`)}>
                      Start Test
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
