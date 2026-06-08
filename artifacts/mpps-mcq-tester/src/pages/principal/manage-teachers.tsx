import { useEffect, useState } from "react";
import { listenTeachers, deleteTeacherProfile, TeacherProfile } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, GraduationCap } from "lucide-react";

export default function ManageTeachers() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [search, setSearch] = useState("");
  const [deleteUid, setDeleteUid] = useState<string|null>(null);

  useEffect(() => { const u = listenTeachers(setTeachers); return u; }, []);

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.mobile.includes(search) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const confirmDelete = async () => {
    if (!deleteUid) return;
    await deleteTeacherProfile(deleteUid);
    setDeleteUid(null);
    toast({ title: "Teacher removed." });
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold tracking-tight">Manage Teachers</h2>
        <p className="text-muted-foreground">{teachers.length} teacher(s) registered.</p></div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name, mobile, subject..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Teachers Found</h3>
          <p className="text-muted-foreground mt-2">Teachers appear here once they register via the Teacher Portal.</p>
        </div>
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Subject</TableHead>
              <TableHead>Mobile</TableHead><TableHead>Classes Assigned</TableHead>
              <TableHead>Registered</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.uid}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{t.mobile}</TableCell>
                  <TableCell className="text-sm">{t.assignedClasses?.join(", ") || "—"}</TableCell>
                  <TableCell className="text-sm">{new Date(t.createdAt).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={()=>setDeleteUid(t.uid)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
      <AlertDialog open={!!deleteUid} onOpenChange={o=>!o&&setDeleteUid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Teacher?</AlertDialogTitle>
            <AlertDialogDescription>This removes their registration from the system.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
