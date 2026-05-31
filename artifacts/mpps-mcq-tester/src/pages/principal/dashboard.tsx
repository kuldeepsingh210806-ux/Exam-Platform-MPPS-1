import { useEffect, useState } from "react";
import { listenTests, listenStudents, listenAttempts, Test, StudentProfile, Attempt } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, ClipboardList, BarChart2, Award } from "lucide-react";

export default function PrincipalDashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => { const u = listenTests(setTests); return u; }, []);
  useEffect(() => { const u = listenStudents(setStudents); return u; }, []);
  useEffect(() => { const u = listenAttempts(setAttempts); return u; }, []);

  const submitted = attempts.filter(a=>a.submitted);
  const avg = submitted.length > 0 ? submitted.reduce((s,a)=>s+(a.percentage??0),0)/submitted.length : 0;
  const passRate = submitted.length > 0 ? (submitted.filter(a=>(a.percentage??0)>=40).length/submitted.length)*100 : 0;

  const classSummary = Object.entries(
    students.reduce<Record<string,{count:number,total:number,n:number}>>((acc,s)=>{
      const subs = submitted.filter(a=>a.studentId===s.uid);
      if (!acc[s.class]) acc[s.class]={count:0,total:0,n:0};
      acc[s.class].count += 1;
      subs.forEach(a=>{acc[s.class].total+=(a.percentage??0);acc[s.class].n++;});
      return acc;
    },{})
  ).map(([cls,d])=>({ class: cls, students: d.count, avgScore: d.n>0?parseFloat((d.total/d.n).toFixed(1)):0 }))
   .sort((a,b)=>a.class.localeCompare(b.class));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Principal Dashboard</h2>
        <p className="text-muted-foreground">School-wide overview — MP Public School, Mathuranagar</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label:"Total Students", value: students.length, icon: Users, color:"text-primary" },
          { label:"Total Tests", value: tests.length, icon: ClipboardList, color:"text-blue-500" },
          { label:"Total Submissions", value: submitted.length, icon: BarChart2, color:"text-green-600" },
          { label:"Overall Avg", value: `${avg.toFixed(1)}%`, icon: Award, color:"text-accent" },
        ].map(({label,value,icon:Icon,color})=>(
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
          </Card>
        ))}
      </div>
      {classSummary.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Average Score by Class</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classSummary} margin={{top:5,right:20,left:0,bottom:60}}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" angle={-35} textAnchor="end" interval={0} tick={{fontSize:11}} />
                <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} />
                <Tooltip formatter={(v:number)=>[`${v}%`,"Avg Score"]} />
                <Bar dataKey="avgScore" fill="#1e40af" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {[["Pass Rate", `${passRate.toFixed(1)}%`, passRate>=50?"text-green-600":"text-red-600"],
          ["Published Tests", String(tests.filter(t=>t.published).length), "text-foreground"],
          ["Class Groups", String(classSummary.length), "text-foreground"]].map(([label,value,color])=>(
          <Card key={label}>
            <CardContent className="pt-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
