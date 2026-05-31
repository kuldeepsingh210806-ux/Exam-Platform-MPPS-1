import { getTests, getSession, getSubmissions } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Target, BookOpen, ClipboardList } from "lucide-react";

function getGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 90) return { grade: "A+", color: "bg-green-100 text-green-800" };
  if (percentage >= 75) return { grade: "A", color: "bg-green-100 text-green-700" };
  if (percentage >= 60) return { grade: "B", color: "bg-blue-100 text-blue-800" };
  if (percentage >= 40) return { grade: "C", color: "bg-yellow-100 text-yellow-800" };
  return { grade: "F", color: "bg-red-100 text-red-800" };
}

export default function StudentResults() {
  const [, navigate] = useLocation();
  const session = getSession();
  const tests = getTests();
  const submissions = getSubmissions()
    .filter((s) => s.studentId === session?.studentId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const results = submissions.map((sub) => ({
    sub,
    test: tests.find((t) => t.id === sub.testId),
  })).filter((r) => r.test !== undefined);

  const avgPercentage =
    results.length > 0
      ? results.reduce((acc, r) => acc + r.sub.percentage, 0) / results.length
      : 0;
  const bestScore = results.length > 0 ? Math.max(...results.map((r) => r.sub.percentage)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Results</h2>
        <p className="text-muted-foreground">Your complete test result history.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
            <ClipboardList className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPercentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Trophy className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Results Yet</h3>
          <p className="text-muted-foreground max-w-md mt-2">
            Once you complete a test, your results will appear here with your score and grade.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map(({ sub, test }) => {
                  if (!test) return null;
                  const { grade, color } = getGrade(sub.percentage);
                  const isPass = sub.percentage >= 40;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell>{test.subject}</TableCell>
                      <TableCell>{new Date(sub.submittedAt).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell className="text-right font-medium">
                        {sub.score} / {sub.totalMarks}
                      </TableCell>
                      <TableCell className="text-right">{sub.percentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}>
                          {grade}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isPass ? "default" : "destructive"} className={isPass ? "bg-green-600" : ""}>
                          {isPass ? "Pass" : "Fail"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/student/review/${test.id}`)}
                        >
                          Review
                        </Button>
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
