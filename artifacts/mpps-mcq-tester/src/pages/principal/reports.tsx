import { getStudents, getTests, getSubmissions, getNotices } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";

const CLASSES = ["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];

function getGrade(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 75) return "A";
  if (pct >= 60) return "B";
  if (pct >= 40) return "C";
  return "F";
}

export default function PrincipalReports() {
  const students = getStudents();
  const tests = getTests();
  const submissions = getSubmissions();
  const notices = getNotices();

  const totalAvg =
    submissions.length > 0
      ? submissions.reduce((a, s) => a + s.percentage, 0) / submissions.length
      : 0;

  const classData = CLASSES.map((cls) => {
    const cs = students.filter((s) => s.class === cls);
    const csubs = submissions.filter((sub) => cs.some((s) => s.id === sub.studentId));
    const avg = csubs.length > 0 ? csubs.reduce((a, s) => a + s.percentage, 0) / csubs.length : null;
    const passRate = csubs.length > 0 ? (csubs.filter((s) => s.percentage >= 40).length / csubs.length) * 100 : null;
    return { cls, students: cs.length, submissions: csubs.length, avg, passRate };
  }).filter((d) => d.students > 0);

  const top10 = students
    .map((s) => {
      const subs = submissions.filter((sub) => sub.studentId === s.id);
      const avg = subs.length > 0 ? subs.reduce((a, sub) => a + sub.percentage, 0) / subs.length : 0;
      return { student: s, avg, testsTaken: subs.length };
    })
    .filter((r) => r.testsTaken > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const recentNotices = notices
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="print:hidden flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PDF Report Generation</h2>
          <p className="text-muted-foreground">Generate a comprehensive school-wide performance report.</p>
        </div>
        <Button onClick={() => window.print()} size="lg">
          <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
        </Button>
      </div>

      <div id="principal-report" className="space-y-8">
        {/* Report Header */}
        <div className="text-center border-b-2 border-primary pb-6">
          <h1 className="text-3xl font-bold text-primary">MP Public School, Mathuranagar</h1>
          <p className="text-lg font-medium text-muted-foreground mt-1">Comprehensive School Performance Report</p>
          <p className="text-sm text-muted-foreground mt-2">
            Generated on: {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader><CardTitle>School Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              {[
                ["Total Students", students.length],
                ["Total Tests Created", tests.length],
                ["Total Submissions", submissions.length],
                ["Overall Average", `${totalAvg.toFixed(1)}%`],
              ].map(([label, value]) => (
                <div key={String(label)} className="border rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class-wise Summary */}
        {classData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Class-wise Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                    <TableHead className="text-right">Average Score</TableHead>
                    <TableHead className="text-right">Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classData.map((d) => (
                    <TableRow key={d.cls}>
                      <TableCell className="font-medium">{d.cls}</TableCell>
                      <TableCell className="text-right">{d.students}</TableCell>
                      <TableCell className="text-right">{d.submissions}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {d.avg !== null ? `${d.avg.toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={d.passRate && d.passRate >= 50 ? "text-green-700 font-semibold" : d.passRate !== null ? "text-red-600 font-semibold" : ""}>
                          {d.passRate !== null ? `${d.passRate.toFixed(1)}%` : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Top 10 Students */}
        {top10.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Top 10 Students</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Tests Taken</TableHead>
                    <TableHead className="text-right">Average %</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top10.map((r, idx) => (
                    <TableRow key={r.student.id} className={idx < 3 ? "bg-yellow-50/60" : ""}>
                      <TableCell className="font-bold">#{idx + 1}</TableCell>
                      <TableCell className="font-medium">{r.student.name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.student.rollNumber}</TableCell>
                      <TableCell>{r.student.class} {r.student.section}</TableCell>
                      <TableCell className="text-right">{r.testsTaken}</TableCell>
                      <TableCell className="text-right font-semibold">{r.avg.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded
                          ${r.avg >= 75 ? "bg-green-100 text-green-800" : r.avg >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                          {getGrade(r.avg)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Recent Notices */}
        {recentNotices.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Recent Notices</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {recentNotices.map((n) => (
                <div key={n.id} className="border-l-4 border-l-accent pl-4 py-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{n.title}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{n.targetAudience}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-1">{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-IN")} — {n.author}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          MP Public School, Mathuranagar — MPPS MCQ Tester Report — Confidential
        </div>
      </div>
    </div>
  );
}
