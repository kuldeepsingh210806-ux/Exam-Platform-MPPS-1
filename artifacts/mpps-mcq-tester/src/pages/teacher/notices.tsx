import { useEffect, useState } from "react";
import { listenNotices, saveNotice, updateNotice, deleteNotice, generateId, Notice } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, PlusCircle, Trash2, Edit2 } from "lucide-react";

const CLASSES = ["3rd","4th","5th","6th","7th","8th","9th","10th","11th Bio","11th Commerce","11th Maths","12th Bio","12th Commerce","12th Maths"];

type NoticeForm = {
  title: string;
  content: string;
  targetAudience: Notice["targetAudience"];
  targetClasses: string[];
};

const EMPTY_FORM: NoticeForm = {
  title: "", content: "", targetAudience: "Students", targetClasses: [],
};

function NoticeFormFields({ form, onChange }: {
  form: NoticeForm;
  onChange: (updated: Partial<NoticeForm>) => void;
}) {
  const toggleClass = (cls: string) => {
    const next = form.targetClasses.includes(cls)
      ? form.targetClasses.filter(c => c !== cls)
      : [...form.targetClasses, cls];
    onChange({ targetClasses: next });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Title</Label>
        <Input
          placeholder="Notice title..."
          value={form.title}
          onChange={e => onChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Target Classes <span className="text-muted-foreground text-xs">(leave empty for all)</span></Label>
        <div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-40 overflow-y-auto">
          {CLASSES.map(cls => (
            <button key={cls} type="button"
              onClick={() => toggleClass(cls)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                form.targetClasses.includes(cls)
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
        {form.targetClasses.length > 0 && (
          <p className="text-xs text-muted-foreground">Targeting: {form.targetClasses.join(", ")}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label>Content</Label>
        <Textarea
          rows={5}
          placeholder="Write notice content..."
          value={form.content}
          onChange={e => onChange({ content: e.target.value })}
        />
      </div>
    </div>
  );
}

export default function TeacherNotices() {
  const { user, teacherProfile } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices]       = useState<Notice[]>([]);
  const [showing, setShowing]       = useState(false);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState<NoticeForm>(EMPTY_FORM);

  useEffect(() => { const u = listenNotices(setNotices); return u; }, []);

  const myNotices     = notices.filter(n => n.teacherId === user?.uid);
  const schoolNotices = notices.filter(n => n.authorRole === "principal" || !n.authorRole);

  const updateForm = (patch: Partial<NoticeForm>) => setForm(f => ({ ...f, ...patch }));
  const resetForm  = () => setForm(EMPTY_FORM);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Title and content are required.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const n: Notice = {
        id: generateId(),
        title: form.title.trim(),
        content: form.content.trim(),
        targetAudience: form.targetAudience,
        targetClasses: form.targetClasses.length > 0 ? form.targetClasses : undefined,
        author: teacherProfile?.name ?? "Teacher",
        authorRole: "teacher",
        teacherId: user?.uid,
        createdAt: new Date().toISOString(),
      };
      await saveNotice(n);
      resetForm();
      setShowing(false);
      toast({ title: "Notice published to students!" });
    } finally { setSaving(false); }
  };

  const openEdit = (n: Notice) => {
    setEditNotice(n);
    setForm({ title: n.title, content: n.content, targetAudience: n.targetAudience, targetClasses: n.targetClasses ?? [] });
  };

  const handleEdit = async () => {
    if (!editNotice || !form.title.trim() || !form.content.trim()) {
      toast({ title: "Title and content are required.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await updateNotice(editNotice.id, {
        title: form.title.trim(),
        content: form.content.trim(),
        targetAudience: form.targetAudience,
        targetClasses: form.targetClasses.length > 0 ? form.targetClasses : undefined,
      });
      setEditNotice(null);
      resetForm();
      toast({ title: "Notice updated." });
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
          <h2 className="text-2xl font-bold tracking-tight">Notices</h2>
          <p className="text-muted-foreground">Send notices to your students and view school announcements.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowing(true); }}>
          <PlusCircle className="w-4 h-4 mr-2" /> New Notice
        </Button>
      </div>

      {showing && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Create Notice</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <NoticeFormFields form={form} onChange={updateForm} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowing(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Publishing..." : "Publish Notice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My Notices ({myNotices.length})</TabsTrigger>
          <TabsTrigger value="school">School Notices ({schoolNotices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4 space-y-4">
          {myNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="font-semibold">No notices posted yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Click "New Notice" to send an announcement to students.</p>
            </div>
          ) : (
            myNotices.map(n => (
              <Card key={n.id} className="border-l-4 border-l-accent">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{n.title}</h3>
                        <Badge variant="outline" className="text-xs">{n.targetAudience}</Badge>
                        {n.targetClasses && n.targetClasses.length > 0 && (
                          <span className="text-xs text-muted-foreground">→ {n.targetClasses.join(", ")}</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(n.createdAt).toLocaleString("en-IN")} · {n.author}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(n)}>
                        <Edit2 className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(n.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="school" className="mt-4 space-y-4">
          {schoolNotices.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No school announcements yet.</p>
          ) : (
            schoolNotices.map(n => (
              <Card key={n.id} className="border-l-4 border-l-accent">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{n.title}</h3>
                        <Badge variant="outline" className="text-xs">{n.targetAudience}</Badge>
                        <Badge className="text-xs bg-primary">Principal</Badge>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(n.createdAt).toLocaleString("en-IN")} · {n.author}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editNotice} onOpenChange={o => { if (!o) { setEditNotice(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Notice</DialogTitle></DialogHeader>
          <NoticeFormFields form={form} onChange={updateForm} />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => { setEditNotice(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
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
