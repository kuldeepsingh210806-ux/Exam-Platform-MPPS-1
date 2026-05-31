import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import StudentPortal from "@/pages/student-portal";
import TeacherPortal from "@/pages/teacher-portal";
import PrincipalPortal from "@/pages/principal-portal";
import { initializeStore } from "@/lib/store";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/student" component={StudentPortal} />
      <Route path="/student/*" component={StudentPortal} />
      <Route path="/teacher" component={TeacherPortal} />
      <Route path="/teacher/*" component={TeacherPortal} />
      <Route path="/principal" component={PrincipalPortal} />
      <Route path="/principal/*" component={PrincipalPortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initializeStore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
