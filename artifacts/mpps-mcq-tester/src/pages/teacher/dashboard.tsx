import { getStudents, getTests, getSubmissions } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, ClipboardList, BarChart2, PlusCircle, Activity } from "lucide-react";

export default function TeacherDashboard() {
  const students = getStudents();
  const tests = getTests();
  const submissions = getSubmissions();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const testsToday = tests.filter((t) => new Date(t.scheduledAt) >= today).length;

  const recentSubmissions = submissions
    .slice()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h2>
        <p className="text-muted-foreground">Welcome back. Here is a summary of school activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <ClipboardList className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <BarChart2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active / Upcoming</CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testsToday}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/teacher/create-test">
          <Button className="w-full" size="lg">
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Test
          </Button>
        </Link>
        <Link href="/teacher/students">
          <Button variant="secondary" className="w-full" size="lg">
            <Users className="w-5 h-5 mr-2" /> Manage Students
          </Button>
        </Link>
        <Link href="/teacher/results">
          <Button variant="outline" className="w-full" size="lg">
            <BarChart2 className="w-5 h-5 mr-2" /> View All Results
          </Button>
        </Link>
      </div>

      {recentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSubmissions.map((sub) => {
                  const student = students.find((s) => s.id === sub.studentId);
                  const test = tests.find((t) => t.id === sub.testId);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{student?.name ?? "Unknown"}</TableCell>
                      <TableCell>{test?.title ?? "Unknown"}</TableCell>
                      <TableCell>{sub.score}/{sub.totalMarks} ({sub.percentage.toFixed(1)}%)</TableCell>
                      <TableCell>{new Date(sub.submittedAt).toLocaleDateString("en-IN")}</TableCell>
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
