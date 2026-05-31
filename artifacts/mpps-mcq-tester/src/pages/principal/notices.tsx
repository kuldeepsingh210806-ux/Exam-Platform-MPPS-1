import { useEffect, useState } from "react";
import { listenNotices, saveNotice, deleteNotice, generateId, Notice } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, PlusCircle, Trash2 } from "lucide-react";

const AUDIENCES = ["All", "Students", "Teachers"];

export default function PrincipalNotices() {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showing, setShowing] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [form, setForm] = useState({ title:"", content:"", targetAudience:"All" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const u = listenNotices(setNotices); return u; }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast({ title:"Title and content required.", variant:"destructive" }); return; }
    setSaving(true);
    try {
      const n: Notice = {
        id: generateId(), title: form.title.trim(), content: form.content.trim(),
        targetAudience: form.targetAudience as Notice["targetAudience"],
        author: "Principal", createdAt: new Date().toISOString(),
      };
      await saveNotice(n);
      setForm({ title:"", content:"", targetAudience:"All" });
      setShowing(false);
      toast({ title: "Notice published!" });
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteNotice(deleteId);
    setDeleteId(null);
    toast({ title: "Notice deleted." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notices & Announcements</h2>
          <p className="text-muted-foreground">Post announcements for students and teachers.</p>
        </div>
        <Button onClick={() => setShowing(true)}><PlusCircle className="w-4 h-4 mr-2" />New Notice</Button>
      </div>

      {showing && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Create Notice</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Title</Label>
                <Input placeholder="Notice title..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
              </div>
              <div className="space-y-1"><Label>Target Audience</Label>
                <Select value={form.targetAudience} onValueChange={v=>setForm({...form,targetAudience:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AUDIENCES.map(a=><SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Content</Label>
              <Textarea rows={5} placeholder="Write the announcement content..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={()=>setShowing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Publishing..." : "Publish Notice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Notices Yet</h3>
          <p className="text-muted-foreground mt-2">Post a notice to inform students and teachers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map(n => (
            <Card key={n.id} className="border-l-4 border-l-accent">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{n.title}</h3>
                      <Badge variant="outline" className="text-xs">{n.targetAudience}</Badge>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.createdAt).toLocaleString("en-IN")} · {n.author}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => setDeleteId(n.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={o=>!o&&setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the notice.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
