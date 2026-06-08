import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { getAttemptByStudentAndTest, getAllTests, Attempt, Test } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function ReviewAnswers() {
  const [, params] = useRoute("/student/review/:testId");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const testId = params?.testId ?? "";
  const [test, setTest] = useState<Test | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    if (!user || !testId) return;
    (async () => {
      const [allTests, a] = await Promise.all([getAllTests(), getAttemptByStudentAndTest(user.uid, testId)]);
      setTest(allTests.find((t) => t.id === testId) ?? null);
      setAttempt(a);
    })();
  }, [user, testId]);

  if (!test || !attempt) return <div className="flex items-center justify-center py-16 text-muted-foreground">Loading...</div>;

  const correctCount = test.questions.filter((q) => attempt.answers[q.id] === q.correctAnswer).length;
  const fmt = (s: number) => `${Math.floor(s/60)}m ${s%60}s`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/student/previous")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Answer Review</h2>
          <p className="text-muted-foreground">{test.title} — {test.subject}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Score", `${attempt.score}/${attempt.totalMarks}`],
          ["Percentage", `${attempt.percentage?.toFixed(1)}%`],
          ["Correct", `${correctCount}/${test.questions.length}`],
          ["Time Taken", fmt(attempt.timeTaken ?? 0)],
        ].map(([label, value]) => (
          <Card key={label}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></CardContent></Card>
        ))}
      </div>
      <div className="space-y-4">
        {test.questions.map((q, idx) => {
          const ans = attempt.answers[q.id];
          const correct = ans === q.correctAnswer;
          return (
            <Card key={q.id} className={`border-l-4 ${correct ? "border-l-green-500" : !ans ? "border-l-yellow-400" : "border-l-red-500"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base font-medium">{idx + 1}. {q.question}</CardTitle>
                  {!ans ? <span className="text-xs text-yellow-700 font-semibold">Not answered</span>
                    : correct ? <div className="flex items-center gap-1 text-green-700 text-sm font-semibold"><CheckCircle2 className="w-4 h-4" />+{q.marks}</div>
                    : <div className="flex items-center gap-1 text-red-600 text-sm font-semibold"><XCircle className="w-4 h-4" />0</div>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(["A","B","C","D"] as const).map((opt) => {
                    const isCorrect = q.correctAnswer === opt;
                    const isChosen = ans === opt;
                    let cls = "flex items-center gap-3 p-3 rounded-lg border text-sm ";
                    if (isCorrect) cls += "bg-green-50 border-green-400 text-green-900 font-medium";
                    else if (isChosen && !correct) cls += "bg-red-50 border-red-400 text-red-900";
                    else cls += "bg-muted/30 border-border text-muted-foreground";
                    return (
                      <div key={opt} className={cls}>
                        <span className="font-bold w-5 text-center">{opt}</span>
                        <span className="flex-1">{q[`option${opt}`]}</span>
                        {isCorrect && <span className="text-green-700 text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Correct</span>}
                        {isChosen && !correct && <span className="text-red-600 text-xs font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" />Your answer</span>}
                        {isChosen && correct && <span className="text-green-700 text-xs font-semibold">Your answer</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
