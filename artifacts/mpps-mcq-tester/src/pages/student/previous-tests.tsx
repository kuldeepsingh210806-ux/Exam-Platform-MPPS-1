import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { getAttemptsByStudent, getAllTests, Attempt, Test } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, BookOpen } from "lucide-react";

export default function PreviousTests() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [results, setResults] = useState<{ attempt: Attempt; test: Test }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [attempts, allTests] = await Promise.all([getAttemptsByStudent(user.uid), getAllTests()]);
      const submitted = attempts
        .filter((a) => a.submitted)
        .map((a) => ({ attempt: a, test: allTests.find((t) => t.id === a.testId)! }))
        .filter((r) => r.test)
        .sort((a, b) => new Date(b.attempt.submittedAt!).getTime() - new Date(a.attempt.submittedAt!).getTime());
      setResults(submitted);
    })();
  }, [user]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Previous Tests</h2>
        <p className="text-muted-foreground">Tests you have already submitted.</p>
      </div>
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Previous Tests</h3>
          <p className="text-muted-foreground mt-2">Submitted tests will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map(({ attempt, test }) => {
            const isPass = (attempt.percentage ?? 0) >= 40;
            return (
              <Card key={attempt.id} className="border-l-4 border-l-muted-foreground">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <Badge className={isPass ? "bg-green-600" : ""} variant={isPass ? "default" : "destructive"}>
                      {isPass ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{test.subject}</p>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    <span className="font-semibold text-foreground">{attempt.score}/{attempt.totalMarks} ({attempt.percentage?.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(attempt.timeTaken ?? 0)}</span>
                  </div>
                  <p>{new Date(attempt.submittedAt!).toLocaleDateString("en-IN")}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/student/review/${test.id}`)}>
                    Review Answers
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
