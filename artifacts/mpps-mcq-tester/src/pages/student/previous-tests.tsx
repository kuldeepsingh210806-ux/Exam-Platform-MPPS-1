import { getTests, getSession, getSubmissions } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, BookOpen, Clock } from "lucide-react";

export default function PreviousTests() {
  const [, navigate] = useLocation();
  const session = getSession();
  const tests = getTests();
  const submissions = getSubmissions().filter(s => s.studentId === session?.studentId);

  const completedTests = submissions.map(sub => {
    const test = tests.find(t => t.id === sub.testId);
    return { sub, test };
  }).filter(item => item.test !== undefined).sort((a, b) => 
    new Date(b.sub.submittedAt).getTime() - new Date(a.sub.submittedAt).getTime()
  );

  if (!completedTests.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">No Tests Completed</h3>
        <p className="text-muted-foreground max-w-md mt-2">
          You haven't completed any tests yet. Once you submit a test, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Previous Tests</h2>
        <p className="text-muted-foreground">Review the tests you have already completed.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {completedTests.map(({ sub, test }) => {
          if (!test) return null;
          const isPass = sub.percentage >= 40;
          const submittedDate = new Date(sub.submittedAt);

          return (
            <Card key={sub.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {test.subject}
                    </div>
                  </div>
                  {isPass ? (
                    <span className="flex items-center text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3 mr-1" /> Pass
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded">
                      <XCircle className="w-3 h-3 mr-1" /> Fail
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-semibold text-base">{sub.score} / {sub.totalMarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentage:</span>
                    <span className="font-medium">{sub.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center text-muted-foreground pt-2 mt-2 border-t text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Submitted: {submittedDate.toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate(`/student/review/${test.id}`)}
                >
                  Review Answers
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
