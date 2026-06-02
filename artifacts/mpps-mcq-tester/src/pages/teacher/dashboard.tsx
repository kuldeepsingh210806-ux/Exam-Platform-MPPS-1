import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { listenTests, listenStudents, listenAttempts, Test, StudentProfile, Attempt } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ClipboardList, BarChart2, PlusCircle, Activity, RefreshCw } from "lucide-react";

export default function TeacherDashboard() {
  const { teacherProfile } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { const u = listenTests(setTests); return u; }, []);
  useEffect(() => { const u = listenStudents(setStudents); return u; }, []);
  useEffect(() => { const u = listenAttempts(setAttempts); return u; }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const recent = attempts
    .filter((a) => a.submitted)
    .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h2>
          <p className="text-muted-foreground">Welcome, {teacherProfile?.name} ({teacherProfile?.subject})</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Tests", value: tests.length, icon: ClipboardList, color: "text-primary" },
          { label: "Total Students", value: students.length, icon: Users, color: "text-accent" },
          { label: "Total Submissions", value: attempts.filter(a=>a.submitted).length, icon: BarChart2, color: "text-green-600" },
          { label: "Published Tests", value: tests.filter(t=>t.published).length, icon: Activity, color: "text-blue-500" },
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
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/teacher/create-test"><Button className="w-full" size="lg"><PlusCircle className="w-5 h-5 mr-2" />Create New Test</Button></Link>
        <Link href="/teacher/students"><Button variant="secondary" className="w-full" size="lg"><Users className="w-5 h-5 mr-2" />Manage Students</Button></Link>
        <Link href="/teacher/results"><Button variant="outline" className="w-full" size="lg"><BarChart2 className="w-5 h-5 mr-2" />View All Results</Button></Link>
      </div>
      {recent.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Submissions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Student ID</TableHead><TableHead>Test</TableHead><TableHead>Score</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {recent.map((a) => {
                  const t = tests.find((x) => x.id === a.testId);
                  const s = students.find((x) => x.uid === a.studentId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{s?.name ?? a.studentId.slice(0,8)}</TableCell>
                      <TableCell>{t?.title ?? "Unknown"}</TableCell>
                      <TableCell>{a.score}/{a.totalMarks} ({a.percentage?.toFixed(1)}%)</TableCell>
                      <TableCell>{new Date(a.submittedAt!).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
