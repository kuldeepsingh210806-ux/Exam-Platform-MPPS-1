import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock } from "lucide-react";

const PRINCIPAL_PASSKEY = "MPPS05";

export default function PrincipalLogin() {
  const [, navigate] = useLocation();
  const { setRole } = useAuth();
  const { toast } = useToast();
  const [passkey, setPasskey] = useState("");

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim() === PRINCIPAL_PASSKEY) {
      setRole("principal");
      navigate("/principal");
    } else {
      toast({ title: "Invalid passkey", variant: "destructive" });
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
            <p className="text-sm text-muted-foreground">Enter the principal passkey to access the dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={verify} className="space-y-4">
              <div className="space-y-1">
                <Label>Principal Passkey</Label>
                <Input type="password" placeholder="Enter passkey" value={passkey}
                  onChange={(e) => setPasskey(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Access Principal Portal</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
