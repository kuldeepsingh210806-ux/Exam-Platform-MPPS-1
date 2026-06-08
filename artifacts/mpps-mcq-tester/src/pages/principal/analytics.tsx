import { useEffect, useState } from "react";
import { listenTests, listenStudents, listenAttempts, Test, StudentProfile, Attempt } from "@/lib/firestore";
import { computeOverallRank, getGrade } from "@/lib/ranking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["hsl(215 90% 35%)","hsl(25 95% 55%)","hsl(142 76% 36%)","hsl(0 84% 60%)","hsl(220 40% 45%)"];

export default function SchoolAnalytics() {
  const [tests,    setTests]    = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);

  useEffect(() => {
    const u1 = listenTests(t  => { setTests(t);    setLastUpdated(new Date()); });
    const u2 = listenStudents(s => { setStudents(s); setLastUpdated(new Date()); });
    const u3 = listenAttempts(a => { setAttempts(a); setLastUpdated(new Date()); });
    return () => { u1(); u2(); u3(); };
  }, []);

  const submitted = attempts.filter(a => a.submitted);
  const now = new Date();

  // Class average data
  const classes = [...new Set(students.map(s => s.class))].sort();
  const classAvgData = classes.map(cls => {
    const classStudents = students.filter(s => s.class === cls);
    const classSubs = submitted.filter(a => classStudents.some(s => s.uid === a.studentId));
    const avg = classSubs.length > 0 ? classSubs.reduce((s, a) => s + (a.percentage ?? 0), 0) / classSubs.length : 0;
    return { class: cls, average: parseFloat(avg.toFixed(1)), students: classStudents.length };
  });

  // Pass/Fail pie
  const passCount = submitted.filter(a => (a.percentage ?? 0) >= 40).length;
  const passPieData = [
    { name: "Pass", value: passCount },
    { name: "Fail", value: submitted.length - passCount },
  ];

  // Subject performance
  const subjects = [...new Set(tests.map(t => t.subject))];
  const subjectData = subjects.map(sub => {
    const subTests = tests.filter(t => t.subject === sub);
    const subSubs  = submitted.filter(a => subTests.some(t => t.id === a.testId));
    const avg = subSubs.length > 0 ? subSubs.reduce((s, a) => s + (a.percentage ?? 0), 0) / subSubs.length : 0;
    return { subject: sub, tests: subTests.length, avg: parseFloat(avg.toFixed(1)) };
  });

  // Last 7 days submission trend
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    const count = submitted.filter(a => a.submittedAt && new Date(a.submittedAt).toDateString() === d.toDateString()).length;
    return { date: label, submissions: count };
  });

  // Top performers (top 10 by avg %)
  const studentMap = new Map<string, number[]>();
  for (const a of submitted) {
    if (!studentMap.has(a.studentId)) studentMap.set(a.studentId, []);
    studentMap.get(a.studentId)!.push(a.percentage ?? 0);
  }
  const topPerformers = Array.from(studentMap.entries())
    .map(([uid, pcts]) => {
      const student = students.find(s => s.uid === uid);
      const avg = pcts.reduce((s, p) => s + p, 0) / pcts.length;
      return { student, avg, tests: pcts.length };
    })
    .filter(r => r.student)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  // Rank top performers using competition ranking
  let topRank = 1;
  topPerformers.forEach((r, i) => {
    if (i > 0 && r.avg < topPerformers[i - 1].avg) topRank = i + 1;
    (r as any).rank = topRank;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">School Analytics</h2>
          <p className="text-muted-foreground">School-wide performance data and trends.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString("en-IN")}
            </span>
          )}
          <Badge variant="outline" className="text-xs">Live</Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Students",      value: students.length },
          { label: "Total Tests",          value: tests.length },
          { label: "Total Submissions",    value: submitted.length },
          { label: "School Pass Rate",     value: submitted.length > 0 ? `${((passCount/submitted.length)*100).toFixed(1)}%` : "—" },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Average Bar Chart */}
        <Card>
          <CardHeader><CardTitle>Average Score by Class</CardTitle></CardHeader>
          <CardContent>
            {classAvgData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={classAvgData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="class" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, "Average"]} />
                  <Bar dataKey="average" fill={COLORS[0]} radius={[4,4,0,0]} name="Average %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pass/Fail Pie */}
        <Card>
          <CardHeader><CardTitle>Pass vs Fail Distribution</CardTitle></CardHeader>
          <CardContent>
            {submitted.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No submissions yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={passPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {passPieData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? COLORS[2] : COLORS[3]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader><CardTitle>Subject-wise Performance</CardTitle></CardHeader>
          <CardContent>
            {subjectData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No tests created yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0,100]} tick={{ fontSize: 12 }} unit="%" />
                  <YAxis dataKey="subject" type="category" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={v => [`${v}%`, "Avg Score"]} />
                  <Bar dataKey="avg" fill={COLORS[1]} radius={[0,4,4,0]} name="Avg %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Submission Trend */}
        <Card>
          <CardHeader><CardTitle>Submissions Trend (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke={COLORS[0]} strokeWidth={2}
                  dot={{ fill: COLORS[0], r: 4 }} name="Submissions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader><CardTitle>🏆 Top 10 Performers (School-wide)</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Tests</TableHead>
                  <TableHead className="text-right">Average %</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((r, i) => {
                  const { grade, color } = getGrade(r.avg);
                  const rank = (r as any).rank;
                  return (
                    <TableRow key={r.student!.uid}>
                      <TableCell className="text-center font-bold text-lg">
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                      </TableCell>
                      <TableCell className="font-medium">{r.student!.name}</TableCell>
                      <TableCell>{r.student!.class} {r.student!.section}</TableCell>
                      <TableCell className="text-right">{r.tests}</TableCell>
                      <TableCell className="text-right font-bold">{r.avg.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{grade}</span>
                      </TableCell>
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
