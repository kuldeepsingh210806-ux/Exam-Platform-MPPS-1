import { useEffect, useState } from "react";
import { listenStudents, deleteStudentProfile, StudentProfile, getAllAttempts, Attempt } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Users } from "lucide-react";

const CLASSES = ["3rd","4th","5th","6th","7th","8th","9th","10th","11th Bio","11th Commerce","11th Maths","12th Bio","12th Commerce","12th Maths"];

export default function ManageStudents() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [deleteUid, setDeleteUid] = useState<string|null>(null);

  useEffect(() => { const u = listenStudents(setStudents); return u; }, []);
  useEffect(() => { getAllAttempts().then(setAttempts); }, []);

  const filtered = students
    .filter(s => filterClass === "all" || s.class === filterClass)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber.includes(search) || s.mobile.includes(search));

  const confirmDelete = async () => {
    if (!deleteUid) return;
    await deleteStudentProfile(deleteUid);
    setDeleteUid(null);
    toast({ title: "Student removed." });
  };

  const classOptions = [
    { value: "all", label: "All Classes" },
    ...CLASSES.map(c => ({ value: c, label: c })),
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold tracking-tight">Manage Students</h2>
        <p className="text-muted-foreground">{students.length} student(s) registered.</p></div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, roll, mobile..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <SearchableSelect
            value={filterClass}
            onValueChange={setFilterClass}
            options={classOptions}
            placeholder="All Classes"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-muted-foreground" /></div>
          <h3 className="text-xl font-semibold">No Students Found</h3>
          <p className="text-muted-foreground mt-2">Students appear here once they register via the Student Portal.</p>
        </div>
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Roll No.</TableHead><TableHead>Class</TableHead>
              <TableHead>Section</TableHead><TableHead>Mobile</TableHead>
              <TableHead className="text-right">Tests Done</TableHead>
              <TableHead className="text-right">Avg %</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(s => {
                const subs = attempts.filter(a=>a.studentId===s.uid && a.submitted);
                const avg = subs.length > 0 ? subs.reduce((acc,a)=>acc+(a.percentage??0),0)/subs.length : null;
                return (
                  <TableRow key={s.uid}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-sm">{s.rollNumber}</TableCell>
                    <TableCell>{s.class}</TableCell>
                    <TableCell>{s.section}</TableCell>
                    <TableCell>{s.mobile}</TableCell>
                    <TableCell className="text-right">{subs.length}</TableCell>
                    <TableCell className="text-right">{avg !== null ? `${avg.toFixed(1)}%` : "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={()=>setDeleteUid(s.uid)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
      <AlertDialog open={!!deleteUid} onOpenChange={o=>!o&&setDeleteUid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription>This removes their registration. Their test attempts will remain.</AlertDialogDescription>
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
