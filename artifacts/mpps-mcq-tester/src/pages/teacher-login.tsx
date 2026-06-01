import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { saveTeacherProfile, getTeacherProfile } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";

const SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology","English","Hindi",
  "History","Geography","Political Science","Economics",
  "Accountancy","Business Studies","Physical Education",
  "Computer Science","Informatics Practices","Sociology",
  "Psychology","Entrepreneurship","Environmental Science",
];
const TEACHER_PASSKEY = "MPPS01";

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
    setLoading(true);
    try {
      const user = await signIn(mobileToEmail(loginForm.mobile), loginForm.password);
      const profile = await getTeacherProfile(user.uid);
      if (!profile) {
        toast({ title: "No teacher account found.", variant: "destructive" });
        setLoading(false); return;
      }
      setRole("teacher");
      await refreshProfile();
      navigate("/teacher");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, mobile, subject, password, confirm } = regForm;
    if (!name || !mobile || !subject || !password) {
      toast({ title: "Fill all fields", variant: "destructive" }); return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const user = await signUp(mobileToEmail(mobile), password);
      await saveTeacherProfile(user.uid, {
        name, mobile, subject, createdAt: new Date().toISOString(),
      });
      setRole("teacher");
      await refreshProfile();
      navigate("/teacher");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
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
                  <Input type="password" placeholder="Enter passkey" value={passkey}
                    onChange={(e) => setPasskey(e.target.value)} />
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
                      <Input placeholder="Mobile number" value={loginForm.mobile}
                        onChange={(e) => setLoginForm({ ...loginForm, mobile: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input type="password" value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Login
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="space-y-1">
                      <Label>Full Name</Label>
                      <Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Mobile Number</Label>
                      <Input value={regForm.mobile} onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Subject</Label>
                      <SearchableSelect
                        value={regForm.subject}
                        onValueChange={(v) => setRegForm({ ...regForm, subject: v })}
                        options={SUBJECTS}
                        placeholder="Select subject"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input type="password" value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Confirm Password</Label>
                      <Input type="password" value={regForm.confirm}
                        onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })} />
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
