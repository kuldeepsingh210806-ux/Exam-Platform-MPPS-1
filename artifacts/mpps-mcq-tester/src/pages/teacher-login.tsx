import { useState } from "react";
import { useLocation } from "wouter";
import { deleteUser } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { saveTeacherProfile, getTeacherProfile } from "@/lib/firestore";
import { firebaseConfigValid } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Loader2, AlertTriangle } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth-error";

const SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology","English","Hindi",
  "History","Geography","Political Science","Economics",
  "Accountancy","Business Studies","Physical Education",
  "Computer Science","Informatics Practices","Sociology",
  "Psychology","Entrepreneurship","Environmental Science",
];
const TEACHER_PASSKEY = "MPPS01";

function validateMobile(m: string): string | null {
  const digits = m.replace(/\D/g, "");
  if (!digits) return "Mobile number is required.";
  if (digits.length !== 10) return "Mobile number must be exactly 10 digits.";
  return null;
}

export default function TeacherLogin() {
  const [, navigate] = useLocation();
  const { signUp, signIn, setRole, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"passkey" | "auth">("passkey");
  const [passkey, setPasskey] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ mobile: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", mobile: "", subject: "", password: "", confirm: "" });

  const mobileToEmail = (m: string) => `${m.trim()}@mpps-teacher.edu`;

  const verifyPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim() === TEACHER_PASSKEY) {
      setStep("auth");
    } else {
      toast({ title: "Invalid passkey", variant: "destructive" });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const mobileErr = validateMobile(loginForm.mobile);
    if (mobileErr) { toast({ title: mobileErr, variant: "destructive" }); return; }
    if (!loginForm.password) { toast({ title: "Password is required.", variant: "destructive" }); return; }

    setLoading(true);
    console.log("[MPPS] Teacher login attempt for mobile:", loginForm.mobile);

    try {
      const user = await signIn(mobileToEmail(loginForm.mobile), loginForm.password);
      console.log("[MPPS] Firebase Auth login success, uid:", user.uid);

      const profile = await getTeacherProfile(user.uid);
      if (!profile) {
        console.warn("[MPPS] No Firestore teacher profile found for uid:", user.uid);
        toast({ title: "No teacher account found.", variant: "destructive" });
        setLoading(false);
        return;
      }

      console.log("[MPPS] Teacher profile loaded:", profile.name);
      setRole("teacher");
      await refreshProfile();
      navigate("/teacher");
    } catch (err: unknown) {
      toast({ title: "Login failed", description: friendlyAuthError(err, "teacher-login"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, mobile, subject, password, confirm } = regForm;

    // ── Input validation ─────────────────────────────────────────────────
    if (!name.trim())   { toast({ title: "Full name is required.", variant: "destructive" }); return; }
    const mobileErr = validateMobile(mobile);
    if (mobileErr)      { toast({ title: mobileErr, variant: "destructive" }); return; }
    if (!subject)       { toast({ title: "Subject is required.", variant: "destructive" }); return; }
    if (!password)      { toast({ title: "Password is required.", variant: "destructive" }); return; }
    if (password.length < 6) { toast({ title: "Password must be at least 6 characters.", variant: "destructive" }); return; }
    if (password !== confirm) { toast({ title: "Passwords do not match.", variant: "destructive" }); return; }

    setLoading(true);
    console.log("[MPPS] Teacher registration started:", { name, mobile, subject });

    // ── Step 1: Create Firebase Auth user ────────────────────────────────
    let newUser: Awaited<ReturnType<typeof signUp>> | null = null;
    try {
      console.log("[MPPS] Creating Firebase Auth user...");
      newUser = await signUp(mobileToEmail(mobile), password);
      console.log("[MPPS] Firebase Auth user created, uid:", newUser.uid);
    } catch (authErr: unknown) {
      console.error("[MPPS] Firebase Auth user creation failed:", authErr);
      toast({ title: "Registration failed", description: friendlyAuthError(authErr, "teacher-register-auth"), variant: "destructive" });
      setLoading(false);
      return;
    }

    // ── Step 2: Save Firestore profile (if this fails, clean up the Auth user) ──
    try {
      console.log("[MPPS] Saving Firestore teacher profile...");
      await saveTeacherProfile(newUser.uid, {
        name: name.trim(),
        mobile: mobile.trim(),
        subject,
        createdAt: new Date().toISOString(),
      });
      console.log("[MPPS] Firestore teacher profile saved successfully.");
    } catch (firestoreErr: unknown) {
      console.error("[MPPS] Firestore profile save failed — rolling back Auth user:", firestoreErr);
      try {
        await deleteUser(newUser);
        console.log("[MPPS] Auth user rolled back successfully.");
      } catch (deleteErr: unknown) {
        console.error("[MPPS] Could not roll back Auth user:", deleteErr);
      }
      toast({
        title: "Registration failed",
        description: friendlyAuthError(firestoreErr, "teacher-register-firestore"),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // ── Step 3: Set role and navigate ────────────────────────────────────
    try {
      setRole("teacher");
      await refreshProfile();
      console.log("[MPPS] Teacher registration complete — navigating to /teacher");
      navigate("/teacher");
    } catch (navErr: unknown) {
      console.error("[MPPS] Post-registration setup error:", navErr);
      toast({ title: "Registered! But failed to load your profile. Please log in manually.", variant: "destructive" });
      navigate("/teacher-login");
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
              <p className="text-xs text-primary-foreground/70">Teacher Portal</p>
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
        {step === "passkey" ? (
          <Card className="w-full max-w-sm shadow-lg">
            <CardHeader className="text-center">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <CardTitle>Teacher Access</CardTitle>
              <p className="text-sm text-muted-foreground">Enter the teacher passkey to continue</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={verifyPasskey} className="space-y-4">
                <div className="space-y-1">
                  <Label>Teacher Passkey</Label>
                  <Input
                    type="password"
                    placeholder="Enter passkey"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">Verify Passkey</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Teacher Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
                  <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
                </TabsList>

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
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Login
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="space-y-1">
                      <Label>Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
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
                      <Label>Subject <span className="text-red-500">*</span></Label>
                      <SearchableSelect
                        value={regForm.subject}
                        onValueChange={(v) => setRegForm({ ...regForm, subject: v })}
                        options={SUBJECTS}
                        placeholder="Select subject"
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
        )}
      </div>
    </div>
  );
}
