import { useEffect, useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { getTests, getSession, getSubmissions, addSubmission, generateId } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TakeTest() {
  const [, params] = useRoute("/student/live-tests/:testId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const testId = params?.testId;
  const session = getSession();
  
  const test = getTests().find(t => t.id === testId);
  const existingSubmission = getSubmissions().find(s => s.testId === testId && s.studentId === session?.studentId);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!test || !session?.studentId || existingSubmission) {
      navigate("/student/live-tests");
      return;
    }

    const now = new Date().getTime();
    const endsAt = new Date(test.endsAt).getTime();
    const scheduledAt = new Date(test.scheduledAt).getTime();

    if (now < scheduledAt || now > endsAt) {
      toast({
        title: "Test Unavailable",
        description: "This test is not currently active.",
        variant: "destructive"
      });
      navigate("/student/live-tests");
      return;
    }

    const initialTime = Math.floor((endsAt - now) / 1000);
    setTimeRemaining(initialTime);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, session, existingSubmission, navigate, toast]);

  const handleSubmit = (currentAnswers: Record<string, "A" | "B" | "C" | "D"> = answers) => {
    if (!test || !session?.studentId) return;
    setIsSubmitting(true);

    let score = 0;
    test.questions.forEach(q => {
      if (currentAnswers[q.id] === q.correctAnswer) {
        score += q.marks;
      }
    });

    const percentage = (score / test.totalMarks) * 100;
    const timeTaken = test.duration * 60 - (timeRemaining || 0);

    const submission = {
      id: generateId(),
      studentId: session.studentId,
      testId: test.id,
      answers: currentAnswers,
      score,
      totalMarks: test.totalMarks,
      percentage,
      submittedAt: new Date().toISOString(),
      timeTaken
    };

    addSubmission(submission);

    toast({
      title: "Test Submitted Successfully",
      description: `You scored ${score} out of ${test.totalMarks}.`,
    });

    setTimeout(() => {
      navigate("/student/results");
    }, 1500);
  };

  if (!test || timeRemaining === null) return null;

  const currentQuestion = test.questions[currentQuestionIdx];
  const answeredCount = Object.keys(answers).length;
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="font-bold text-lg md:text-xl">{test.title}</h1>
          <p className="text-sm opacity-80">{test.subject}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary-foreground/10 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            <span className={`font-mono font-medium ${timeRemaining < 300 ? "text-red-300 animate-pulse" : ""}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have answered {answeredCount} out of {test.questions.length} questions.
                  Once submitted, you cannot change your answers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Test</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleSubmit()} className="bg-primary text-primary-foreground">
                  Confirm Submission
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Navigator */}
        <div className="w-64 bg-muted border-r overflow-y-auto hidden md:block">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-2">Question Navigator</h3>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Answered: {answeredCount}</span>
              <span>Unanswered: {test.questions.length - answeredCount}</span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-4 gap-2">
            {test.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`h-10 rounded-md font-medium text-sm flex items-center justify-center transition-colors
                  ${currentQuestionIdx === idx ? 'ring-2 ring-primary ring-offset-2 bg-background' : ''}
                  ${answers[q.id] ? 'bg-green-100 text-green-800 border-green-200 border' : 'bg-background border hover:bg-muted-foreground/10'}
                `}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Main Panel: Question */}
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Question {currentQuestionIdx + 1} of {test.questions.length}
              </span>
              <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
                Marks: {currentQuestion.marks}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>

            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(val: "A" | "B" | "C" | "D") => {
                setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
              }}
              className="space-y-4"
            >
              {[
                { val: "A", text: currentQuestion.optionA },
                { val: "B", text: currentQuestion.optionB },
                { val: "C", text: currentQuestion.optionC },
                { val: "D", text: currentQuestion.optionD }
              ].map(opt => (
                <div key={opt.val} className={`
                  flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors
                  ${answers[currentQuestion.id] === opt.val ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                `}>
                  <RadioGroupItem value={opt.val} id={`opt-${opt.val}`} />
                  <Label htmlFor={`opt-${opt.val}`} className="flex-1 cursor-pointer text-base leading-relaxed">
                    <span className="font-semibold mr-2">{opt.val})</span> {opt.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="mt-auto pt-8 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQuestionIdx(p => Math.max(0, p - 1))}
                disabled={currentQuestionIdx === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIdx < test.questions.length - 1 ? (
                <Button 
                  onClick={() => setCurrentQuestionIdx(p => Math.min(test.questions.length - 1, p + 1))}
                >
                  Next
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      Finish & Submit
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit your test?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You have answered {answeredCount} out of {test.questions.length} questions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Review Answers</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSubmit()} className="bg-primary">
                        Submit Now
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
