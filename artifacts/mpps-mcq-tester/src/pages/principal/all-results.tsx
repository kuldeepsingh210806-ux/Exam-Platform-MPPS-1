import { useEffect, useState } from "react";
import { listenTests, listenStudents, listenAttempts, Test, StudentProfile, Attempt } from "@/lib/firestore";
import { computeTestRanks, getGrade } from "@/lib/ranking";
import { buildResultMessage, buildClassResultMessage, shareAndLog } from "@/lib/whatsapp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MessageCircle, Users, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSharingHistory, SharingHistory } from "@/lib/firestore";

export default function AllResults() {
  const { toast } = useToast();
  const [tests,    setTests]    = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [filterClass, setFilterClass] = useState("all");
  const [filterTest,  setFilterTest]  = useState("all");
  const [sharingHistory, setSharingHistory] = useState<SharingHistory[]>([]);

  useEffect(() => {
    const u1 = listenTests(setTests);
    const u2 = listenStudents(setStudents);
    const u3 = listenAttempts(setAttempts);
    getSharingHistory().then(setSharingHistory);
    return () => { u1(); u2(); u3(); };
  }, []);

  const classes = [...new Set(students.map(s => s.class))].sort();
  const submitted = attempts.filter(a => a.submitted);

  const rows = submitted
    .map(a => ({
      a,
      student: students.find(s => s.uid === a.studentId),
      test:    tests.find(t => t.id === a.testId),
    }))
    .filter(r => r.student && r.test)
    .filter(r => filterClass === "all" || r.student!.class === filterClass)
    .filter(r => filterTest  === "all" || r.test!.id === filterTest)
    .sort((x, y) => new Date(y.a.submittedAt!).getTime() - new Date(x.a.submittedAt!).getTime());

  // Ranks per test
  const ranksByTest = new Map<string, Map<string, number>>();
  tests.forEach(t => {
    ranksByTest.set(t.id, computeTestRanks(submitted.filter(a => a.testId === t.id)));
  });

  const scoreDistribution = [
    { range: "0-39%",   count: rows.filter(r => (r.a.percentage ?? 0) < 40).length },
    { range: "40-59%",  count: rows.filter(r => { const p = r.a.percentage??0; return p>=40&&p<60; }).length },
    { range: "60-74%",  count: rows.filter(r => { const p = r.a.percentage??0; return p>=60&&p<75; }).length },
    { range: "75-89%",  count: rows.filter(r => { const p = r.a.percentage??0; return p>=75&&p<90; }).length },
    { range: "90-100%", count: rows.filter(r => (r.a.percentage ?? 0) >= 90).length },
  ];

  const classOptions = [
    { value: "all", label: "All Classes" },
    ...classes.map(c => ({ value: c, label: c })),
  ];
  const testOptions = [
    { value: "all", label: "All Tests" },
    ...tests.map(t => ({ value: t.id, label: t.title })),
  ];

  const shareIndividual = async (r: typeof rows[0]) => {
    const testAttempts = submitted.filter(a => a.testId === r.test!.id);
    const rankMap = ranksByTest.get(r.test!.id) ?? new Map();
    const rank = rankMap.get(r.a.id) ?? 0;
    const { grade } = getGrade(r.a.percentage ?? 0);
    const msg = buildResultMessage({
      studentName: r.student!.name,
      rollNumber:  r.student!.rollNumber,
      className:   `${r.student!.class} ${r.student!.section}`,
      testTitle:   r.test!.title,
      subject:     r.test!.subject,
      score:       r.a.score ?? 0,
      totalMarks:  r.a.totalMarks ?? 0,
      percentage:  r.a.percentage ?? 0,
      rank,
      totalStudents: testAttempts.length,
      submittedAt: r.a.submittedAt!,
    });
    await shareAndLog(msg, {
      type: "individual",
      studentId:   r.student!.uid,
      studentName: r.student!.name,
      testId:      r.test!.id,
      testTitle:   r.test!.title,
      sharedBy:    "Principal",
      sharedAt:    new Date().toISOString(),
    });
    getSharingHistory().then(setSharingHistory);
    toast({ title: "WhatsApp opened!", description: `Result for ${r.student!.name}` });
  };

  const shareClass = async () => {
    if (filterTest === "all" || filterClass === "all") {
      toast({ title: "Select a specific class AND test to share.", variant: "destructive" }); return;
    }
    const test = tests.find(t => t.id === filterTest);
    if (!test) return;
    const rankMap = ranksByTest.get(filterTest) ?? new Map();
    const results = rows.map(r => ({
      name:       r.student!.name,
      score:      r.a.score ?? 0,
      totalMarks: r.a.totalMarks ?? 0,
      percentage: r.a.percentage ?? 0,
      rank:       rankMap.get(r.a.id) ?? 0,
    }));
    const msg = buildClassResultMessage(filterClass, test.title, test.subject, results);
    await shareAndLog(msg, {
      type: "class", className: filterClass,
      testId: filterTest, testTitle: test.title,
      sharedBy: "Principal", sharedAt: new Date().toISOString(),
    });
    getSharingHistory().then(setSharingHistory);
    toast({ title: "Class results shared on WhatsApp!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Results</h2>
          <p className="text-muted-foreground">Complete result view across all classes and tests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={shareClass} className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
          <MessageCircle className="w-4 h-4" />
          <Users className="w-3.5 h-3.5" /> Class WhatsApp
        </Button>
      </div>

      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="history">Sharing History</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4 mt-4">
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

          {rows.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f97316" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No results match the selected filters.</p>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
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
                    {rows.map(r => {
                      const pct = r.a.percentage ?? 0;
                      const { grade, color } = getGrade(pct);
                      const rankMap = ranksByTest.get(r.test!.id) ?? new Map();
                      const rank = rankMap.get(r.a.id) ?? 0;
                      const totalInTest = submitted.filter(a => a.testId === r.test!.id).length;
                      return (
                        <TableRow key={r.a.id}>
                          <TableCell className="font-medium">{r.student!.name}</TableCell>
                          <TableCell>{r.student!.class} {r.student!.section}</TableCell>
                          <TableCell className="text-sm">{r.test!.title}</TableCell>
                          <TableCell className="text-sm">{r.test!.subject}</TableCell>
                          <TableCell className="text-sm">{new Date(r.a.submittedAt!).toLocaleDateString("en-IN")}</TableCell>
                          <TableCell className="text-right">{r.a.score}/{r.a.totalMarks}</TableCell>
                          <TableCell className="text-right font-medium">{pct.toFixed(1)}%</TableCell>
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
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {sharingHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold">No Sharing History</h3>
              <p className="text-muted-foreground mt-1">WhatsApp shares will appear here.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Shared By</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharingHistory.map(h => (
                      <TableRow key={h.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{h.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {h.type === "individual" ? h.studentName : h.className}
                        </TableCell>
                        <TableCell className="text-sm">{h.testTitle}</TableCell>
                        <TableCell className="text-sm">{h.sharedBy}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(h.sharedAt).toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
