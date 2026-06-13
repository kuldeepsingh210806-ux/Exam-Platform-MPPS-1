import { useEffect, useState } from "react";
import {
  listenTests, listenStudents, listenAttempts, getAllViolations,
  Test, StudentProfile, Attempt, Violation,
} from "@/lib/firestore";
import { printPrincipalReport } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Printer, Download, School } from "lucide-react";

function getGrade(p: number) {
  if (p >= 90) return { grade: "A+", color: "bg-green-100 text-green-800" };
  if (p >= 75) return { grade: "A",  color: "bg-green-100 text-green-800" };
  if (p >= 60) return { grade: "B",  color: "bg-blue-100 text-blue-800" };
  if (p >= 40) return { grade: "C",  color: "bg-yellow-100 text-yellow-800" };
  return         { grade: "F",  color: "bg-red-100 text-red-800" };
}

export default function PrincipalReports() {
  const [tests,      setTests]      = useState<Test[]>([]);
  const [students,   setStudents]   = useState<StudentProfile[]>([]);
  const [attempts,   setAttempts]   = useState<Attempt[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);

  const [selectedTestId, setSelectedTestId] = useState("");
  const [generatedTest,  setGeneratedTest]  = useState(false);

  useEffect(() => { const u = listenTests(setTests);    return u; }, []);
  useEffect(() => { const u = listenStudents(setStudents); return u; }, []);
  useEffect(() => { const u = listenAttempts(setAttempts); return u; }, []);
  useEffect(() => { getAllViolations().then(setViolations); }, []);

  const handleSchoolPDF = () => {
    printPrincipalReport(tests, students, attempts, violations);
  };

  const test = tests.find(t => t.id === selectedTestId);
  const testAttempts = attempts
    .filter(a => a.testId === selectedTestId && a.submitted)
    .map(a => ({ a, student: students.find(s => s.uid === a.studentId) }))
    .filter(r => r.student)
    .sort((x, y) => (y.a.percentage ?? 0) - (x.a.percentage ?? 0));

  const avg       = testAttempts.length > 0 ? testAttempts.reduce((s, r) => s + (r.a.percentage ?? 0), 0) / testAttempts.length : 0;
  const passCount = testAttempts.filter(r => (r.a.percentage ?? 0) >= 40).length;
  const highest   = testAttempts.length > 0 ? Math.max(...testAttempts.map(r => r.a.percentage ?? 0)) : 0;
  const lowest    = testAttempts.length > 0 ? Math.min(...testAttempts.map(r => r.a.percentage ?? 0)) : 0;

  const handlePrintPerTest = () => window.print();

  const testOptions = tests.map(t => ({ value: t.id, label: t.title }));

  const submitted  = attempts.filter(a => a.submitted);
  const passRate   = submitted.length > 0 ? (submitted.filter(a => (a.percentage ?? 0) >= 40).length / submitted.length) * 100 : 0;
  const schoolAvg  = submitted.length > 0 ? submitted.reduce((s, a) => s + (a.percentage ?? 0), 0) / submitted.length : 0;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight">PDF Report Generation</h2>
        <p className="text-muted-foreground">Generate school-wide or per-test printable reports.</p>
      </div>

      <Tabs defaultValue="school" className="print:hidden">
        <TabsList className="w-full max-w-sm">
          <TabsTrigger value="school"   className="flex-1"><School   className="w-3.5 h-3.5 mr-1.5" />School Report</TabsTrigger>
          <TabsTrigger value="per-test" className="flex-1"><FileText className="w-3.5 h-3.5 mr-1.5" />Per-Test Report</TabsTrigger>
        </TabsList>

        {/* ── School-Wide Report ─────────────────────────── */}
        <TabsContent value="school" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School-Wide Performance Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                A comprehensive PDF covering all students, classes, tests, and integrity flags.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ["Students",    students.length],
                  ["Tests",       tests.length],
                  ["Submissions", submitted.length],
                  ["Pass Rate",   `${passRate.toFixed(1)}%`],
                  ["School Avg",  `${schoolAvg.toFixed(1)}%`],
                  ["Violations",  violations.filter(v => v.count > 0).length],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-primary">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Includes: class-wise summary, all student scores, test list, integrity flags.
              </p>
              <Button onClick={handleSchoolPDF} size="lg" className="gap-2">
                <Download className="w-4 h-4" /> Generate & Open School Report PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Per-Test Report ────────────────────────────── */}
        <TabsContent value="per-test" className="mt-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-1 max-w-sm">
              <Label>Select Test</Label>
              <SearchableSelect
                value={selectedTestId}
                onValueChange={v => { setSelectedTestId(v); setGeneratedTest(false); }}
                options={testOptions}
                placeholder="Choose a test..."
              />
            </div>
            <Button
              onClick={() => setGeneratedTest(true)}
              disabled={!selectedTestId}
              className="gap-2"
            >
              <FileText className="w-4 h-4" /> Generate Report
            </Button>
          </div>

          {generatedTest && test && testAttempts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No submissions found for this test yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Printable Per-Test Report ──────────────────── */}
      {generatedTest && test && testAttempts.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-end print:hidden">
            <Button onClick={handlePrintPerTest} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </Button>
          </div>

          {/* Report Header */}
          <div className="text-center border-b-2 border-primary pb-6">
            <h1 className="text-2xl font-bold text-primary">MP Public School, Mathuranagar</h1>
            <p className="text-muted-foreground">MPPS MCQ Tester — Per-Test Performance Report</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Test Details */}
          <Card>
            <CardHeader><CardTitle>Test Details</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
              {[
                ["Test Name",    test.title],
                ["Subject",      test.subject],
                ["Class",        test.targetClass],
                ["Duration",     `${test.duration} min`],
                ["Total Marks",  String(test.totalMarks)],
                ["Questions",    String(test.questions?.length ?? 0)],
                ["Scheduled",    new Date(test.scheduledAt).toLocaleString("en-IN")],
                ["Submissions",  String(testAttempts.length)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Class Average",  `${avg.toFixed(1)}%`],
              ["Highest Score",  `${highest.toFixed(1)}%`],
              ["Lowest Score",   `${lowest.toFixed(1)}%`],
              ["Pass / Fail",    `${passCount} / ${testAttempts.length - passCount}`],
            ].map(([l, v]) => (
              <div key={l} className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{v}</div>
                <div className="text-xs text-muted-foreground mt-1">{l}</div>
              </div>
            ))}
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Results (Ranked)</CardTitle>
                <Badge variant="outline" className="text-xs">{testAttempts.length} submissions</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Violations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testAttempts.map(({ a, student }, idx) => {
                    const pct  = a.percentage ?? 0;
                    const { grade, color } = getGrade(pct);
                    const viol = violations.find(v => v.studentId === a.studentId && v.testId === a.testId);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-bold">#{idx + 1}</TableCell>
                        <TableCell className="font-medium">{student!.name}</TableCell>
                        <TableCell className="text-sm">{student!.class} {student!.section}</TableCell>
                        <TableCell className="font-mono text-sm">{student!.rollNumber}</TableCell>
                        <TableCell className="text-right">{a.score}/{a.totalMarks}</TableCell>
                        <TableCell className="text-right font-medium">{pct.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{grade}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${pct >= 40 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {pct >= 40 ? "Pass" : "Fail"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-semibold ${(viol?.count ?? 0) >= 3 ? "text-red-600 font-bold" : (viol?.count ?? 0) > 0 ? "text-yellow-600" : "text-muted-foreground"}`}>
                            {viol?.count ?? 0}{viol?.autoSubmitted ? " 🚨" : ""}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground border-t pt-4 print:block hidden">
            MP Public School, Mathuranagar — MPPS MCQ Tester — Confidential
          </div>
        </div>
      )}
    </div>
  );
}
