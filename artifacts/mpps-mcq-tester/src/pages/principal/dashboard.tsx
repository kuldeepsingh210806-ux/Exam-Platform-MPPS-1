import { useEffect, useState, useCallback } from "react";
import { listenTests, listenStudents, listenAttempts, listenViolations, Test, StudentProfile, Attempt, Violation } from "@/lib/firestore";
import { getGrade } from "@/lib/ranking";
import { printPrincipalReport } from "@/lib/pdf-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, ClipboardList, CheckCircle, ShieldAlert, TrendingUp, BookOpen, RefreshCw, FileDown } from "lucide-react";

export default function PrincipalDashboard() {
  const [tests,      setTests]      = useState<Test[]>([]);
  const [students,   setStudents]   = useState<StudentProfile[]>([]);
  const [attempts,   setAttempts]   = useState<Attempt[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleExportPDF = useCallback(() => {
    printPrincipalReport(tests, students, attempts, violations);
  }, [tests, students, attempts, violations]);

  useEffect(() => {
    const u1 = listenTests(t  => { setTests(t);      setLastUpdated(new Date()); });
    const u2 = listenStudents(s => { setStudents(s); setLastUpdated(new Date()); });
    const u3 = listenAttempts(a => { setAttempts(a); setLastUpdated(new Date()); });
    const u4 = listenViolations(v => setViolations(v));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const submitted = attempts.filter(a => a.submitted);
  const passCount  = submitted.filter(a => (a.percentage ?? 0) >= 40).length;
  const passRate   = submitted.length > 0 ? (passCount / submitted.length) * 100 : 0;
  const flaggedStudents = new Set(violations.filter(v => v.count > 0).map(v => v.studentId)).size;
  const schoolAvg  = submitted.length > 0 ? submitted.reduce((s, a) => s + (a.percentage ?? 0), 0) / submitted.length : 0;

  // Class leaderboard
  const classes = [...new Set(students.map(s => s.class))].sort();
  const classData = classes.map(cls => {
    const classSubs = submitted.filter(a => students.find(s => s.uid === a.studentId)?.class === cls);
    const avg = classSubs.length > 0 ? classSubs.reduce((s, a) => s + (a.percentage ?? 0), 0) / classSubs.length : 0;
    return { class: cls, avg: parseFloat(avg.toFixed(1)), count: classSubs.length };
  });

  // Top 5 students overall
  const studentMap = new Map<string, number[]>();
  for (const a of submitted) {
    if (!studentMap.has(a.studentId)) studentMap.set(a.studentId, []);
    studentMap.get(a.studentId)!.push(a.percentage ?? 0);
  }
  const topStudents = Array.from(studentMap.entries())
    .map(([uid, pcts]) => {
      const student = students.find(s => s.uid === uid);
      const avg = pcts.reduce((s, p) => s + p, 0) / pcts.length;
      return { student, avg, tests: pcts.length };
    })
    .filter(r => r.student)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  let topRank = 1;
  topStudents.forEach((r, i) => {
    if (i > 0 && r.avg < topStudents[i - 1].avg) topRank = i + 1;
    (r as any).rank = topRank;
  });

  const recentTests = [...tests]
    .filter(t => t && t.id)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5)
    .map(t => ({
      test: t,
      submissions: submitted.filter(a => a.testId === t.id).length,
      avg: (() => {
        const ts = submitted.filter(a => a.testId === t.id);
        return ts.length > 0 ? ts.reduce((s, a) => s + (a.percentage ?? 0), 0) / ts.length : 0;
      })(),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Principal Dashboard</h2>
          <p className="text-muted-foreground">School-wide overview — MP Public School, Mathuranagar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lastUpdated && <span className="text-xs text-muted-foreground hidden sm:block">Updated {lastUpdated.toLocaleTimeString("en-IN")}</span>}
          <Badge variant="outline" className="text-xs">Live</Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button size="sm" onClick={handleExportPDF} className="gap-1.5">
            <FileDown className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total Students",    value: students.length,           icon: Users,         color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Total Tests",       value: tests.length,              icon: ClipboardList, color: "text-primary",    bg: "bg-orange-50" },
          { label: "Total Submissions", value: submitted.length,          icon: BookOpen,      color: "text-purple-600", bg: "bg-purple-50" },
          { label: "School Pass Rate",  value: `${passRate.toFixed(1)}%`, icon: CheckCircle,   color: "text-green-600",  bg: "bg-green-50"  },
          { label: "School Average",    value: `${schoolAvg.toFixed(1)}%`,icon: TrendingUp,    color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Flagged Students",  value: flaggedStudents,           icon: ShieldAlert,   color: "text-red-600",    bg: "bg-red-50"    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class Performance Chart */}
        <Card>
          <CardHeader><CardTitle>Class Average Scores</CardTitle></CardHeader>
          <CardContent>
            {classData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No submissions yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={classData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="class" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, "Average"]} />
                  <Bar dataKey="avg" fill="hsl(215 90% 35%)" radius={[4,4,0,0]} name="Avg %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader><CardTitle>🏆 Top Performers</CardTitle></CardHeader>
          <CardContent>
            {topStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No results yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead><TableHead>Student</TableHead>
                    <TableHead>Class</TableHead><TableHead className="text-right">Avg %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topStudents.map((r) => {
                    const { grade, color } = getGrade(r.avg);
                    const rank = (r as any).rank;
                    return (
                      <TableRow key={r.student!.uid}>
                        <TableCell className="font-bold text-lg">
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                        </TableCell>
                        <TableCell className="font-medium">{r.student!.name}</TableCell>
                        <TableCell className="text-sm">{r.student!.class}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{r.avg.toFixed(1)}%</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tests */}
      <Card>
        <CardHeader><CardTitle>Recent Tests</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {recentTests.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No tests created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Title</TableHead><TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead><TableHead>Created</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Avg Score</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTests.map(({ test, submissions, avg }) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.title}</TableCell>
                    <TableCell>{test.subject}</TableCell>
                    <TableCell>{test.class}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(test.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">{submissions}</TableCell>
                    <TableCell className="text-right">{submissions > 0 ? `${avg.toFixed(1)}%` : "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={test.isActive ? "bg-green-600" : ""} variant={test.isActive ? "default" : "outline"}>
                        {test.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
