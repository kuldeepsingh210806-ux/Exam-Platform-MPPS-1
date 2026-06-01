import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { saveStudentProfile, getStudentProfile } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

const CLASSES = [
  "3rd","4th","5th","6th","7th","8th","9th","10th",
  "11th Bio","11th Commerce","11th Maths",
  "12th Bio","12th Commerce","12th Maths",
];
const SECTIONS = ["A","B","C","D"];

export default function StudentLogin() {
  const [, navigate] = useLocation();
  const { signUp, signIn, setRole, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ mobile: "", password: "" });
  const [regForm, setRegForm] = useState({
    name: "", class: "", section: "", rollNumber: "", mobile: "", password: "", confirm: "",
  });

  const mobileToEmail = (mobile: string) => `${mobile.trim()}@mpps.edu`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.mobile || !loginForm.password) {
      toast({ title: "Fill all fields", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const user = await signIn(mobileToEmail(loginForm.mobile), loginForm.password);
      const profile = await getStudentProfile(user.uid);
      if (!profile) {
        toast({ title: "No student account found for this number.", variant: "destructive" });
        setLoading(false); return;
      }
      setRole("student");
      await refreshProfile();
      navigate("/student");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, class: cls, section, rollNumber, mobile, password, confirm } = regForm;
    if (!name || !cls || !section || !rollNumber || !mobile || !password) {
      toast({ title: "Fill all fields", variant: "destructive" }); return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" }); return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const user = await signUp(mobileToEmail(mobile), password);
      await saveStudentProfile(user.uid, {
        name, class: cls, section, rollNumber, mobile,
        createdAt: new Date().toISOString(),
      });
      setRole("student");
      await refreshProfile();
      navigate("/student");
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
              <p className="text-xs text-primary-foreground/70">Student Portal</p>
            </div>
          </div>
        </div>
      </header>
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
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Mobile Number</Label>
                    <Input placeholder="10-digit mobile number" value={loginForm.mobile}
                      onChange={(e) => setLoginForm({ ...loginForm, mobile: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input type="password" placeholder="Your password" value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Login
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input placeholder="Your full name" value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Class</Label>
                      <SearchableSelect
                        value={regForm.class}
                        onValueChange={(v) => setRegForm({ ...regForm, class: v })}
                        options={CLASSES}
                        placeholder="Select"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Section</Label>
                      <SearchableSelect
                        value={regForm.section}
                        onValueChange={(v) => setRegForm({ ...regForm, section: v })}
                        options={SECTIONS}
                        placeholder="Select"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Roll Number</Label>
                    <Input placeholder="e.g. 2024001" value={regForm.rollNumber}
                      onChange={(e) => setRegForm({ ...regForm, rollNumber: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Mobile Number</Label>
                    <Input placeholder="10-digit mobile number" value={regForm.mobile}
                      onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input type="password" placeholder="Min 6 characters" value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Confirm Password</Label>
                    <Input type="password" placeholder="Re-enter password" value={regForm.confirm}
                      onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Register
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
