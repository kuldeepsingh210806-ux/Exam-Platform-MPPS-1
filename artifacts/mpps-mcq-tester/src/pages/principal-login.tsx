import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth-error";

const PRINCIPAL_PASSKEY   = "MPPS05";
const PRINCIPAL_EMAIL     = "principal@mpps-admin.edu";
const PRINCIPAL_PASSWORD  = "MPPS05PrincipalAdmin2024";

export default function PrincipalLogin() {
  const [, navigate] = useLocation();
  const { signIn, signUp, setRole } = useAuth();
  const { toast } = useToast();
  const [passkey, setPasskey]   = useState("");
  const [loading, setLoading]   = useState(false);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim() !== PRINCIPAL_PASSKEY) {
      toast({ title: "Invalid passkey", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Sign into Firebase Auth so Firestore permission rules pass
      try {
        await signIn(PRINCIPAL_EMAIL, PRINCIPAL_PASSWORD);
      } catch (err: any) {
        // Account doesn't exist yet — create it once
        const code = err.code ?? "";
        if (
          code === "auth/user-not-found" ||
          code === "auth/invalid-credential" ||
          code === "auth/invalid-login-credentials"
        ) {
          await signUp(PRINCIPAL_EMAIL, PRINCIPAL_PASSWORD);
        } else {
          throw err;
        }
      }
      setRole("principal");
      navigate("/principal");
    } catch (err: any) {
      console.error("Principal login error:", err);
      toast({
        title: "Login failed",
        description: friendlyAuthError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground py-4 border-b-4 border-accent">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button
            variant="ghost" size="sm"
            className="text-primary-foreground hover:bg-primary/80"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <img src="/mpps-logo.jpg" alt="MPPS" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-bold text-sm">MP Public School, Mathuranagar</p>
              <p className="text-xs text-primary-foreground/70">Principal Portal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <CardTitle>Principal Access</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the principal passkey to access the dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={verify} className="space-y-4">
              <div className="space-y-1">
                <Label>Principal Passkey</Label>
                <Input
                  type="password"
                  placeholder="Enter passkey"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Signing in..." : "Access Principal Portal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
