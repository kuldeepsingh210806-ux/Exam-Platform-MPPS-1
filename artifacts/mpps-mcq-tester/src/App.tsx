import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import Home from "@/pages/home";
import StudentLogin from "@/pages/student-login";
import TeacherLogin from "@/pages/teacher-login";
import PrincipalLogin from "@/pages/principal-login";
import StudentPortal from "@/pages/student-portal";
import TeacherPortal from "@/pages/teacher-portal";
import PrincipalPortal from "@/pages/principal-portal";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedStudent({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const [, navigate] = useLocation();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!user || role !== "student") { navigate("/student-login"); return null; }
  return <>{children}</>;
}

function ProtectedTeacher({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const [, navigate] = useLocation();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!user || role !== "teacher") { navigate("/teacher-login"); return null; }
  return <>{children}</>;
}

function ProtectedPrincipal({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const [, navigate] = useLocation();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!user || role !== "principal") { navigate("/principal-login"); return null; }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/student-login" component={StudentLogin} />
      <Route path="/teacher-login" component={TeacherLogin} />
      <Route path="/principal-login" component={PrincipalLogin} />
      <Route path="/student">
        {() => <ProtectedStudent><StudentPortal /></ProtectedStudent>}
      </Route>
      <Route path="/student/*">
        {() => <ProtectedStudent><StudentPortal /></ProtectedStudent>}
      </Route>
      <Route path="/teacher">
        {() => <ProtectedTeacher><TeacherPortal /></ProtectedTeacher>}
      </Route>
      <Route path="/teacher/*">
        {() => <ProtectedTeacher><TeacherPortal /></ProtectedTeacher>}
      </Route>
      <Route path="/principal">
        {() => <ProtectedPrincipal><PrincipalPortal /></ProtectedPrincipal>}
      </Route>
      <Route path="/principal/*">
        {() => <ProtectedPrincipal><PrincipalPortal /></ProtectedPrincipal>}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
