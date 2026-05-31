import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { listenTestsByClass, getAttemptsByStudent, Test, Attempt } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, CheckCircle2, Target } from "lucide-react";

export default function StudentDashboard() {
  const [, navigate] = useLocation();
  const { studentProfile, user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    if (!studentProfile) return;
    const unsub = listenTestsByClass(studentProfile.class, setTests);
    return unsub;
  }, [studentProfile]);

  useEffect(() => {
    if (!user) return;
    getAttemptsByStudent(user.uid).then(setAttempts);
  }, [user]);

  const now = new Date();
  const live = tests.filter((t) => new Date(t.scheduledAt) <= now && new Date(t.endsAt) >= now);
  const upcoming = tests.filter((t) => new Date(t.scheduledAt) > now);
  const completed = attempts.filter((a) => a.submitted);
  const avg = completed.length > 0
    ? completed.reduce((acc, a) => acc + (a.percentage ?? 0), 0) / completed.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Logged in as <strong>{studentProfile?.name}</strong>, {studentProfile?.class} {studentProfile?.section}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Live Tests Available", value: live.length, icon: Activity, color: "text-green-600" },
          { label: "Upcoming Tests", value: upcoming.length, icon: Calendar, color: "text-blue-500" },
          { label: "Tests Completed", value: completed.length, icon: CheckCircle2, color: "text-primary" },
          { label: "Average Score", value: `${avg.toFixed(1)}%`, icon: Target, color: "text-accent" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
          </Card>
        ))}
      </div>
      <Card className="max-w-sm">
        <CardHeader><CardTitle>Quick Access</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => navigate("/student/live")}>
            <Activity className="w-4 h-4 mr-2" /> Take Live Test
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/student/results")}>
            <Target className="w-4 h-4 mr-2" /> View Results
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
