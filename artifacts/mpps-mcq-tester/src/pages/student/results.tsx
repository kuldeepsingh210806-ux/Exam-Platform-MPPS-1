import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { getAttemptsByStudent, getAllTests, Attempt, Test } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Target, ClipboardList } from "lucide-react";

function getGrade(p: number) {
  if (p >= 90) return { grade: "A+", color: "bg-green-100 text-green-800" };
  if (p >= 75) return { grade: "A", color: "bg-green-100 text-green-700" };
  if (p >= 60) return { grade: "B", color: "bg-blue-100 text-blue-800" };
  if (p >= 40) return { grade: "C", color: "bg-yellow-100 text-yellow-800" };
  return { grade: "F", color: "bg-red-100 text-red-800" };
}

export default function StudentResults() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [rows, setRows] = useState<{ attempt: Attempt; test: Test }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [attempts, tests] = await Promise.all([getAttemptsByStudent(user.uid), getAllTests()]);
      setRows(
        attempts.filter((a) => a.submitted)
          .map((a) => ({ attempt: a, test: tests.find((t) => t.id === a.testId)! }))
          .filter((r) => r.test)
          .sort((a, b) => new Date(b.attempt.submittedAt!).getTime() - new Date(a.attempt.submittedAt!).getTime())
      );
    })();
  }, [user]);

  const avg = rows.length > 0 ? rows.reduce((s, r) => s + (r.attempt.percentage ?? 0), 0) / rows.length : 0;
  const best = rows.length > 0 ? Math.max(...rows.map((r) => r.attempt.percentage ?? 0)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Results</h2>
        <p className="text-muted-foreground">Your complete test result history.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Tests Taken", value: rows.length, icon: ClipboardList },
          { label: "Average Score", value: `${avg.toFixed(1)}%`, icon: Target },
          { label: "Best Score", value: `${best.toFixed(1)}%`, icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <Icon className="w-5 h-5 text-primary" />
              <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No results yet. Complete a test to see your scores here.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead><TableHead>Subject</TableHead><TableHead>Date</TableHead>
                  <TableHead className="text-right">Score</TableHead><TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Grade</TableHead><TableHead className="text-center">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ attempt, test }) => {
                  const pct = attempt.percentage ?? 0;
                  const { grade, color } = getGrade(pct);
                  return (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell>{test.subject}</TableCell>
                      <TableCell>{new Date(attempt.submittedAt!).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell className="text-right">{attempt.score}/{attempt.totalMarks}</TableCell>
                      <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                      <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{grade}</span></TableCell>
                      <TableCell className="text-center">
                        <Badge className={pct >= 40 ? "bg-green-600" : ""} variant={pct >= 40 ? "default" : "destructive"}>
                          {pct >= 40 ? "Pass" : "Fail"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/student/review/${test.id}`)}>Review</Button>
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
