import { getTests, getSession, getStudents } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, BookOpen } from "lucide-react";

export default function UpcomingTests() {
  const session = getSession();
  const student = getStudents().find(s => s.id === session?.studentId);
  const tests = getTests();

  const now = new Date();
  
  const upcomingTests = tests.filter(t => 
    t.targetClass === student?.class && 
    new Date(t.scheduledAt) > now
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  if (!upcomingTests.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">No Upcoming Tests</h3>
        <p className="text-muted-foreground max-w-md mt-2">
          You don't have any tests scheduled in the future at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upcoming Tests</h2>
        <p className="text-muted-foreground">Tests scheduled for a future date.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {upcomingTests.map(test => {
          const scheduledDate = new Date(test.scheduledAt);
          
          return (
            <Card key={test.id} className="flex flex-col opacity-80">
              <CardHeader>
                <CardTitle>{test.title}</CardTitle>
                <div className="text-sm text-muted-foreground flex items-center mt-1">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {test.subject}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{scheduledDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{test.duration} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Marks:</span>
                    <span className="font-medium">{test.totalMarks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
