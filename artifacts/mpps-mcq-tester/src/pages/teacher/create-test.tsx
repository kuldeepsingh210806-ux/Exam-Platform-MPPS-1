import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { saveTest, generateId, MCQQuestion, Test } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";

const CLASSES = ["3rd","4th","5th","6th","7th","8th","9th","10th","11th Bio","11th Commerce","11th Maths","12th Bio","12th Commerce","12th Maths"];
const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","SST"];
const STEPS = ["Test Details","Paste Questions","Review & Publish"];

function parseQuestions(raw: string): { questions: MCQQuestion[]; errors: string[] } {
  const blocks = raw.trim().split(/\n{2,}/);
  const questions: MCQQuestion[] = [];
  const errors: string[] = [];
  blocks.forEach((block, i) => {
    const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 7) { if (lines.length > 0) errors.push(`Block ${i+1}: needs at least 7 lines.`); return; }
    const q = lines[0].replace(/^Q\d+\.\s*/i, "").trim();
    const optA = lines[1].replace(/^A\)\s*/i, "").trim();
    const optB = lines[2].replace(/^B\)\s*/i, "").trim();
    const optC = lines[3].replace(/^C\)\s*/i, "").trim();
    const optD = lines[4].replace(/^D\)\s*/i, "").trim();
    const ans = lines[5].replace(/^ANSWER:\s*/i, "").trim().toUpperCase();
    const marksRaw = lines[6].replace(/^MARKS:\s*/i, "").trim();
    if (!["A","B","C","D"].includes(ans)) { errors.push(`Block ${i+1}: Invalid answer "${ans}". Must be A/B/C/D.`); return; }
    const marks = parseInt(marksRaw);
    if (isNaN(marks) || marks < 1) { errors.push(`Block ${i+1}: Invalid marks "${marksRaw}".`); return; }
    if (!q || !optA || !optB || !optC || !optD) { errors.push(`Block ${i+1}: Missing question text or options.`); return; }
    questions.push({ id: generateId(), question: q, optionA: optA, optionB: optB, optionC: optC, optionD: optD, correctAnswer: ans as "A"|"B"|"C"|"D", marks });
  });
  return { questions, errors };
}

export default function CreateTest() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState({ title:"", subject:"", targetClass:"", duration:60, scheduledAt:"", endsAt:"" });
  const [bulkText, setBulkText] = useState("");
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const infoValid = info.title.trim() && info.subject && info.targetClass && info.duration > 0 && info.scheduledAt && info.endsAt;

  const handleParse = () => {
    const { questions: qs, errors } = parseQuestions(bulkText);
    setQuestions(qs);
    setParseErrors(errors);
    if (qs.length > 0) toast({ title: `Parsed ${qs.length} question(s) successfully.` });
  };

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  const publish = async (published: boolean) => {
    if (questions.length === 0) { toast({ title:"Add at least one question.", variant:"destructive" }); return; }
    setLoading(true);
    try {
      const test: Test = {
        id: generateId(), title: info.title, subject: info.subject, targetClass: info.targetClass,
        duration: info.duration, totalMarks,
        scheduledAt: new Date(info.scheduledAt).toISOString(),
        endsAt: new Date(info.endsAt).toISOString(),
        createdAt: new Date().toISOString(), createdBy: user?.uid ?? "",
        questions, published,
      };
      await saveTest(test);
      toast({ title: published ? "Test published!" : "Test saved as draft.", description: test.title });
      navigate("/teacher");
    } catch (e: any) {
      toast({ title: "Failed to save test.", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold tracking-tight">Bulk Test Creation</h2>
        <p className="text-muted-foreground">Create a test and paste all MCQ questions at once.</p></div>
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
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card><CardHeader><CardTitle>Test Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Test Title</Label><Input placeholder="e.g. Mid-Term Science Test" value={info.title} onChange={e=>setInfo({...info,title:e.target.value})} /></div>
              <div className="space-y-1"><Label>Subject</Label>
                <Select value={info.subject} onValueChange={v=>setInfo({...info,subject:v})}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Target Class</Label>
                <Select value={info.targetClass} onValueChange={v=>setInfo({...info,targetClass:v})}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{CLASSES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Duration (minutes)</Label>
                <Input type="number" min={5} value={info.duration} onChange={e=>setInfo({...info,duration:Number(e.target.value)})} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Start Date & Time</Label><Input type="datetime-local" value={info.scheduledAt} onChange={e=>setInfo({...info,scheduledAt:e.target.value})} /></div>
              <div className="space-y-1"><Label>End Date & Time</Label><Input type="datetime-local" value={info.endsAt} onChange={e=>setInfo({...info,endsAt:e.target.value})} /></div>
            </div>
            <Button className="w-full" onClick={()=>setStep(1)} disabled={!infoValid}>Next: Add Questions</Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Paste MCQ Questions</CardTitle>
            <p className="text-sm text-muted-foreground">Paste all questions in the format below. Separate each question with a blank line.</p>
            <pre className="text-xs bg-muted p-3 rounded-md mt-2 font-mono whitespace-pre-wrap">{`Q1. What is 2 + 2?\nA) 1\nB) 2\nC) 4\nD) 5\nANSWER: C\nMARKS: 2\n\nQ2. Capital of India?\nA) Mumbai\nB) Delhi\nC) Kolkata\nD) Chennai\nANSWER: B\nMARKS: 1`}</pre>
          </CardHeader>
            <CardContent className="space-y-4">
              <Textarea rows={12} placeholder="Paste your questions here..." value={bulkText}
                onChange={e=>{setBulkText(e.target.value);setQuestions([]);setParseErrors([]);}} />
              <Button variant="secondary" className="w-full" onClick={handleParse} disabled={!bulkText.trim()}>Parse & Preview Questions</Button>
              {parseErrors.length > 0 && <div className="space-y-1">{parseErrors.map((e,i)=><p key={i} className="text-sm text-destructive">⚠ {e}</p>)}</div>}
              {questions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">{questions.length} question(s) parsed — {totalMarks} total marks</p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {questions.map((q,i)=>(
                      <div key={q.id} className="flex items-start justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                        <div><p className="font-medium">{i+1}. {q.question}</p><p className="text-xs text-muted-foreground mt-1">Answer: {q.correctAnswer} · {q.marks} mark(s)</p></div>
                        <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={()=>setQuestions(prev=>prev.filter((_,idx)=>idx!==i))}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" onClick={()=>setStep(0)}>Back</Button>
            <Button className="flex-1" onClick={()=>setStep(2)} disabled={questions.length===0}>Next: Review & Publish</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <Card><CardHeader><CardTitle>Review & Publish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {[["Title",info.title],["Subject",info.subject],["Class",info.targetClass],["Duration",`${info.duration} min`],
                ["Start",new Date(info.scheduledAt).toLocaleString("en-IN")],["End",new Date(info.endsAt).toLocaleString("en-IN")],
                ["Questions",String(questions.length)],["Total Marks",String(totalMarks)]].map(([l,v])=>(
                <div key={l} className="flex justify-between border-b pb-2"><span className="text-muted-foreground">{l}</span><span className="font-semibold">{v}</span></div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={()=>setStep(1)}>Back</Button>
              <Button variant="secondary" className="flex-1" onClick={()=>publish(false)} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save as Draft
              </Button>
              <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={()=>publish(true)} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Publish Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
