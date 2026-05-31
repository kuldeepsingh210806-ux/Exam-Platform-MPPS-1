import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listenTestsByClass, Test } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, BookOpen } from "lucide-react";

export default function UpcomingTests() {
  const { studentProfile } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);

  useEffect(() => {
    if (!studentProfile) return;
    const unsub = listenTestsByClass(studentProfile.class, (all) => {
      const now = new Date();
      setTests(all.filter((t) => new Date(t.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
    });
    return unsub;
  }, [studentProfile]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upcoming Tests</h2>
        <p className="text-muted-foreground">Tests scheduled for your class.</p>
      </div>
      {tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Upcoming Tests</h3>
          <p className="text-muted-foreground mt-2">Check back later for scheduled tests.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((t) => (
            <Card key={t.id} className="border-l-4 border-l-blue-400">
              <CardHeader>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{t.subject} · {t.targetClass}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(t.scheduledAt).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t.duration} minutes · {t.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t.questions.length} questions</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
