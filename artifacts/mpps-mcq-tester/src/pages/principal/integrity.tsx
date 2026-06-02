import { useEffect, useState } from "react";
import { listenViolations, listenStudents, listenTests, Violation, StudentProfile, Test } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ShieldAlert, ShieldCheck, Search } from "lucide-react";

const CLASSES = ["3rd","4th","5th","6th","7th","8th","9th","10th","11th Bio","11th Commerce","11th Maths","12th Bio","12th Commerce","12th Maths"];

export default function PrincipalIntegrityReport() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [students,   setStudents]   = useState<StudentProfile[]>([]);
  const [tests,      setTests]      = useState<Test[]>([]);
  const [search,     setSearch]     = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);

  useEffect(() => {
    const u1 = listenViolations(v => { setViolations(v); setLastUpdated(new Date()); });
    const u2 = listenStudents(setStudents);
    const u3 = listenTests(setTests);
    return () => { u1(); u2(); u3(); };
  }, []);

  const enriched = violations
    .map(v => ({
      v,
      student: students.find(s => s.uid === v.studentId),
      test:    tests.find(t => t.id === v.testId),
    }))
    .filter(r => r.student && r.test)
    .filter(r => filterClass === "all" || r.student!.class === filterClass)
    .filter(r =>
      r.student!.name.toLowerCase().includes(search.toLowerCase()) ||
      r.test!.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.v.count - a.v.count);

  const autoSubmitted  = enriched.filter(r => r.v.autoSubmitted).length;
  const studentsFlag   = new Set(enriched.map(r => r.v.studentId)).size;
  const totalViolCount = enriched.reduce((s, r) => s + r.v.count, 0);

  const classOptions = [
    { value: "all", label: "All Classes" },
    ...CLASSES.map(c => ({ value: c, label: c })),
  ];

  // Class violation summary
  const classSummary = CLASSES
    .map(cls => {
      const classStudents = students.filter(s => s.class === cls);
      const classViols    = enriched.filter(r => classStudents.some(s => s.uid === r.v.studentId));
      return { class: cls, count: classViols.length, autoSubmitted: classViols.filter(r => r.v.autoSubmitted).length };
    })
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">School-wide Integrity Report</h2>
          <p className="text-muted-foreground">Anti-cheating violations across all classes and tests.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-xs text-muted-foreground hidden sm:block">Updated {lastUpdated.toLocaleTimeString("en-IN")}</span>}
          <Badge variant="outline" className="text-xs">Live</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Violations",   value: totalViolCount, color: "text-yellow-600" },
          { label: "Auto-Submitted",     value: autoSubmitted,  color: "text-red-600"    },
          { label: "Students Flagged",   value: studentsFlag,   color: "text-orange-600" },
          { label: "Classes Affected",   value: classSummary.length, color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Class Summary */}
      {classSummary.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold text-sm mb-3">Violations by Class</h3>
            <div className="flex flex-wrap gap-2">
              {classSummary.map(c => (
                <div key={c.class} className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium">{c.class}</span>
                  <Badge variant="outline" className="text-xs">{c.count} violation{c.count !== 1 ? "s" : ""}</Badge>
                  {c.autoSubmitted > 0 && (
                    <Badge variant="destructive" className="text-xs">{c.autoSubmitted} auto-submitted</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search student or test..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <SearchableSelect value={filterClass} onValueChange={setFilterClass} options={classOptions} placeholder="All Classes" />
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold">No Violations Found</h3>
          <p className="text-muted-foreground mt-2">No integrity violations recorded.</p>
        </div>
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
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Count</TableHead>
                  <TableHead className="text-center">Auto-Submit</TableHead>
                  <TableHead>Last Violation</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(({ v, student, test }) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{student!.name}</TableCell>
                    <TableCell>{student!.class} {student!.section}</TableCell>
                    <TableCell className="text-sm">{test!.title}</TableCell>
                    <TableCell className="text-sm">{test!.subject}</TableCell>
                    <TableCell className="text-sm capitalize">{v.type.replace(/-/g, " ")}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-lg ${v.count >= 3 ? "text-red-600" : v.count === 2 ? "text-yellow-600" : "text-orange-500"}`}>
                        {v.count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={v.autoSubmitted ? "destructive" : "outline"}>
                        {v.autoSubmitted ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.lastViolationAt ? new Date(v.lastViolationAt).toLocaleString("en-IN") : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        v.count === 0 ? "bg-green-100 text-green-800"
                        : v.count === 1 ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                      }`}>
                        {v.count === 0 ? "Clean" : v.count === 1 ? "Warning" : "Flagged"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
