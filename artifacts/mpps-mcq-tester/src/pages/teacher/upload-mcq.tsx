import { useState } from "react";
import { getTests, updateTest, generateId, MCQQuestion } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle, FileText, Upload } from "lucide-react";

type QForm = {
  question: string; optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: "A" | "B" | "C" | "D"; marks: number;
};

const emptyQ = (): QForm => ({
  question: "", optionA: "", optionB: "", optionC: "", optionD: "",
  correctAnswer: "A", marks: 1,
});

function parseQuestions(raw: string): { parsed: MCQQuestion[]; errors: string[] } {
  const blocks = raw.trim().split(/\n{2,}/);
  const parsed: MCQQuestion[] = [];
  const errors: string[] = [];

  blocks.forEach((block, i) => {
    const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 7) { errors.push(`Block ${i + 1}: Not enough lines.`); return; }

    const qLine = lines[0].replace(/^Q\d+\.\s*/, "");
    const optA = lines[1].replace(/^A\)\s*/, "");
    const optB = lines[2].replace(/^B\)\s*/, "");
    const optC = lines[3].replace(/^C\)\s*/, "");
    const optD = lines[4].replace(/^D\)\s*/, "");
    const ansLine = lines[5].replace(/^Answer:\s*/i, "").trim().toUpperCase();
    const marksLine = lines[6].replace(/^Marks:\s*/i, "").trim();

    if (!["A","B","C","D"].includes(ansLine)) {
      errors.push(`Block ${i + 1}: Invalid answer "${ansLine}".`); return;
    }
    const marks = parseInt(marksLine, 10);
    if (isNaN(marks)) { errors.push(`Block ${i + 1}: Invalid marks "${marksLine}".`); return; }

    parsed.push({
      id: generateId(), question: qLine, optionA: optA, optionB: optB, optionC: optC, optionD: optD,
      correctAnswer: ansLine as "A"|"B"|"C"|"D", marks,
    });
  });

  return { parsed, errors };
}

