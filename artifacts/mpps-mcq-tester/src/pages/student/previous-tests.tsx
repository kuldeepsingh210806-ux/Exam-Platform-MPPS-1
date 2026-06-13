import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { listenTestsByClass, getAttemptsByStudent, Attempt, Test } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, BookOpen, TimerOff } from "lucide-react";

export default function PreviousTests() {
  const [, navigate] = useLocation();
  const { user, studentProfile } = useAuth();
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    if (!studentProfile) return;
    console.log(`[MPPS] PreviousTests: subscribing to all published tests for class="${studentProfile.class}"`);
    const unsub = listenTestsByClass(studentProfile.class, (incoming) => {
      console.log(`[MPPS] PreviousTests: received ${incoming.length} test(s) from Firestore`);
      setAllTests(incoming);
    });
    return unsub;
  }, [studentProfile]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const fetched = await getAttemptsByStudent(user.uid);
      console.log(`[MPPS] PreviousTests: fetched ${fetched.length} attempt(s) for student`);
      setAttempts(fetched);
    })();
  }, [user]);

  const now = new Date();
  const endedTests = allTests
    .filter((t) => new Date(t.endsAt) < now)
    .sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime());

  const submittedAttempts = attempts.filter((a) => a.submitted);
  const attemptMap = new Map(submittedAttempts.map((a) => [a.testId, a]));

  console.log(`[MPPS] PreviousTests render: total=${allTests.length}, ended=${endedTests.length}, submitted attempts=${submittedAttempts.length}`);

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Previous Tests</h2>
        <p className="text-muted-foreground">All tests that have ended for your class.</p>
      </div>
      {endedTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Previous Tests</h3>
          <p className="text-muted-foreground mt-2">Ended tests will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {endedTests.map((test) => {
            const attempt = attemptMap.get(test.id);
            const isPass = attempt ? (attempt.percentage ?? 0) >= 40 : false;

            return (
              <Card
                key={test.id}
                className={`border-l-4 ${attempt ? "border-l-muted-foreground" : "border-l-slate-300"}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    {attempt ? (
                      <Badge
                        className={isPass ? "bg-green-600" : ""}
                        variant={isPass ? "default" : "destructive"}
                      >
                        {isPass ? "Pass" : "Fail"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <TimerOff className="w-3 h-3 mr-1" />Not Attempted
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{test.subject} · {test.targetClass}</p>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {attempt ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        <span className="font-semibold text-foreground">
                          {attempt.score}/{attempt.totalMarks} ({attempt.percentage?.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(attempt.timeTaken ?? 0)}</span>
                      </div>
                      <p>Submitted: {new Date(attempt.submittedAt!).toLocaleDateString("en-IN")}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <TimerOff className="w-3.5 h-3.5" />
                        <span>Ended: {new Date(test.endsAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      <div>{test.questions.length} questions · {test.totalMarks} marks</div>
                    </>
                  )}
                </CardContent>
                {attempt && (
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/student/review/${test.id}`)}
                    >
                      Review Answers
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
