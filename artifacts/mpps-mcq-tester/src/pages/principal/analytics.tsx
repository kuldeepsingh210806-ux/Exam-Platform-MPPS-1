import { getStudents, getTests, getSubmissions } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";

const CHART_COLORS = [
  "hsl(215 90% 35%)",
  "hsl(25 95% 55%)",
  "hsl(210 20% 70%)",
  "hsl(215 50% 65%)",
  "hsl(220 40% 45%)",
];

export default function SchoolAnalytics() {
  const students = getStudents();
  const tests = getTests();
  const submissions = getSubmissions();

  const classes = [...new Set(students.map((s) => s.class))].sort();
  const classAvgData = classes.map((cls) => {
    const classStudents = students.filter((s) => s.class === cls);
    const classSubmissions = submissions.filter((sub) =>
      classStudents.some((s) => s.id === sub.studentId)
    );
    const avg =
      classSubmissions.length > 0
        ? classSubmissions.reduce((a, s) => a + s.percentage, 0) / classSubmissions.length
        : 0;
    return { class: cls, average: parseFloat(avg.toFixed(1)) };
  });

  const passCount = submissions.filter((s) => s.percentage >= 40).length;
  const failCount = submissions.length - passCount;
  const passPieData = [
    { name: "Pass", value: passCount },
    { name: "Fail", value: failCount },
  ];

  const subjects = [...new Set(tests.map((t) => t.subject))];
  const subjectData = subjects.map((sub) => {
    const subTests = tests.filter((t) => t.subject === sub);
    return { subject: sub, tests: subTests.length };
  });

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    const count = submissions.filter((s) => {
      const sd = new Date(s.submittedAt);
      return sd.toDateString() === d.toDateString();
    }).length;
    return { date: label, submissions: count };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">School Analytics</h2>
        <p className="text-muted-foreground">School-wide performance data and trends.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Score by Class</CardTitle>
          </CardHeader>
          <CardContent>
            {classAvgData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No class data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={classAvgData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="class" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, "Average"]} />
                  <Bar dataKey="average" fill="hsl(215 90% 35%)" radius={[4, 4, 0, 0]} name="Average %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pass vs Fail Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No submissions yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={passPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {passPieData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tests Per Subject</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No tests created yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="subject" type="category" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="tests" fill="hsl(25 95% 55%)" radius={[0, 4, 4, 0]} name="Tests" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submissions Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke="hsl(215 90% 35%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(215 90% 35%)", r: 4 }}
                  name="Submissions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
