import { useState } from "react";
import { getStudents, getSubmissions } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Trophy } from "lucide-react";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function ClassRankings() {
  const students = getStudents();
  const submissions = getSubmissions();
  const classes = [...new Set(students.map((s) => s.class))].sort();
  const [filterClass, setFilterClass] = useState("all");

  const ranked = students
    .filter((s) => filterClass === "all" || s.class === filterClass)
    .map((s) => {
      const subs = submissions.filter((sub) => sub.studentId === s.id);
      const avg = subs.length > 0
        ? subs.reduce((a, sub) => a + sub.percentage, 0) / subs.length : 0;
      const best = subs.length > 0 ? Math.max(...subs.map((sub) => sub.percentage)) : 0;
      return { student: s, testsTaken: subs.length, avgPct: avg, bestScore: best };
    })
    .filter((r) => r.testsTaken > 0)
    .sort((a, b) => b.avgPct - a.avgPct);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Class Rankings</h2>
        <p className="text-muted-foreground">Students ranked by average score across all completed tests.</p>
      </div>

      <div className="space-y-1 max-w-xs">
        <Label>Filter by Class</Label>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {ranked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Rankings Yet</h3>
          <p className="text-muted-foreground mt-2">
            Rankings appear once students complete at least one test.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Tests Taken</TableHead>
                  <TableHead className="text-right">Average %</TableHead>
                  <TableHead className="text-right">Best Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((r, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <TableRow key={r.student.id}
                      className={isTop3 ? idx === 0 ? "bg-yellow-50" : idx === 1 ? "bg-gray-50" : "bg-orange-50" : ""}>
                      <TableCell className="font-bold text-center text-lg">
                        {idx < 3 ? MEDAL[idx] : `#${idx + 1}`}
                      </TableCell>
                      <TableCell className={`font-medium ${isTop3 ? "font-semibold" : ""}`}>
                        {r.student.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{r.student.rollNumber}</TableCell>
                      <TableCell>{r.student.class}</TableCell>
                      <TableCell>{r.student.section}</TableCell>
                      <TableCell className="text-right">{r.testsTaken}</TableCell>
                      <TableCell className="text-right font-semibold">{r.avgPct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{r.bestScore.toFixed(1)}%</TableCell>
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
