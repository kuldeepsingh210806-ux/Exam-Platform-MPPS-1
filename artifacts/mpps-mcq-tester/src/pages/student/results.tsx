import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { getAttemptsByStudent, getAllTests, getAllAttempts, getAllViolations, Attempt, Test, Violation } from "@/lib/firestore";
import { computeTestRanks, computeOverallRank, getGrade, getMotivationalFeedback } from "@/lib/ranking";
import { printStudentResultPDF } from "@/lib/pdf-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Target, ClipboardList, RefreshCw, ShieldCheck, ShieldAlert, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentResults() {
  const [, navigate] = useLocation();
  const { user, studentProfile } = useAuth();
  const { toast } = useToast();
  const [rows, setRows]         = useState<{ attempt: Attempt; test: Test; rank: number; totalInTest: number }[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [overallRank, setOverallRank] = useState<number>(0);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [attempts, tests, allAttempts, viols] = await Promise.all([
      getAttemptsByStudent(user.uid),
      getAllTests(),
      getAllAttempts(),
      getAllViolations(),
    ]);

    const submitted = attempts.filter(a => a.submitted);
    const mapped = submitted
      .map(a => {
        const test = tests.find(t => t.id === a.testId);
        if (!test) return null;
        const testAttempts = allAttempts.filter(x => x.testId === a.testId && x.submitted);
        const rankMap = computeTestRanks(testAttempts);
        return {
          attempt: a,
          test,
          rank: rankMap.get(a.id) ?? 0,
          totalInTest: testAttempts.length,
        };
      })
      .filter(Boolean) as { attempt: Attempt; test: Test; rank: number; totalInTest: number }[];

    mapped.sort((a, b) =>
      new Date(b.attempt.submittedAt!).getTime() - new Date(a.attempt.submittedAt!).getTime()
    );

    setRows(mapped);
    setOverallRank(computeOverallRank(user.uid, allAttempts));
    setViolations(viols.filter(v => v.studentId === user.uid));
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const avg  = rows.length > 0 ? rows.reduce((s, r) => s + (r.attempt.percentage ?? 0), 0) / rows.length : 0;
  const best = rows.length > 0 ? Math.max(...rows.map(r => r.attempt.percentage ?? 0)) : 0;
  const totalViolations = violations.reduce((s, v) => s + v.count, 0);
  const integrityClean  = totalViolations === 0;

  const handleDownloadPDF = (r: { attempt: Attempt; test: Test; rank: number; totalInTest: number }) => {
    if (!studentProfile) return;
    const viol = violations.find(v => v.testId === r.test.id);
    printStudentResultPDF({
      studentName:    studentProfile.name,
      admissionNumber: studentProfile.admissionNumber,
      rollNumber:     studentProfile.rollNumber,
      className:      `${studentProfile.class} ${studentProfile.section}`,
      testTitle:      r.test.title,
      subject:        r.test.subject,
      score:          r.attempt.score ?? 0,
      totalMarks:     r.attempt.totalMarks ?? 0,
      percentage:     r.attempt.percentage ?? 0,
      rank:           r.rank,
      totalInTest:    r.totalInTest,
      timeTaken:      r.attempt.timeTaken ?? 0,
      tabSwitches:    viol?.count ?? 0,
      submittedAt:    r.attempt.submittedAt!,
    });
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Loading results...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Results</h2>
          <p className="text-muted-foreground">Your complete test result history with ranking.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString("en-IN")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tests Taken",    value: rows.length,          icon: ClipboardList, color: "text-primary" },
          { label: "Average Score",  value: `${avg.toFixed(1)}%`, icon: Target,        color: "text-blue-600" },
          { label: "Best Score",     value: `${best.toFixed(1)}%`,icon: Trophy,        color: "text-green-600" },
          { label: "Overall Rank",   value: overallRank > 0 ? `#${overallRank}` : "—", icon: Trophy, color: "text-accent" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Motivational Feedback */}
      {rows.length > 0 && (
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-sm font-medium">{getMotivationalFeedback(avg)}</p>
          </CardContent>
        </Card>
      )}

      {/* Integrity Card */}
      <Card className={`border-l-4 ${integrityClean ? "border-l-green-500" : "border-l-yellow-400"}`}>
        <CardContent className="pt-4 flex items-center gap-3">
          {integrityClean
            ? <ShieldCheck className="w-5 h-5 text-green-600" />
            : <ShieldAlert className="w-5 h-5 text-yellow-600" />}
          <div>
            <p className="font-medium text-sm">
              {integrityClean ? "Integrity Status: Clean" : "Integrity Status: Violations Recorded"}
            </p>
            <p className="text-xs text-muted-foreground">
              {integrityClean
                ? "No tab switches or violations detected."
                : `${totalViolations} violation(s) across ${violations.length} test(s).`}
            </p>
          </div>
          <Badge className="ml-auto" variant={integrityClean ? "outline" : "destructive"}>
            {integrityClean ? "Clean" : `${totalViolations} violation(s)`}
          </Badge>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No results yet. Complete a test to see your scores here.</p>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Rank</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Integrity</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ attempt, test, rank, totalInTest }) => {
                  const pct = attempt.percentage ?? 0;
                  const { grade, color } = getGrade(pct);
                  const viol = violations.find(v => v.testId === test.id);
                  return (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell>{test.subject}</TableCell>
                      <TableCell>{new Date(attempt.submittedAt!).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell className="text-right">{attempt.score}/{attempt.totalMarks}</TableCell>
                      <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                      <TableCell className="text-center font-bold text-sm">
                        {rank > 0 ? `${rank}/${totalInTest}` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{grade}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={pct >= 40 ? "bg-green-600" : ""} variant={pct >= 40 ? "default" : "destructive"}>
                          {pct >= 40 ? "Pass" : "Fail"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {viol && viol.count > 0 ? (
                          <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                            {viol.count} switch{viol.count !== 1 ? "es" : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-green-700 font-semibold">Clean</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/student/review/${test.id}`)}>
                            Review
                          </Button>
                          <Button size="sm" variant="ghost" title="Download PDF" onClick={() => handleDownloadPDF({ attempt, test, rank, totalInTest })}>
                            <FileDown className="w-4 h-4" />
                          </Button>
                        </div>
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
