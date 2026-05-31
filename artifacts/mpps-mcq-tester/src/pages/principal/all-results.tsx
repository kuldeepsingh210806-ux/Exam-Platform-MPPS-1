import { useEffect, useState } from "react";
import { listenTests, listenStudents, listenAttempts, Test, StudentProfile, Attempt } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function getGrade(p:number){if(p>=90)return"A+";if(p>=75)return"A";if(p>=60)return"B";if(p>=40)return"C";return"F";}

export default function AllResults() {
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [filterClass, setFilterClass] = useState("all");
  const [filterTest, setFilterTest] = useState("all");

  useEffect(() => { const u = listenTests(setTests); return u; }, []);
  useEffect(() => { const u = listenStudents(setStudents); return u; }, []);
  useEffect(() => { const u = listenAttempts(setAttempts); return u; }, []);

  const classes = ["all", ...new Set(students.map(s=>s.class))].sort((a,b)=>a==="all"?-1:a.localeCompare(b));

  const rows = attempts
    .filter(a=>a.submitted)
    .map(a=>({ a, student: students.find(s=>s.uid===a.studentId), test: tests.find(t=>t.id===a.testId) }))
    .filter(r=>r.student&&r.test)
    .filter(r=>filterClass==="all"||r.student!.class===filterClass)
    .filter(r=>filterTest==="all"||r.test!.id===filterTest)
    .sort((x,y)=>new Date(y.a.submittedAt!).getTime()-new Date(x.a.submittedAt!).getTime());

  const scoreDistribution = [
    { range:"0-39%", count: rows.filter(r=>(r.a.percentage??0)<40).length },
    { range:"40-59%", count: rows.filter(r=>{const p=r.a.percentage??0;return p>=40&&p<60;}).length },
    { range:"60-74%", count: rows.filter(r=>{const p=r.a.percentage??0;return p>=60&&p<75;}).length },
    { range:"75-89%", count: rows.filter(r=>{const p=r.a.percentage??0;return p>=75&&p<90;}).length },
    { range:"90-100%", count: rows.filter(r=>(r.a.percentage??0)>=90).length },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold tracking-tight">All Results</h2>
        <p className="text-muted-foreground">Complete result view across all classes and tests.</p></div>
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1 min-w-[180px]"><Label>Filter by Class</Label>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{classes.map(c=><SelectItem key={c} value={c}>{c==="all"?"All Classes":c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 min-w-[220px]"><Label>Filter by Test</Label>
          <Select value={filterTest} onValueChange={setFilterTest}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Tests</SelectItem>{tests.map(t=><SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {rows.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{fontSize:12}} />
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
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Test</TableHead>
              <TableHead>Date</TableHead><TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead className="text-center">Grade</TableHead><TableHead className="text-center">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map(({a,student,test})=>{
                const pct=a.percentage??0;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{student!.name}</TableCell>
                    <TableCell>{student!.class} {student!.section}</TableCell>
                    <TableCell>{test!.title}</TableCell>
                    <TableCell className="text-sm">{new Date(a.submittedAt!).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-right">{a.score}/{a.totalMarks}</TableCell>
                    <TableCell className="text-right font-medium">{pct.toFixed(1)}%</TableCell>
                    <TableCell className="text-center"><span className={`text-xs font-bold px-2 py-0.5 rounded ${pct>=75?"bg-green-100 text-green-800":pct>=40?"bg-yellow-100 text-yellow-800":"bg-red-100 text-red-800"}`}>{getGrade(pct)}</span></TableCell>
                    <TableCell className="text-center"><Badge className={pct>=40?"bg-green-600":""} variant={pct>=40?"default":"destructive"}>{pct>=40?"Pass":"Fail"}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </div>
  );
}
