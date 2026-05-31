import { useState } from "react";
import { getStudents, getTests, getSubmissions } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClipboardList } from "lucide-react";

function getGrade(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 75) return "A";
  if (pct >= 60) return "B";
  if (pct >= 40) return "C";
  return "F";
}

export default function TeacherResults() {
  const students = getStudents();
  const tests = getTests();
  const submissions = getSubmissions();

  const [filterClass, setFilterClass] = useState("all");
  const [filterTest, setFilterTest] = useState("all");

  const classes = [...new Set(students.map((s) => s.class))].sort();

  const enriched = submissions
    .map((sub) => ({
      sub,
      student: students.find((s) => s.id === sub.studentId),
      test: tests.find((t) => t.id === sub.testId),
    }))
    .filter((r) => r.student && r.test)
    .filter((r) => filterClass === "all" || r.student!.class === filterClass)
    .filter((r) => filterTest === "all" || r.test!.id === filterTest)
    .sort((a, b) => new Date(b.sub.submittedAt).getTime() - new Date(a.sub.submittedAt).getTime());

  const avg = enriched.length > 0
    ? enriched.reduce((acc, r) => acc + r.sub.percentage, 0) / enriched.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">View Results</h2>
        <p className="text-muted-foreground">All student submissions across all tests.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1 min-w-[180px]">
          <Label>Filter by Class</Label>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 min-w-[220px]">
          <Label>Filter by Test</Label>
          <Select value={filterTest} onValueChange={setFilterTest}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tests</SelectItem>
              {tests.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {enriched.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing <strong>{enriched.length}</strong> submission(s) — Class Average:{" "}
          <strong>{avg.toFixed(1)}%</strong>
        </div>
      )}

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Results Found</h3>
          <p className="text-muted-foreground mt-2">
            No submissions match the selected filters. Adjust your filters or wait for students to complete tests.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(({ sub, student, test }) => {
                  const pct = sub.percentage;
                  const isPass = pct >= 40;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{student!.name}</TableCell>
                      <TableCell className="font-mono text-sm">{student!.rollNumber}</TableCell>
                      <TableCell>{student!.class} {student!.section}</TableCell>
                      <TableCell>{test!.title}</TableCell>
                      <TableCell>{new Date(sub.submittedAt).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell className="text-right font-medium">{sub.score}/{sub.totalMarks}</TableCell>
                      <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded
                          ${pct >= 75 ? "bg-green-100 text-green-800" : pct >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                          {getGrade(pct)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={isPass ? "bg-green-600" : ""} variant={isPass ? "default" : "destructive"}>
                          {isPass ? "Pass" : "Fail"}
                        </Badge>
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
