import { useState } from "react";
import { useLocation } from "wouter";
import { deleteUser } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { saveStudentProfile, getStudentProfile, getAllStudents } from "@/lib/firestore";
import { firebaseConfigValid } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth-error";

const CLASSES = [
  "3rd","4th","5th","6th","7th","8th","9th","10th",
  "11th Bio","11th Commerce","11th Maths",
  "12th Bio","12th Commerce","12th Maths",
];
const SECTIONS = ["A","B","C","D"];

function validateMobile(m: string): string | null {
  const digits = m.replace(/\D/g, "");
  if (!digits) return "Mobile number is required.";
  if (digits.length !== 10) return "Mobile number must be exactly 10 digits.";
  return null;
}

export default function StudentLogin() {
  const [, navigate] = useLocation();
  const { signUp, signIn, setRole, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ mobile: "", password: "" });
  const [regForm, setRegForm] = useState({
    name: "", admissionNumber: "", class: "", section: "",
    rollNumber: "", mobile: "", password: "", confirm: "",
  });

  const mobileToEmail = (mobile: string) => `${mobile.trim()}@mpps.edu`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const mobileErr = validateMobile(loginForm.mobile);
    if (mobileErr) { toast({ title: mobileErr, variant: "destructive" }); return; }
    if (!loginForm.password) { toast({ title: "Password is required.", variant: "destructive" }); return; }

    setLoading(true);
    console.log("[MPPS] Student login attempt for mobile:", loginForm.mobile);

    try {
      const user = await signIn(mobileToEmail(loginForm.mobile), loginForm.password);
      console.log("[MPPS] Firebase Auth login success, uid:", user.uid);

      const profile = await getStudentProfile(user.uid);
      if (!profile) {
        console.warn("[MPPS] No Firestore student profile found for uid:", user.uid);
        toast({ title: "No student account found for this number.", variant: "destructive" });
        setLoading(false);
        return;
      }

      console.log("[MPPS] Student profile loaded:", profile.name);
      setRole("student");
      await refreshProfile();
      navigate("/student");
    } catch (err: unknown) {
      toast({ title: "Login failed", description: friendlyAuthError(err, "student-login"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, admissionNumber, class: cls, section, rollNumber, mobile, password, confirm } = regForm;

    // ── Input validation ─────────────────────────────────────────────────
    if (!name.trim())            { toast({ title: "Full name is required.", variant: "destructive" }); return; }
    if (!admissionNumber.trim()) { toast({ title: "Admission number is required.", variant: "destructive" }); return; }
    if (!cls)                    { toast({ title: "Class is required.", variant: "destructive" }); return; }
    if (!section)                { toast({ title: "Section is required.", variant: "destructive" }); return; }
    if (!rollNumber.trim())      { toast({ title: "Roll number is required.", variant: "destructive" }); return; }

    const mobileErr = validateMobile(mobile);
    if (mobileErr) { toast({ title: mobileErr, variant: "destructive" }); return; }

    if (!password)               { toast({ title: "Password is required.", variant: "destructive" }); return; }
    if (password.length < 6)     { toast({ title: "Password must be at least 6 characters.", variant: "destructive" }); return; }
    if (password !== confirm)    { toast({ title: "Passwords do not match.", variant: "destructive" }); return; }

    setLoading(true);
    console.log("[MPPS] Student registration started:", { name, admissionNumber, cls, section, rollNumber, mobile });

    // ── Duplicate check (best-effort, may fail if Firestore rules block unauthenticated reads) ──
    try {
      const existing = await getAllStudents();
      const dupAdm = existing.find(s => s.admissionNumber?.trim() === admissionNumber.trim());
      if (dupAdm) {
        toast({ title: "Admission number already registered", description: "This admission number is already in use.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const dupRoll = existing.find(s => s.rollNumber === rollNumber && s.class === cls && s.section === section);
      if (dupRoll) {
        toast({ title: "Roll number already registered", description: `Roll ${rollNumber} in ${cls}-${section} is already taken.`, variant: "destructive" });
        setLoading(false);
        return;
      }
    } catch (dupErr: unknown) {
      // Firestore read blocked for unauthenticated users — skip duplicate check and proceed
      console.warn("[MPPS] Could not run duplicate check (likely unauthenticated Firestore read blocked):", dupErr);
    }

    // ── Step 1: Create Firebase Auth user ────────────────────────────────
    let newUser: Awaited<ReturnType<typeof signUp>> | null = null;
    try {
      console.log("[MPPS] Creating Firebase Auth user...");
      newUser = await signUp(mobileToEmail(mobile), password);
      console.log("[MPPS] Firebase Auth user created, uid:", newUser.uid);
    } catch (authErr: unknown) {
      console.error("[MPPS] Firebase Auth user creation failed:", authErr);
      toast({ title: "Registration failed", description: friendlyAuthError(authErr, "student-register-auth"), variant: "destructive" });
      setLoading(false);
      return;
    }

    // ── Step 2: Save Firestore profile (if this fails, clean up the Auth user) ──
    try {
      console.log("[MPPS] Saving Firestore student profile...");
      await saveStudentProfile(newUser.uid, {
        name: name.trim(),
        admissionNumber: admissionNumber.trim(),
        class: cls,
        section,
        rollNumber: rollNumber.trim(),
        mobile: mobile.trim(),
        createdAt: new Date().toISOString(),
      });
      console.log("[MPPS] Firestore profile saved successfully.");
    } catch (firestoreErr: unknown) {
      console.error("[MPPS] Firestore profile save failed — rolling back Auth user:", firestoreErr);
      // Roll back: delete the just-created Auth user so the account is not left in a broken state
      try {
        await deleteUser(newUser);
        console.log("[MPPS] Auth user rolled back successfully.");
      } catch (deleteErr: unknown) {
        console.error("[MPPS] Could not roll back Auth user:", deleteErr);
      }
      toast({
        title: "Registration failed",
        description: friendlyAuthError(firestoreErr, "student-register-firestore"),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // ── Step 3: Set role and navigate ────────────────────────────────────
    try {
      setRole("student");
      await refreshProfile();
      console.log("[MPPS] Registration complete — navigating to /student");
      navigate("/student");
    } catch (navErr: unknown) {
      console.error("[MPPS] Post-registration setup error:", navErr);
      toast({ title: "Registered! But failed to load your profile. Please log in manually.", variant: "destructive" });
      navigate("/student-login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground py-4 border-b-4 border-accent">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80"
            onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <img src="/mpps-logo.jpg" alt="MPPS" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-bold text-sm">MP Public School, Mathuranagar</p>
              <p className="text-xs text-primary-foreground/70">Student Portal</p>
            </div>
          </div>
        </div>
      </header>

      {!firebaseConfigValid && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 text-yellow-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Firebase is not configured. Registration and login will not work until environment variables are set.
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Student Access</CardTitle>
            <p className="text-sm text-muted-foreground">Login or register to access your tests</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
              </TabsList>

              {/* ── Login Tab ── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Mobile Number</Label>
                    <Input
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      maxLength={10}
                      value={loginForm.mobile}
                      onChange={(e) => setLoginForm({ ...loginForm, mobile: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Login
                  </Button>
                </form>
              </TabsContent>

              {/* ── Register Tab ── */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Your full name"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Admission Number <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. 2024001 (assigned by school)"
                      value={regForm.admissionNumber}
                      onChange={(e) => setRegForm({ ...regForm, admissionNumber: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Must be unique — contact school if unsure.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Class <span className="text-red-500">*</span></Label>
                      <SearchableSelect
                        value={regForm.class}
                        onValueChange={(v) => setRegForm({ ...regForm, class: v })}
                        options={CLASSES}
                        placeholder="Select"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Section <span className="text-red-500">*</span></Label>
                      <SearchableSelect
                        value={regForm.section}
                        onValueChange={(v) => setRegForm({ ...regForm, section: v })}
                        options={SECTIONS}
                        placeholder="Select"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Roll Number <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Your class roll number"
                      value={regForm.rollNumber}
                      onChange={(e) => setRegForm({ ...regForm, rollNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mobile Number <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      maxLength={10}
                      value={regForm.mobile}
                      onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Confirm Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      value={regForm.confirm}
                      onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Register
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
