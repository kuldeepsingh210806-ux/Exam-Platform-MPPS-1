import { getSession, getStudents, getTests, getSubmissions } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Activity, CalendarClock, CheckCircle, Target } from "lucide-react";

export default function StudentDashboard() {
  const session = getSession();
  const student = getStudents().find(s => s.id === session?.studentId);
  const tests = getTests();
  const submissions = getSubmissions().filter(s => s.studentId === student?.id);

  const now = new Date();
  
  const liveTests = tests.filter(t => 
    t.targetClass === student?.class && 
    new Date(t.scheduledAt) <= now && 
    new Date(t.endsAt) >= now
  );

  const upcomingTests = tests.filter(t => 
    t.targetClass === student?.class && 
    new Date(t.scheduledAt) > now
  );

  const averageScore = submissions.length > 0 
    ? submissions.reduce((acc, sub) => acc + sub.percentage, 0) / submissions.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {student && (
          <p className="text-muted-foreground">
            Logged in as: <span className="font-semibold text-foreground">{student.name}</span>, {student.class} {student.section}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Live Tests Available</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveTests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
            <CalendarClock className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link href="/student/live-tests" className="w-full">
              <Button className="w-full justify-start" size="lg">
                <Activity className="w-5 h-5 mr-2" />
                Take Live Test
              </Button>
            </Link>
            <Link href="/student/results" className="w-full">
              <Button className="w-full justify-start" variant="secondary" size="lg">
                <Target className="w-5 h-5 mr-2" />
                View Results
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
