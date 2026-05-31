import { useState } from "react";
import { useLocation } from "wouter";
import { addTest, generateId, MCQQuestion, Test } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Trash2, PlusCircle, CheckCircle2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const CLASSES = ["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];
const STEPS = ["Test Details", "Add Questions", "Review & Publish"];

type QuestionForm = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  marks: number;
};

const emptyQ = (): QuestionForm => ({
  question: "", optionA: "", optionB: "", optionC: "", optionD: "",
  correctAnswer: "A", marks: 1,
});

export default function CreateTest() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const [info, setInfo] = useState({
    title: "", subject: "", targetClass: "", duration: 60,
    scheduledAt: "",
  });
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState<QuestionForm>(emptyQ());
  const [qError, setQError] = useState("");

  const infoValid =
    info.title.trim() && info.subject.trim() && info.targetClass && info.duration > 0 && info.scheduledAt;

  const addQuestion = () => {
    if (!currentQ.question.trim() || !currentQ.optionA.trim() || !currentQ.optionB.trim() ||
        !currentQ.optionC.trim() || !currentQ.optionD.trim()) {
      setQError("Please fill in the question and all four options.");
      return;
    }
    setQError("");
    setQuestions((prev) => [...prev, { ...currentQ, id: generateId() }]);
    setCurrentQ(emptyQ());
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);

  const publishTest = () => {
    if (questions.length === 0) {
      toast({ title: "Add at least one question.", variant: "destructive" });
      return;
    }
    const scheduledAt = new Date(info.scheduledAt);
    const endsAt = new Date(scheduledAt.getTime() + info.duration * 60 * 1000);
    const test: Test = {
      id: generateId(),
      title: info.title,
      subject: info.subject,
      targetClass: info.targetClass,
      duration: info.duration,
      totalMarks,
      scheduledAt: scheduledAt.toISOString(),
      endsAt: endsAt.toISOString(),
      createdAt: new Date().toISOString(),
      questions,
    };
    addTest(test);
    toast({ title: "Test Published!", description: `"${test.title}" is now live.` });
    navigate("/teacher");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Test</h2>
        <p className="text-muted-foreground">Build a multiple-choice test for your class.</p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0
                ${i < step ? "bg-primary border-primary text-white" : i === step ? "border-primary text-primary" : "border-muted-foreground"}`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Test Details */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Test Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Test Title</Label>
                <Input placeholder="e.g. Mid-Term Science Test" value={info.title}
                  onChange={(e) => setInfo({ ...info, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input placeholder="e.g. Science" value={info.subject}
                  onChange={(e) => setInfo({ ...info, subject: e.target.value })} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Target Class</Label>
                <Select value={info.targetClass} onValueChange={(v) => setInfo({ ...info, targetClass: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Duration (minutes)</Label>
                <Input type="number" min={5} value={info.duration}
                  onChange={(e) => setInfo({ ...info, duration: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Scheduled Date & Time</Label>
              <Input type="datetime-local" value={info.scheduledAt}
                onChange={(e) => setInfo({ ...info, scheduledAt: e.target.value })} />
            </div>
            <Button className="w-full" onClick={() => setStep(1)} disabled={!infoValid}>
              Next: Add Questions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Add Questions */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add a Question</CardTitle>
              <p className="text-sm text-muted-foreground">
                {questions.length} question(s) added — {totalMarks} total marks
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Question</Label>
                <Textarea placeholder="Enter your question here..." rows={3} value={currentQ.question}
                  onChange={(e) => setCurrentQ({ ...currentQ, question: e.target.value })} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {(["A","B","C","D"] as const).map((opt) => (
                  <div key={opt} className="space-y-1">
                    <Label>Option {opt}</Label>
                    <Input placeholder={`Option ${opt}`} value={currentQ[`option${opt}`]}
                      onChange={(e) => setCurrentQ({ ...currentQ, [`option${opt}`]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <RadioGroup value={currentQ.correctAnswer}
                    onValueChange={(v) => setCurrentQ({ ...currentQ, correctAnswer: v as "A"|"B"|"C"|"D" })}
                    className="flex gap-4">
                    {(["A","B","C","D"] as const).map((opt) => (
                      <div key={opt} className="flex items-center gap-1.5">
                        <RadioGroupItem value={opt} id={`correct-${opt}`} />
                        <Label htmlFor={`correct-${opt}`} className="font-medium">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-1">
                  <Label>Marks</Label>
                  <Input type="number" min={1} max={10} value={currentQ.marks}
                    onChange={(e) => setCurrentQ({ ...currentQ, marks: Number(e.target.value) })} />
                </div>
              </div>
              {qError && <p className="text-sm text-destructive">{qError}</p>}
              <Button onClick={addQuestion} className="w-full" variant="secondary">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Added Questions ({questions.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-start justify-between gap-3 p-3 bg-muted/40 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                        {q.question}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Correct: <strong>{q.correctAnswer}</strong> — {q.marks} mark(s)
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}
                      className="text-destructive hover:text-destructive flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button className="flex-1" onClick={() => setStep(2)} disabled={questions.length === 0}>
              Next: Review & Publish
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Publish */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Review & Publish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {[
                ["Title", info.title],
                ["Subject", info.subject],
                ["Target Class", info.targetClass],
                ["Duration", `${info.duration} minutes`],
                ["Scheduled At", new Date(info.scheduledAt).toLocaleString("en-IN")],
                ["Total Questions", String(questions.length)],
                ["Total Marks", String(totalMarks)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={publishTest}>
                Publish Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
