import { useEffect, useState } from "react";
import { listenTests, listenStudents, listenAttempts, Test, StudentProfile, Attempt } from "@/lib/firestore";
import { computeTestRanks, getGrade } from "@/lib/ranking";
import { buildResultMessage, buildClassResultMessage, shareAndLog } from "@/lib/whatsapp";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { ClipboardList, MessageCircle, RefreshCw, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeacherResults() {
  const { teacherProfile } = useAuth();
  const { toast } = useToast();
  const [tests, setTests]       = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [filterClass, setFilterClass] = useState("all");
  const [filterTest,  setFilterTest]  = useState("all");
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);

  useEffect(() => {
    const u1 = listenTests(t  => { setTests(t);    setLastUpdated(new Date()); });
    const u2 = listenStudents(s => { setStudents(s); setLastUpdated(new Date()); });
    const u3 = listenAttempts(a => { setAttempts(a); setLastUpdated(new Date()); });
    return () => { u1(); u2(); u3(); };
  }, []);

  const classes = [...new Set(students.map(s => s.class))].sort();

  const submitted = attempts.filter(a => a.submitted);

  const enriched = submitted
    .map(a => ({
      a,
      student: students.find(s => s.uid === a.studentId),
      test: tests.find(t => t.id === a.testId),
    }))
    .filter(r => r.student && r.test)
    .filter(r => filterClass === "all" || r.student!.class === filterClass)
    .filter(r => filterTest  === "all" || r.test!.id === filterTest)
    .sort((x, y) => new Date(y.a.submittedAt!).getTime() - new Date(x.a.submittedAt!).getTime());

  // Compute ranks per test
  const ranksByTest = new Map<string, Map<string, number>>();
  tests.forEach(t => {
    const testAttempts = submitted.filter(a => a.testId === t.id);
    ranksByTest.set(t.id, computeTestRanks(testAttempts));
  });

  const avg = enriched.length > 0
    ? enriched.reduce((s, r) => s + (r.a.percentage ?? 0), 0) / enriched.length
    : 0;

  const classOptions = [
    { value: "all", label: "All Classes" },
    ...classes.map(c => ({ value: c, label: c })),
  ];
  const testOptions = [
    { value: "all", label: "All Tests" },
    ...tests.map(t => ({ value: t.id, label: t.title })),
  ];

  const shareIndividual = async (r: typeof enriched[0]) => {
    const testAttempts = submitted.filter(a => a.testId === r.test!.id);
    const rankMap = ranksByTest.get(r.test!.id) ?? new Map();
    const rank = rankMap.get(r.a.id) ?? 0;
    const { grade } = getGrade(r.a.percentage ?? 0);
    const msg = buildResultMessage({
      studentName: r.student!.name,
      rollNumber: r.student!.rollNumber,
      className: `${r.student!.class} ${r.student!.section}`,
      testTitle: r.test!.title,
      subject: r.test!.subject,
      score: r.a.score ?? 0,
      totalMarks: r.a.totalMarks ?? 0,
      percentage: r.a.percentage ?? 0,
      rank,
      totalStudents: testAttempts.length,
      submittedAt: r.a.submittedAt!,
    });
    await shareAndLog(msg, {
      type: "individual",
      studentId: r.student!.uid,
      studentName: r.student!.name,
      testId: r.test!.id,
      testTitle: r.test!.title,
      sharedBy: teacherProfile?.name ?? "Teacher",
      sharedAt: new Date().toISOString(),
    });
    toast({ title: "WhatsApp opened!", description: `Sharing result for ${r.student!.name}` });
  };

  const shareClass = async () => {
    if (filterTest === "all" || filterClass === "all") {
      toast({ title: "Select a specific class AND test to share class results.", variant: "destructive" });
      return;
    }
    const test = tests.find(t => t.id === filterTest);
    if (!test) return;
    const rankMap = ranksByTest.get(filterTest) ?? new Map();
    const results = enriched.map(r => ({
      name: r.student!.name,
      score: r.a.score ?? 0,
      totalMarks: r.a.totalMarks ?? 0,
      percentage: r.a.percentage ?? 0,
      rank: rankMap.get(r.a.id) ?? 0,
    }));
    const msg = buildClassResultMessage(filterClass, test.title, test.subject, results);
    await shareAndLog(msg, {
      type: "class",
      className: filterClass,
      testId: filterTest,
      testTitle: test.title,
      sharedBy: teacherProfile?.name ?? "Teacher",
      sharedAt: new Date().toISOString(),
    });
    toast({ title: "Class results shared on WhatsApp!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">View Results</h2>
          <p className="text-muted-foreground">All student submissions with live ranking.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString("en-IN")}
            </span>
          )}
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="w-4 h-4 mr-1" /> Live
          </Button>
          <Button variant="outline" size="sm" onClick={shareClass} className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
            <MessageCircle className="w-4 h-4" />
            <Users className="w-3.5 h-3.5" /> Class WhatsApp
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1 min-w-[180px]">
          <Label>Filter by Class</Label>
          <SearchableSelect value={filterClass} onValueChange={setFilterClass} options={classOptions} placeholder="All Classes" />
        </div>
        <div className="space-y-1 min-w-[220px]">
          <Label>Filter by Test</Label>
          <SearchableSelect value={filterTest} onValueChange={setFilterTest} options={testOptions} placeholder="All Tests" />
        </div>
      </div>

      {enriched.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <strong>{enriched.length}</strong> submission(s) · Avg: <strong>{avg.toFixed(1)}%</strong>
        </p>
      )}

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Results Found</h3>
          <p className="text-muted-foreground mt-2">No submissions match the selected filters.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Rank</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(r => {
                  const pct = r.a.percentage ?? 0;
                  const { grade, color } = getGrade(pct);
                  const rankMap = ranksByTest.get(r.test!.id) ?? new Map();
                  const rank = rankMap.get(r.a.id) ?? 0;
                  const totalInTest = submitted.filter(a => a.testId === r.test!.id).length;
                  return (
                    <TableRow key={r.a.id}>
                      <TableCell className="font-medium">{r.student!.name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.student!.rollNumber}</TableCell>
                      <TableCell>{r.student!.class} {r.student!.section}</TableCell>
                      <TableCell className="text-sm">{r.test!.title}</TableCell>
                      <TableCell className="text-sm">{r.test!.subject}</TableCell>
                      <TableCell className="text-sm">{new Date(r.a.submittedAt!).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell className="text-right font-medium">{r.a.score}/{r.a.totalMarks}</TableCell>
                      <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                      <TableCell className="text-center font-bold text-sm">
                        {rank > 0 ? `${rank}/${totalInTest}` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{grade}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={pct >= 40 ? "bg-green-600" : ""} variant={pct >= 40 ? "default" : "destructive"}>
                          {pct >= 40 ? "Pass" : "Fail"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost" size="icon"
                          className="text-green-700 hover:text-green-800 hover:bg-green-50"
                          title="Share on WhatsApp"
                          onClick={() => shareIndividual(r)}
                        >
                          <MessageCircle className="w-4 h-4" />
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
