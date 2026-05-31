import { getStudents, getTests, getSubmissions } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

const CLASSES = ["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];

export default function PerformanceReport() {
  const students = getStudents();
  const tests = getTests();
  const submissions = getSubmissions();

  const subjects = [...new Set(tests.map((t) => t.subject))].sort();

  const classData = CLASSES.map((cls) => {
    const classStudents = students.filter((s) => s.class === cls);
    const classSubmissions = submissions.filter((sub) =>
      classStudents.some((s) => s.id === sub.studentId)
    );
    const avg =
      classSubmissions.length > 0
        ? classSubmissions.reduce((a, s) => a + s.percentage, 0) / classSubmissions.length
        : null;
    const passRate =
      classSubmissions.length > 0
        ? (classSubmissions.filter((s) => s.percentage >= 40).length / classSubmissions.length) * 100
        : null;
    return {
      cls,
      students: classStudents.length,
      tests: [...new Set(classSubmissions.map((s) => s.testId))].length,
      submissions: classSubmissions.length,
      avg,
      passRate,
    };
  }).filter((d) => d.students > 0);

  const subjectData = subjects.map((subj) => {
    const subjTests = tests.filter((t) => t.subject === subj);
    const subjSubmissions = submissions.filter((s) => subjTests.some((t) => t.id === s.testId));
    const avg =
      subjSubmissions.length > 0
        ? subjSubmissions.reduce((a, s) => a + s.percentage, 0) / subjSubmissions.length
        : null;
    return { subject: subj, tests: subjTests.length, submissions: subjSubmissions.length, avg };
  });

  if (classData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Reports</h2>
          <p className="text-muted-foreground">Class-wise and subject-wise performance breakdown.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Data Yet</h3>
          <p className="text-muted-foreground mt-2">
            Performance reports will appear once students and tests are set up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Performance Reports</h2>
        <p className="text-muted-foreground">Class-wise and subject-wise performance breakdown.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Class-wise Performance</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {classData.map((d) => (
            <Card key={d.cls} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{d.cls}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-semibold">{d.students}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tests Taken</span>
                  <span className="font-semibold">{d.tests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submissions</span>
                  <span className="font-semibold">{d.submissions}</span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-bold text-primary">
                    {d.avg !== null ? `${d.avg.toFixed(1)}%` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pass Rate</span>
                  <Badge className={d.passRate && d.passRate >= 50 ? "bg-green-600" : "bg-red-600"} variant="default">
                    {d.passRate !== null ? `${d.passRate.toFixed(1)}%` : "N/A"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Average %</TableHead>
                  <TableHead className="text-right">Pass Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.map((d) => (
                  <TableRow key={d.cls}>
                    <TableCell className="font-medium">{d.cls}</TableCell>
                    <TableCell className="text-right">{d.students}</TableCell>
                    <TableCell className="text-right">{d.submissions}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {d.avg !== null ? `${d.avg.toFixed(1)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${d.passRate && d.passRate >= 50 ? "text-green-700" : d.passRate !== null ? "text-red-600" : "text-muted-foreground"}`}>
                        {d.passRate !== null ? `${d.passRate.toFixed(1)}%` : "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {subjectData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Subject-wise Performance</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Tests</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                    <TableHead className="text-right">Average Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectData.map((d) => (
                    <TableRow key={d.subject}>
                      <TableCell className="font-medium">{d.subject}</TableCell>
                      <TableCell className="text-right">{d.tests}</TableCell>
                      <TableCell className="text-right">{d.submissions}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {d.avg !== null ? `${d.avg.toFixed(1)}%` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
