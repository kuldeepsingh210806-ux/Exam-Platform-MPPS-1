import { useEffect, useState } from "react";
import {
  listenStudents, deleteStudentProfile, updateStudentProfile,
  getAllAttempts, getAllTests, StudentProfile, Attempt, Test,
} from "@/lib/firestore";
import { computeTestRanks, computeOverallRank, getGrade } from "@/lib/ranking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Users, Eye, Edit2, RefreshCw, BookOpen, Trophy, Target, TrendingUp } from "lucide-react";

const CLASSES = ["3rd","4th","5th","6th","7th","8th","9th","10th","11th Bio","11th Commerce","11th Maths","12th Bio","12th Commerce","12th Maths"];
const SECTIONS = ["A","B","C","D"];

export default function PrincipalManageStudents() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [tests,    setTests]    = useState<Test[]>([]);
  const [search,   setSearch]   = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [deleteUid,   setDeleteUid]   = useState<string|null>(null);
  const [viewStudent, setViewStudent] = useState<StudentProfile|null>(null);
  const [editStudent, setEditStudent] = useState<StudentProfile|null>(null);
  const [editForm,    setEditForm]    = useState<Partial<StudentProfile>>({});
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);
  const [loading,     setLoading]     = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [a, t] = await Promise.all([getAllAttempts(), getAllTests()]);
    setAttempts(a); setTests(t); setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    const u = listenStudents(s => { setStudents(s); setLastUpdated(new Date()); });
    loadData();
    return u;
  }, []);

  const filtered = students
    .filter(s => s && s.uid)
    .filter(s => filterClass === "all" || s.class === filterClass)
    .filter(s =>
      (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNumber ?? "").includes(search) || (s.mobile ?? "").includes(search) ||
      (s.admissionNumber ?? "").includes(search)
    );

  const getStudentStats = (s: StudentProfile) => {
    const sa = attempts.filter(a => a.studentId === s.uid && a.submitted);
    const avg = sa.length > 0 ? sa.reduce((acc, a) => acc + (a.percentage ?? 0), 0) / sa.length : 0;
    const highest = sa.length > 0 ? Math.max(...sa.map(a => a.percentage ?? 0)) : 0;
    const lowest  = sa.length > 0 ? Math.min(...sa.map(a => a.percentage ?? 0)) : 0;
    const overallRank = attempts.length > 0 ? computeOverallRank(s.uid, attempts) : 0;
    return { attempted: sa.length, total: tests.length, avg, highest, lowest, overallRank };
  };

  const getTestHistory = (uid: string) =>
    attempts
      .filter(a => a.studentId === uid && a.submitted)
      .map(a => {
        const test = tests.find(t => t.id === a.testId);
        const testAttempts = attempts.filter(x => x.testId === a.testId && x.submitted);
        const rank = (computeTestRanks(testAttempts)).get(a.id) ?? 0;
        return { attempt: a, test, rank, totalStudents: testAttempts.length };
      })
      .filter(r => r.test)
      .sort((a, b) => new Date(b.attempt.submittedAt!).getTime() - new Date(a.attempt.submittedAt!).getTime());

  const getSubjectPerf = (uid: string) => {
    const map = new Map<string, number[]>();
    getTestHistory(uid).forEach(({ attempt, test }) => {
      if (!test) return;
      if (!map.has(test.subject)) map.set(test.subject, []);
      map.get(test.subject)!.push(attempt.percentage ?? 0);
    });
    return Array.from(map.entries()).map(([subject, pcts]) => ({
      subject, count: pcts.length, avg: pcts.reduce((s, p) => s + p, 0) / pcts.length,
    }));
  };

  const openEdit = (s: StudentProfile) => { setEditStudent(s); setEditForm({ ...s }); };

  const saveEdit = async () => {
    if (!editStudent) return;
    try {
      await updateStudentProfile(editStudent.uid, {
        name: editForm.name, admissionNumber: editForm.admissionNumber,
        rollNumber: editForm.rollNumber, class: editForm.class,
        section: editForm.section, mobile: editForm.mobile,
      });
      toast({ title: "Student updated successfully." });
      setEditStudent(null);
    } catch { toast({ title: "Failed to update.", variant: "destructive" }); }
  };

  const confirmDelete = async () => {
    if (!deleteUid) return;
    await deleteStudentProfile(deleteUid);
    setDeleteUid(null);
    toast({ title: "Student removed." });
  };

  const classOptions = [
    { value: "all", label: "All Classes" },
    ...CLASSES.map(c => ({ value: c, label: c })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Students</h2>
          <p className="text-muted-foreground">{students.length} student(s) registered.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-xs text-muted-foreground hidden sm:block">Updated {lastUpdated.toLocaleTimeString("en-IN")}</span>}
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, roll, mobile, admission no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <SearchableSelect value={filterClass} onValueChange={setFilterClass} options={classOptions} placeholder="All Classes" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Students Found</h3>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Adm. No.</TableHead><TableHead>Roll No.</TableHead>
                  <TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Mobile</TableHead>
                  <TableHead className="text-right">Tests</TableHead><TableHead className="text-right">Avg %</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => {
                  const { attempted, avg } = getStudentStats(s);
                  return (
                    <TableRow key={s.uid}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-sm">{s.admissionNumber || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{s.rollNumber}</TableCell>
                      <TableCell>{s.class}</TableCell><TableCell>{s.section}</TableCell>
                      <TableCell>{s.mobile}</TableCell>
                      <TableCell className="text-right">{attempted}</TableCell>
                      <TableCell className="text-right">
                        {attempted > 0 ? (
                          <span className={`font-semibold ${avg >= 75 ? "text-green-600" : avg >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                            {avg.toFixed(1)}%
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewStudent(s)}><Eye className="w-4 h-4 text-blue-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit2 className="w-4 h-4 text-primary" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteUid(s.uid)}>
                            <Trash2 className="w-4 h-4" />
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

      {/* View Student Dialog */}
      {viewStudent && (() => {
        const stats = getStudentStats(viewStudent);
        const history = getTestHistory(viewStudent.uid);
        const subjectPerf = getSubjectPerf(viewStudent.uid);
        return (
          <Dialog open onOpenChange={o => !o && setViewStudent(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{viewStudent.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{viewStudent.class} {viewStudent.section} · Roll #{viewStudent.rollNumber}</p>
              </DialogHeader>
              <Tabs defaultValue="profile">
                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                  <TabsTrigger value="academic" className="flex-1">Academic</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">Test History</TabsTrigger>
                  <TabsTrigger value="performance" className="flex-1">Performance</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ["Full Name", viewStudent.name],
                      ["Admission No.", viewStudent.admissionNumber || "Not set"],
                      ["Roll Number", viewStudent.rollNumber],
                      ["Class", viewStudent.class], ["Section", viewStudent.section],
                      ["Mobile", viewStudent.mobile],
                      ["Registered", new Date(viewStudent.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })],
                    ].map(([label, value]) => (
                      <div key={label}><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p><p className="text-sm font-medium">{value}</p></div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="academic" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Attempted", value: stats.attempted, icon: BookOpen, color: "text-blue-600" },
                      { label: "Available", value: stats.total, icon: BookOpen, color: "text-muted-foreground" },
                      { label: "Average", value: `${stats.avg.toFixed(1)}%`, icon: Target, color: "text-primary" },
                      { label: "Highest", value: stats.attempted > 0 ? `${stats.highest.toFixed(1)}%` : "—", icon: TrendingUp, color: "text-green-600" },
                      { label: "Lowest", value: stats.attempted > 0 ? `${stats.lowest.toFixed(1)}%` : "—", icon: TrendingUp, color: "text-red-500" },
                      { label: "Overall Rank", value: stats.overallRank > 0 ? `#${stats.overallRank}` : "—", icon: Trophy, color: "text-accent" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="border rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1"><Icon className={`w-3.5 h-3.5 ${color}`} /><p className="text-xs text-muted-foreground">{label}</p></div>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  {history.length === 0 ? <p className="text-center text-muted-foreground py-8">No tests attempted yet.</p> : (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Test</TableHead><TableHead>Subject</TableHead><TableHead>Date</TableHead>
                        <TableHead className="text-right">Marks</TableHead><TableHead className="text-right">%</TableHead>
                        <TableHead className="text-center">Rank</TableHead><TableHead className="text-center">Grade</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {history.map(({ attempt, test, rank, totalStudents }) => {
                          const pct = attempt.percentage ?? 0;
                          const { grade, color } = getGrade(pct);
                          return (
                            <TableRow key={attempt.id}>
                              <TableCell className="font-medium text-sm">{test!.title}</TableCell>
                              <TableCell className="text-sm">{test!.subject}</TableCell>
                              <TableCell className="text-sm">{new Date(attempt.submittedAt!).toLocaleDateString("en-IN")}</TableCell>
                              <TableCell className="text-right text-sm">{attempt.score}/{attempt.totalMarks}</TableCell>
                              <TableCell className="text-right text-sm">{pct.toFixed(1)}%</TableCell>
                              <TableCell className="text-center text-sm font-bold">{rank > 0 ? `${rank}/${totalStudents}` : "—"}</TableCell>
                              <TableCell className="text-center"><span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{grade}</span></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                <TabsContent value="performance" className="mt-4">
                  {subjectPerf.length === 0 ? <p className="text-center text-muted-foreground py-8">No data yet.</p> : (
                    <div className="space-y-3">
                      {subjectPerf.map(({ subject, count, avg }) => {
                        const { grade, color } = getGrade(avg);
                        return (
                          <div key={subject} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{subject}</p><p className="text-xs text-muted-foreground">{count} test{count !== 1 ? "s" : ""}</p></div>
                            <p className="font-bold text-lg">{avg.toFixed(1)}%</p>
                            <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${avg >= 75 ? "bg-green-500" : avg >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${avg}%` }} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{grade}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Edit Dialog */}
      <Dialog open={!!editStudent} onOpenChange={o => !o && setEditStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Full Name</Label><Input value={editForm.name ?? ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Admission Number</Label><Input placeholder="e.g. 2024001" value={editForm.admissionNumber ?? ""} onChange={e => setEditForm(f => ({ ...f, admissionNumber: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Roll Number</Label><Input value={editForm.rollNumber ?? ""} onChange={e => setEditForm(f => ({ ...f, rollNumber: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Class</Label>
                <SearchableSelect value={editForm.class ?? ""} onValueChange={v => setEditForm(f => ({ ...f, class: v }))} options={CLASSES.map(c => ({ value: c, label: c }))} placeholder="Select" />
              </div>
              <div className="space-y-1"><Label>Section</Label>
                <SearchableSelect value={editForm.section ?? ""} onValueChange={v => setEditForm(f => ({ ...f, section: v }))} options={SECTIONS.map(s => ({ value: s, label: s }))} placeholder="Select" />
              </div>
            </div>
            <div className="space-y-1"><Label>Mobile Number</Label><Input value={editForm.mobile ?? ""} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUid} onOpenChange={o => !o && setDeleteUid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription>This removes their registration. Their test attempts remain.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
