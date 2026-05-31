import { useState } from "react";
import { getStudents, getTests, getSubmissions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Printer, FileText } from "lucide-react";

function getGrade(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 75) return "A";
  if (pct >= 60) return "B";
  if (pct >= 40) return "C";
  return "F";
}

export default function TeacherReports() {
  const tests = getTests();
  const students = getStudents();
  const submissions = getSubmissions();
  const [selectedTestId, setSelectedTestId] = useState("");
  const [generated, setGenerated] = useState(false);

  const test = tests.find((t) => t.id === selectedTestId);

  const testSubmissions = submissions
    .filter((s) => s.testId === selectedTestId)
    .map((sub) => ({
      sub,
      student: students.find((s) => s.id === sub.studentId),
    }))
    .filter((r) => r.student)
    .sort((a, b) => b.sub.percentage - a.sub.percentage);

  const avg = testSubmissions.length > 0
    ? testSubmissions.reduce((acc, r) => acc + r.sub.percentage, 0) / testSubmissions.length : 0;
  const highest = testSubmissions.length > 0 ? Math.max(...testSubmissions.map((r) => r.sub.percentage)) : 0;
  const lowest = testSubmissions.length > 0 ? Math.min(...testSubmissions.map((r) => r.sub.percentage)) : 0;
  const passCount = testSubmissions.filter((r) => r.sub.percentage >= 40).length;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight">Generate PDF Reports</h2>
        <p className="text-muted-foreground">Select a test to generate a printable performance report.</p>
      </div>

      <div className="print:hidden space-y-4">
        <div className="space-y-1 max-w-sm">
          <Label>Select Test</Label>
          <Select value={selectedTestId} onValueChange={(v) => { setSelectedTestId(v); setGenerated(false); }}>
            <SelectTrigger><SelectValue placeholder="Choose a test..." /></SelectTrigger>
            <SelectContent>
              {tests.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setGenerated(true)} disabled={!selectedTestId}>
          <FileText className="w-4 h-4 mr-2" /> Generate Report
        </Button>
      </div>

      {generated && test && (
        <div className="space-y-6">
          <div className="flex justify-end print:hidden">
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
            </Button>
          </div>

          <div id="report-content" className="space-y-6">
            {/* Report Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-2xl font-bold">MP Public School, Mathuranagar</h1>
              <p className="text-muted-foreground">MPPS MCQ Tester — Performance Report</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* Test Info */}
            <Card>
              <CardHeader><CardTitle>Test Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  {[
                    ["Test Name", test.title],
                    ["Subject", test.subject],
                    ["Class", test.targetClass],
                    ["Total Marks", String(test.totalMarks)],
                    ["Duration", `${test.duration} minutes`],
                    ["Scheduled", new Date(test.scheduledAt).toLocaleString("en-IN")],
                    ["Total Submissions", String(testSubmissions.length)],
                    ["Pass Rate", testSubmissions.length > 0 ? `${((passCount / testSubmissions.length) * 100).toFixed(1)}%` : "N/A"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                ["Class Average", `${avg.toFixed(1)}%`],
                ["Highest Score", `${highest.toFixed(1)}%`],
                ["Lowest Score", `${lowest.toFixed(1)}%`],
                [`Pass / Fail`, `${passCount} / ${testSubmissions.length - passCount}`],
              ].map(([label, value]) => (
                <div key={label} className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Results Table */}
            {testSubmissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No submissions found for this test.</p>
            ) : (
              <Card>
                <CardHeader><CardTitle>Student Results</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testSubmissions.map(({ sub, student }, idx) => {
                        const pct = sub.percentage;
                        const isPass = pct >= 40;
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-bold">#{idx + 1}</TableCell>
                            <TableCell className="font-medium">{student!.name}</TableCell>
                            <TableCell className="font-mono text-sm">{student!.rollNumber}</TableCell>
                            <TableCell>{student!.class} {student!.section}</TableCell>
                            <TableCell className="text-right">{sub.score}/{sub.totalMarks}</TableCell>
                            <TableCell className="text-right font-medium">{pct.toFixed(1)}%</TableCell>
                            <TableCell className="text-center">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded
                                ${pct >= 75 ? "bg-green-100 text-green-800" : pct >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                                {getGrade(pct)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isPass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {isPass ? "Pass" : "Fail"}
                              </span>
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
        </div>
      )}
    </div>
  );
}