export default function UploadMCQ() {
  const { toast } = useToast();
  const [tests, setTests] = useState(getTests());
  const [selectedTestId, setSelectedTestId] = useState("");
  const [manualQ, setManualQ] = useState<QForm>(emptyQ());
  const [bulkText, setBulkText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<MCQQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [manualError, setManualError] = useState("");

  const refreshTests = () => setTests(getTests());

  const addManualQuestion = () => {
    if (!selectedTestId) { setManualError("Select a test first."); return; }
    if (!manualQ.question.trim() || !manualQ.optionA.trim() || !manualQ.optionB.trim() ||
        !manualQ.optionC.trim() || !manualQ.optionD.trim()) {
      setManualError("Fill in the question and all options."); return;
    }
    setManualError("");
    const test = getTests().find((t) => t.id === selectedTestId);
    if (!test) return;
    const updated = {
      ...test,
      questions: [...test.questions, { ...manualQ, id: generateId() }],
      totalMarks: test.totalMarks + manualQ.marks,
    };
    updateTest(updated);
    refreshTests();
    setManualQ(emptyQ());
    toast({ title: "Question added to test." });
  };

  const handleParse = () => {
    const { parsed, errors } = parseQuestions(bulkText);
    setParsedQuestions(parsed);
    setParseErrors(errors);
    if (parsed.length > 0) toast({ title: `Parsed ${parsed.length} question(s).` });
  };

  const importBulk = () => {
    if (!selectedTestId) { toast({ title: "Select a test first.", variant: "destructive" }); return; }
    if (parsedQuestions.length === 0) { toast({ title: "No questions to import.", variant: "destructive" }); return; }
    const test = getTests().find((t) => t.id === selectedTestId);
    if (!test) return;
    const updated = {
      ...test,
      questions: [...test.questions, ...parsedQuestions],
      totalMarks: test.totalMarks + parsedQuestions.reduce((a, q) => a + q.marks, 0),
    };
    updateTest(updated);
    refreshTests();
    setParsedQuestions([]);
    setBulkText("");
    toast({ title: `${parsedQuestions.length} question(s) imported successfully.` });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload MCQ Questions</h2>
        <p className="text-muted-foreground">Add questions to an existing test manually or in bulk.</p>
      </div>

      <div className="space-y-1">
        <Label>Select Test to Add Questions To</Label>
        <Select value={selectedTestId} onValueChange={setSelectedTestId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a test..." />
          </SelectTrigger>
          <SelectContent>
            {tests.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title} — {t.targetClass} ({t.questions.length} Qs)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tests.length === 0 && (
          <p className="text-sm text-muted-foreground">No tests found. Create a test first.</p>
        )}
      </div>

      <Tabs defaultValue="manual">
        <TabsList className="w-full">
          <TabsTrigger value="manual" className="flex-1"><FileText className="w-4 h-4 mr-2" />Manual Entry</TabsTrigger>
          <TabsTrigger value="bulk" className="flex-1"><Upload className="w-4 h-4 mr-2" />Bulk Text Import</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card>
            <CardHeader><CardTitle>Add Single Question</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Question</Label>
                <Textarea rows={3} placeholder="Enter question..." value={manualQ.question}
                  onChange={(e) => setManualQ({ ...manualQ, question: e.target.value })} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {(["A","B","C","D"] as const).map((opt) => (
                  <div key={opt} className="space-y-1">
                    <Label>Option {opt}</Label>
                    <Input value={manualQ[`option${opt}`]}
                      onChange={(e) => setManualQ({ ...manualQ, [`option${opt}`]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <RadioGroup value={manualQ.correctAnswer}
                    onValueChange={(v) => setManualQ({ ...manualQ, correctAnswer: v as "A"|"B"|"C"|"D" })}
                    className="flex gap-4">
                    {(["A","B","C","D"] as const).map((o) => (
                      <div key={o} className="flex items-center gap-1.5">
                        <RadioGroupItem value={o} id={`m-${o}`} />
                        <Label htmlFor={`m-${o}`}>{o}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-1">
                  <Label>Marks</Label>
                  <Input type="number" min={1} value={manualQ.marks}
                    onChange={(e) => setManualQ({ ...manualQ, marks: Number(e.target.value) })} />
                </div>
              </div>
              {manualError && <p className="text-sm text-destructive">{manualError}</p>}
              <Button onClick={addManualQuestion} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" /> Add to Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Text Import</CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste questions in this format (separate each question with a blank line):
              </p>
              <pre className="text-xs bg-muted p-3 rounded-md mt-2 font-mono whitespace-pre-wrap">
{`Q1. What is the capital of India?
A) New Delhi
B) Mumbai
C) Kolkata
D) Chennai
Answer: A
Marks: 2`}
              </pre>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea rows={10} placeholder="Paste your questions here..." value={bulkText}
                onChange={(e) => { setBulkText(e.target.value); setParsedQuestions([]); setParseErrors([]); }} />
              <Button variant="secondary" className="w-full" onClick={handleParse} disabled={!bulkText.trim()}>
                Parse & Preview
              </Button>
              {parseErrors.length > 0 && (
                <div className="space-y-1">
                  {parseErrors.map((e, i) => <p key={i} className="text-sm text-destructive">{e}</p>)}
                </div>
              )}
              {parsedQuestions.length > 0 && (
                <div className="space-y-3">
                  <p className="font-medium text-sm text-green-700">{parsedQuestions.length} question(s) parsed successfully:</p>
                  {parsedQuestions.map((q, i) => (
                    <div key={q.id} className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                      <p className="font-medium">{i + 1}. {q.question}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Answer: {q.correctAnswer} — {q.marks} mark(s)
                      </p>
                    </div>
                  ))}
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={importBulk}>
                    <Upload className="w-4 h-4 mr-2" /> Import {parsedQuestions.length} Question(s) to Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
