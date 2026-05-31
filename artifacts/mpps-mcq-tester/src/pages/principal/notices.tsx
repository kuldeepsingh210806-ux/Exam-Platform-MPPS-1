import { useState } from "react";
import { getNotices, addNotice, deleteNotice, generateId, Notice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Trash2, PlusCircle } from "lucide-react";

const AUDIENCE_COLORS: Record<string, string> = {
  All: "bg-blue-100 text-blue-800",
  Students: "bg-green-100 text-green-800",
  Teachers: "bg-purple-100 text-purple-800",
};

export default function NoticeBoard() {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>(() =>
    getNotices().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", content: "", targetAudience: "All" as "All" | "Students" | "Teachers", author: "Principal",
  });
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const refresh = () =>
    setNotices(
      getNotices().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );

  const postNotice = () => {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.content.trim()) { setFormError("Content is required."); return; }
    setFormError("");
    addNotice({
      id: generateId(),
      ...form,
      createdAt: new Date().toISOString(),
    });
    refresh();
    setForm({ title: "", content: "", targetAudience: "All", author: "Principal" });
    setShowForm(false);
    toast({ title: "Notice posted successfully." });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteNotice(deleteId);
    refresh();
    setDeleteId(null);
    toast({ title: "Notice deleted." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notice Board</h2>
          <p className="text-muted-foreground">Post and manage school notices.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <PlusCircle className="w-4 h-4 mr-2" /> {showForm ? "Cancel" : "Post New Notice"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-accent border-2">
          <CardHeader><CardTitle>New Notice</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input placeholder="Notice title..." value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea placeholder="Write the notice content here..." rows={4} value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Target Audience</Label>
                <Select value={form.targetAudience}
                  onValueChange={(v) => setForm({ ...form, targetAudience: v as "All"|"Students"|"Teachers" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Students">Students</SelectItem>
                    <SelectItem value="Teachers">Teachers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Author</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={postNotice}>
              Post Notice
            </Button>
          </CardContent>
        </Card>
      )}

      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Notices Yet</h3>
          <p className="text-muted-foreground mt-2">
            Post your first notice to communicate with students and teachers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <Card key={n.id} className="border-l-4 border-l-accent">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{n.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${AUDIENCE_COLORS[n.targetAudience]}`}>
                        {n.targetAudience}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })} — {n.author}
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

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the notice.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
