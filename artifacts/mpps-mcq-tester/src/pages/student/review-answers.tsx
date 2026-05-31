import { useRoute, useLocation } from "wouter";
import { getTests, getSession, getSubmissions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Trophy } from "lucide-react";

export default function ReviewAnswers() {
  const [, params] = useRoute("/student/review/:testId");
  const [, navigate] = useLocation();
  const testId = params?.testId;

  const session = getSession();
  const test = getTests().find((t) => t.id === testId);
  const submission = getSubmissions().find(
    (s) => s.testId === testId && s.studentId === session?.studentId
  );

  if (!test || !submission) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-xl font-semibold">Result Not Found</h3>
        <p className="text-muted-foreground mt-2">
          No submission found for this test.
        </p>
        <Button className="mt-4" onClick={() => navigate("/student/previous")}>
          Back to Previous Tests
        </Button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const correctCount = test.questions.filter(
    (q) => submission.answers[q.id] === q.correctAnswer
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/student/previous")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Answer Review</h2>
          <p className="text-muted-foreground">{test.title} — {test.subject}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Score</div>
            <div className="text-2xl font-bold mt-1">{submission.score} / {submission.totalMarks}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Percentage</div>
            <div className="text-2xl font-bold mt-1">{submission.percentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Correct</div>
            <div className="text-2xl font-bold mt-1 text-green-700">{correctCount} / {test.questions.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Time Taken</div>
            <div className="text-2xl font-bold mt-1">{formatTime(submission.timeTaken)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {test.questions.map((q, idx) => {
          const studentAnswer = submission.answers[q.id];
          const isCorrect = studentAnswer === q.correctAnswer;
          const isUnanswered = !studentAnswer;

          return (
            <Card key={q.id} className={`border-l-4 ${isCorrect ? "border-l-green-500" : isUnanswered ? "border-l-yellow-400" : "border-l-red-500"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <CardTitle className="text-base font-medium leading-relaxed">
                      {q.question}
                    </CardTitle>
                  </div>
                  <div className="flex-shrink-0">
                    {isUnanswered ? (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                        Not Answered
                      </Badge>
                    ) : isCorrect ? (
                      <div className="flex items-center gap-1 text-green-700 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>+{q.marks} marks</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600 font-semibold text-sm">
                        <XCircle className="w-4 h-4" />
                        <span>0 marks</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const optText = q[`option${opt}`];
                    const isStudentChoice = studentAnswer === opt;
                    const isCorrectAnswer = q.correctAnswer === opt;

                    let cls = "flex items-center gap-3 p-3 rounded-lg border text-sm ";
                    if (isCorrectAnswer) {
                      cls += "bg-green-50 border-green-400 text-green-900 font-medium";
                    } else if (isStudentChoice && !isCorrect) {
                      cls += "bg-red-50 border-red-400 text-red-900";
                    } else {
                      cls += "bg-muted/30 border-border text-muted-foreground";
                    }

                    return (
                      <div key={opt} className={cls}>
                        <span className="font-bold w-5 text-center">{opt}</span>
                        <span className="flex-1">{optText}</span>
                        {isCorrectAnswer && (
                          <span className="text-green-700 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Correct
                          </span>
                        )}
                        {isStudentChoice && !isCorrect && (
                          <span className="text-red-600 text-xs font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Your Answer
                          </span>
                        )}
                        {isStudentChoice && isCorrect && (
                          <span className="text-green-700 text-xs font-semibold">Your Answer</span>
                        )}
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
