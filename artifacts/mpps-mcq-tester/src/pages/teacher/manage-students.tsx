import { useState } from "react";
import { getStudents, addStudent, updateStudent, deleteStudent, generateId, Student } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Search, Users } from "lucide-react";
import { getSubmissions } from "@/lib/store";

const CLASSES = ["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];
const SECTIONS = ["A","B","C","D"];

const emptyForm = () => ({
  name: "", rollNumber: "", class: "", section: "", password: "password123",
});

export default function ManageStudents() {
  const { toast } = useToast();
  const [students, setStudents] = useState(getStudents);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");

  const submissions = getSubmissions();

  const refresh = () => setStudents(getStudents());

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.includes(search)
  );

  const openAdd = () => {
    setEditStudent(null);
    setForm(emptyForm());
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({ name: s.name, rollNumber: s.rollNumber, class: s.class, section: s.section, password: s.password });
    setFormError("");
    setDialogOpen(true);
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.rollNumber.trim()) return "Roll number is required.";
    if (!form.class) return "Class is required.";
    if (!form.section) return "Section is required.";
    if (!form.password.trim()) return "Password is required.";
    const duplicate = students.find(
      (s) => s.rollNumber === form.rollNumber && s.id !== editStudent?.id
    );
    if (duplicate) return `Roll number ${form.rollNumber} already exists.`;
    return null;
  };

  const saveStudent = () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    if (editStudent) {
      updateStudent({ ...editStudent, ...form });
      toast({ title: "Student updated." });
    } else {
      addStudent({ id: generateId(), ...form });
      toast({ title: "Student added." });
    }
    refresh();
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteStudent(deleteId);
    refresh();
    setDeleteId(null);
    toast({ title: "Student removed." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Students</h2>
          <p className="text-muted-foreground">{students.length} student(s) enrolled.</p>
        </div>
        <Button onClick={openAdd}>
          <PlusCircle className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or roll no..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Students Found</h3>
          <p className="text-muted-foreground mt-2">
            {search ? "No students match your search." : "Add your first student to get started."}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-medium">{s.rollNumber}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.class}</TableCell>
                    <TableCell>{s.section}</TableCell>
                    <TableCell className="text-right">
                      {submissions.filter((sub) => sub.studentId === s.id).length}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input placeholder="e.g. Aarav Sharma" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Roll Number</Label>
              <Input placeholder="e.g. 2024001" value={form.rollNumber}
                onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Class</Label>
                <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Section</Label>
                <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input placeholder="Student login password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveStudent}>{editStudent ? "Save Changes" : "Add Student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the student record. Their past submissions will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
