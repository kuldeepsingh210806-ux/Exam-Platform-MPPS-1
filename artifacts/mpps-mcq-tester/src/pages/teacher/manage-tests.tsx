import { useEffect, useState } from "react";
import { listenTests, deleteTest, updateTest, Test } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Eye, EyeOff, ClipboardList, MessageCircle } from "lucide-react";
import { shareOnWhatsApp } from "@/lib/whatsapp";

export default function ManageTests() {
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [deleteId, setDeleteId] = useState<string|null>(null);

  useEffect(() => {
    console.log("[MPPS] ManageTests: mounting, subscribing to listenTests");
    const u = listenTests((incoming) => {
      console.log(`[MPPS] ManageTests: received ${incoming.length} test(s) from listener`);
      setTests(incoming);
    });
    return () => {
      console.log("[MPPS] ManageTests: unmounting, unsubscribing from listenTests");
      u();
    };
  }, []);

  const togglePublish = async (test: Test) => {
    await updateTest(test.id, { published: !test.published });
    toast({ title: test.published ? "Test unpublished." : "Test published!" });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteTest(deleteId);
    setDeleteId(null);
    toast({ title: "Test deleted." });
  };

  const shareTestAnnouncement = (t: Test) => {
    const scheduled = new Date(t.scheduledAt).toLocaleString("en-IN", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const ends = new Date(t.endsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const msg = [
      `📢 *Test Announcement*`,
      ``,
      `🏫 *MP Public School, Mathuranagar*`,
      ``,
      `📚 Test: *${t.title}*`,
      `📖 Subject: ${t.subject}`,
      `🎓 Class: ${t.targetClass}`,
      `⏰ Scheduled: ${scheduled}`,
      `🔚 Ends: ${ends}`,
      `❓ Questions: ${t.questions?.length ?? 0}`,
      `📊 Total Marks: ${t.totalMarks}`,
      ``,
      `Please be prepared and join on time.`,
      ``,
      `_MP Public School Online Exam System_`,
    ].join("\n");
    shareOnWhatsApp(msg);
    toast({ title: "WhatsApp opened!", description: `Sharing announcement for ${t.title}` });
  };

  const validTests = tests.filter(t => t && t.id);
  const sorted = [...validTests].sort((a,b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Manage Tests</h2>
        <p className="text-muted-foreground">{tests.length} test(s) total.</p>
      </div>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Tests Yet</h3>
          <p className="text-muted-foreground mt-2">Create a test to see it here.</p>
        </div>
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Qs</TableHead>
                <TableHead className="text-right">Marks</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{t.targetClass}</TableCell>
                  <TableCell className="text-sm">{new Date(t.scheduledAt).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell className="text-right">{t.questions?.length ?? 0}</TableCell>
                  <TableCell className="text-right">{t.totalMarks}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={t.published ? "default" : "secondary"} className={t.published ? "bg-green-600" : ""}>
                      {t.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" title={t.published ? "Unpublish" : "Publish"} onClick={()=>togglePublish(t)}>
                        {t.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" title="Share on WhatsApp" className="text-green-600 hover:text-green-700" onClick={()=>shareTestAnnouncement(t)}>
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={()=>setDeleteId(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
      <AlertDialog open={!!deleteId} onOpenChange={o=>!o&&setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. All questions will be removed.</AlertDialogDescription>
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
