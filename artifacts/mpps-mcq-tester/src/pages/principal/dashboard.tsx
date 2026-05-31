import { getStudents, getTests, getSubmissions, getNotices } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, ClipboardList, BarChart2, Megaphone, TrendingUp, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function PrincipalDashboard() {
  const students = getStudents();
  const tests = getTests();
  const submissions = getSubmissions();
  const notices = getNotices();

  const avg =
    submissions.length > 0
      ? submissions.reduce((a, s) => a + s.percentage, 0) / submissions.length
      : 0;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const count = submissions.filter((s) => {
      const sd = new Date(s.submittedAt);
      return sd.toDateString() === d.toDateString();
    }).length;
    return { day: label, count };
  });

  const recentNotices = notices
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Principal Dashboard</h2>
        <p className="text-muted-foreground">School-wide overview for MP Public School, Mathuranagar.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Students", value: students.length, icon: Users, color: "text-primary" },
          { label: "Total Tests", value: tests.length, icon: ClipboardList, color: "text-accent" },
          { label: "Total Submissions", value: submissions.length, icon: BarChart2, color: "text-green-600" },
          { label: "School Average", value: `${avg.toFixed(1)}%`, icon: TrendingUp, color: "text-blue-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submissions This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(215 90% 35%)" radius={[4, 4, 0, 0]} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Notices</CardTitle>
            <Link href="/principal/notices">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No notices yet. Post your first notice.</p>
            ) : (
              recentNotices.map((n) => (
                <div key={n.id} className="border-l-4 border-l-accent pl-3 py-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{n.targetAudience}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString("en-IN")} — {n.author}
                  </p>
                </div>
              ))
            )}
            <Link href="/principal/notices">
              <Button className="w-full mt-2" size="sm" variant="outline">
                <Megaphone className="w-4 h-4 mr-2" /> Post New Notice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
