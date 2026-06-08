import { useEffect, useState } from "react";
import { listenTests, listenStudents, listenAttempts, getAllViolations, Test, StudentProfile, Attempt, Violation } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, FileText } from "lucide-react";

function getGrade(p:number){if(p>=90)return"A+";if(p>=75)return"A";if(p>=60)return"B";if(p>=40)return"C";return"F";}

export default function TeacherReports() {
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [generated, setGenerated] = useState(false);

  useEffect(() => { const u = listenTests(setTests); return u; }, []);
  useEffect(() => { const u = listenStudents(setStudents); return u; }, []);
  useEffect(() => { const u = listenAttempts(setAttempts); return u; }, []);
  useEffect(() => { getAllViolations().then(setViolations); }, []);

  const test = tests.find(t=>t.id===selectedTestId);
  const testAttempts = attempts
    .filter(a=>a.testId===selectedTestId && a.submitted)
    .map(a=>({a, student:students.find(s=>s.uid===a.studentId)}))
    .filter(r=>r.student)
    .sort((x,y)=>(y.a.percentage??0)-(x.a.percentage??0));

  const avg = testAttempts.length>0 ? testAttempts.reduce((s,r)=>s+(r.a.percentage??0),0)/testAttempts.length : 0;
  const passCount = testAttempts.filter(r=>(r.a.percentage??0)>=40).length;

  const testOptions = tests.map(t => ({ value: t.id, label: t.title }));

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight">Generate PDF Reports</h2>
        <p className="text-muted-foreground">Select a test to generate a printable report.</p>
      </div>
      <div className="print:hidden space-y-4">
        <div className="space-y-1 max-w-sm"><Label>Select Test</Label>
          <SearchableSelect
            value={selectedTestId}
            onValueChange={v=>{setSelectedTestId(v);setGenerated(false);}}
            options={testOptions}
            placeholder="Choose a test..."
          />
        </div>
        <Button onClick={()=>setGenerated(true)} disabled={!selectedTestId}><FileText className="w-4 h-4 mr-2" />Generate Report</Button>
      </div>
      {generated && test && (
        <div className="space-y-6">
          <div className="flex justify-end print:hidden">
            <Button onClick={()=>window.print()} variant="outline"><Printer className="w-4 h-4 mr-2" />Print / Save as PDF</Button>
          </div>
          <div className="space-y-6">
            <div className="text-center border-b pb-6">
              <h1 className="text-2xl font-bold">MP Public School, Mathuranagar</h1>
              <p className="text-muted-foreground">MPPS MCQ Tester — Test Performance Report</p>
              <p className="text-sm text-muted-foreground mt-1">Generated: {new Date().toLocaleDateString("en-IN",{year:"numeric",month:"long",day:"numeric"})}</p>
            </div>
            <Card><CardHeader><CardTitle>Test Details</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
                {[["Test Name",test.title],["Subject",test.subject],["Class",test.targetClass],["Duration",`${test.duration} min`],
                  ["Total Marks",String(test.totalMarks)],["Start",new Date(test.scheduledAt).toLocaleString("en-IN")],
                  ["Submissions",String(testAttempts.length)],["Pass Rate",testAttempts.length>0?`${((passCount/testAttempts.length)*100).toFixed(1)}%`:"N/A"]].map(([l,v])=>(
                  <div key={l} className="flex justify-between border-b pb-2"><span className="text-muted-foreground">{l}</span><span className="font-semibold">{v}</span></div>
                ))}
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-4 gap-4">
              {[["Class Average",`${avg.toFixed(1)}%`],["Highest",testAttempts.length>0?`${Math.max(...testAttempts.map(r=>r.a.percentage??0)).toFixed(1)}%`:"—"],
                ["Lowest",testAttempts.length>0?`${Math.min(...testAttempts.map(r=>r.a.percentage??0)).toFixed(1)}%`:"—"],
                ["Pass/Fail",`${passCount}/${testAttempts.length-passCount}`]].map(([l,v])=>(
                <div key={l} className="border rounded-lg p-4 text-center"><div className="text-2xl font-bold">{v}</div><div className="text-xs text-muted-foreground mt-1">{l}</div></div>
              ))}
            </div>
            {testAttempts.length > 0 && (
              <Card><CardHeader><CardTitle>Student Results (Ranked)</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Student</TableHead><TableHead>Roll No.</TableHead>
                      <TableHead className="text-right">Score</TableHead><TableHead className="text-right">%</TableHead>
                      <TableHead className="text-center">Grade</TableHead><TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Violations</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {testAttempts.map(({a,student},idx)=>{
                        const pct=a.percentage??0;
                        const viol=violations.find(v=>v.studentId===a.studentId&&v.testId===a.testId);
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-bold">#{idx+1}</TableCell>
                            <TableCell className="font-medium">{student!.name}</TableCell>
                            <TableCell className="font-mono text-sm">{student!.rollNumber}</TableCell>
                            <TableCell className="text-right">{a.score}/{a.totalMarks}</TableCell>
                            <TableCell className="text-right font-medium">{pct.toFixed(1)}%</TableCell>
                            <TableCell className="text-center"><span className={`text-xs font-bold px-2 py-0.5 rounded ${pct>=75?"bg-green-100 text-green-800":pct>=40?"bg-yellow-100 text-yellow-800":"bg-red-100 text-red-800"}`}>{getGrade(pct)}</span></TableCell>
                            <TableCell className="text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${pct>=40?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`}>{pct>=40?"Pass":"Fail"}</span></TableCell>
                            <TableCell className="text-center"><span className={`text-xs font-semibold ${(viol?.count??0)>0?"text-red-600":"text-muted-foreground"}`}>{viol?.count??0}{viol?.autoSubmitted?" 🚨":""}</span></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
