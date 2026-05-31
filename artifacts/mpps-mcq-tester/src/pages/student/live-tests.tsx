import { useLocation } from "wouter";
import { getTests, getSession, getStudents, getSubmissions } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LiveTestsList() {
  const [, navigate] = useLocation();
  const session = getSession();
  const student = getStudents().find(s => s.id === session?.studentId);
  const tests = getTests();
  const submissions = getSubmissions().filter(s => s.studentId === student?.id);

  const now = new Date();
  
  const liveTests = tests.filter(t => 
    t.targetClass === student?.class && 
    new Date(t.scheduledAt) <= now && 
    new Date(t.endsAt) >= now
  );

  if (!liveTests.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">No Live Tests</h3>
        <p className="text-muted-foreground max-w-md mt-2">
          There are no tests currently active for your class. Check the Upcoming Tests tab to see what's scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Live Tests</h2>
        <p className="text-muted-foreground">Tests that are currently active and available to take.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {liveTests.map(test => {
          const isSubmitted = submissions.some(s => s.testId === test.id);
          const timeRemainingMs = new Date(test.endsAt).getTime() - now.getTime();
          const minutesRemaining = Math.max(0, Math.floor(timeRemainingMs / 60000));

          return (
            <Card key={test.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{test.title}</CardTitle>
                <div className="text-sm text-muted-foreground flex items-center mt-1">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {test.subject}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Marks:</span>
                    <span className="font-medium">{test.totalMarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions:</span>
                    <span className="font-medium">{test.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ends In:</span>
                    <span className="font-medium text-accent">{minutesRemaining} mins</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {isSubmitted ? (
                  <Alert className="w-full bg-muted border-none p-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-sm font-semibold mb-0 text-green-700">Already Submitted</AlertTitle>
                  </Alert>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/student/live-tests/${test.id}`)}
                  >
                    Start Test
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
