import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  getAttemptByStudentAndTest, saveAttempt, updateAttemptAnswers,
  submitAttempt, upsertViolation, generateId, Attempt,
} from "@/lib/firestore";
import { listenTestsByClass, Test } from "@/lib/firestore";
import { getAllTests } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export default function TakeTest() {
  const [, params] = useRoute("/student/take/:testId");
  const [, navigate] = useLocation();
  const { user, studentProfile } = useAuth();
  const { toast } = useToast();
  const testId = params?.testId ?? "";

  const [test, setTest] = useState<Test | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const startTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load test & attempt
  useEffect(() => {
    if (!user || !testId) return;
    (async () => {
      const allTests = await getAllTests();
      const t = allTests.find((x) => x.id === testId) ?? null;
      setTest(t);
      if (!t) { setLoading(false); return; }

      let a = await getAttemptByStudentAndTest(user.uid, testId);
      if (!a) {
        a = {
          id: generateId(), testId, studentId: user.uid,
          answers: {}, currentQuestion: 0,
          startedAt: new Date().toISOString(),
          submitted: false, violations: 0,
        };
        await saveAttempt(a);
      }
      if (a.submitted) { setSubmitted(true); setLoading(false); return; }
      setAttempt(a);
      setAnswers(a.answers);
      setCurrentQ(a.currentQuestion);
      const elapsed = (Date.now() - new Date(a.startedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, t.duration * 60 - elapsed));
      startTime.current = new Date(a.startedAt).getTime();
      setLoading(false);
    })();
  }, [user, testId]);

  // Timer
  useEffect(() => {
    if (!test || submitted || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [test, submitted, loading]);

  // Autosave every 10s
  useEffect(() => {
    if (!attempt || submitted) return;
    autosaveRef.current = setInterval(() => {
      updateAttemptAnswers(attempt.id, answers, currentQ);
    }, 10000);
    return () => clearInterval(autosaveRef.current!);
  }, [attempt, answers, currentQ, submitted]);

  // Anti-cheat: visibility change
  useEffect(() => {
    if (submitted) return;
    const handleVis = async () => {
      if (document.hidden && user && testId) {
        const count = await upsertViolation(user.uid, testId, "tab-switch");
        setViolations(count);
        if (count >= 3) {
          toast({ title: "Auto-submitted due to repeated violations.", variant: "destructive" });
          handleSubmit(true);
        } else if (count === 2) {
          setWarning("⚠️ Final Warning! One more violation will auto-submit your test.");
          toast({ title: "Final Warning!", description: "Stay on the test page.", variant: "destructive" });
        } else {
          setWarning("⚠️ Warning: Do not switch tabs during the test.");
          toast({ title: "Warning", description: "Tab switch detected.", variant: "destructive" });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, [submitted, user, testId]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (!attempt || !test || submitted) return;
    setSubmitted(true);
    clearInterval(timerRef.current!);
    clearInterval(autosaveRef.current!);

    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
    let score = 0;
    test.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) score += q.marks;
    });
    const pct = test.totalMarks > 0 ? (score / test.totalMarks) * 100 : 0;

    await submitAttempt(attempt.id, {
      score, totalMarks: test.totalMarks,
      percentage: parseFloat(pct.toFixed(2)),
      timeTaken, submittedAt: new Date().toISOString(),
    });

    toast({ title: auto ? "Test auto-submitted." : "Test submitted!", description: `Score: ${score}/${test.totalMarks}` });
    navigate("/student/results");
  }, [attempt, test, answers, submitted]);

  const selectAnswer = (qId: string, opt: string) => {
    const updated = { ...answers, [qId]: opt };
    setAnswers(updated);
    if (attempt) updateAttemptAnswers(attempt.id, updated, currentQ);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading test...</div>;
  if (!test) return <div className="flex items-center justify-center min-h-screen text-destructive">Test not found.</div>;
  if (submitted) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-4">
      <CheckCircle2 className="w-16 h-16 text-green-600" />
      <h2 className="text-2xl font-bold">Test Submitted!</h2>
      <Button onClick={() => navigate("/student/results")}>View Results</Button>
    </div>
  );

  const q = test.questions[currentQ];

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-3 flex items-center justify-between border-b-4 border-accent">
        <div>
          <h1 className="font-bold text-lg">{test.title}</h1>
          <p className="text-xs text-primary-foreground/70">{studentProfile?.name} · {test.questions.length} questions</p>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-lg
          ${timeLeft < 120 ? "bg-red-600 animate-pulse" : "bg-white/20"}`}>
          <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
        </div>
      </div>

      {warning && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-6 py-2 flex items-center gap-2 text-yellow-800 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" /> {warning}
          <button className="ml-auto text-yellow-600 underline text-xs" onClick={() => setWarning(null)}>Dismiss</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Question Navigator */}
        <div className="w-48 border-r bg-muted/30 p-3 overflow-y-auto hidden md:block">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Questions</p>
          <div className="grid grid-cols-5 gap-1">
            {test.questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors
                  ${i === currentQ ? "bg-primary text-white" :
                  answers[test.questions[i].id] ? "bg-green-500 text-white" : "bg-white border text-muted-foreground hover:bg-muted"}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Answered</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border inline-block" /> Not answered</div>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Question {currentQ + 1} of {test.questions.length}
              </span>
              <span className="text-sm font-medium">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
            </div>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <p className="text-lg font-medium leading-relaxed">{q.question}</p>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {(["A","B","C","D"] as const).map((opt) => {
                const text = q[`option${opt}`];
                const selected = answers[q.id] === opt;
                return (
                  <button key={opt} onClick={() => selectAnswer(q.id, opt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex items-center gap-3
                      ${selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{opt}</span>
                    {text}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-8">
              <Button variant="outline" onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0}>
                ← Previous
              </Button>
              {currentQ < test.questions.length - 1 ? (
                <Button onClick={() => setCurrentQ((p) => p + 1)}>Next →</Button>
              ) : (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleSubmit(false)}>
                  Submit Test
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
