import { Switch, Route } from "wouter";
import { LayoutDashboard, BarChart2, GraduationCap, Megaphone } from "lucide-react";
import { PortalLayout } from "@/components/portal-layout";
import PrincipalDashboard from "./principal/dashboard";
import AllResults from "./principal/all-results";
import ManageTeachers from "./principal/manage-teachers";
import PrincipalNotices from "./principal/notices";

export default function PrincipalPortal() {
  const links = [
    { label: "Dashboard",        href: "",             icon: LayoutDashboard },
    { label: "All Results",      href: "/all-results", icon: BarChart2       },
    { label: "Manage Teachers",  href: "/teachers",    icon: GraduationCap   },
    { label: "Notices",          href: "/notices",     icon: Megaphone       },
  ];

  return (
    <PortalLayout title="Principal Portal" links={links} basePath="/principal">
      <Switch>
        <Route path="/principal"              component={PrincipalDashboard} />
        <Route path="/principal/all-results"  component={AllResults} />
        <Route path="/principal/teachers"     component={ManageTeachers} />
        <Route path="/principal/notices"      component={PrincipalNotices} />
        <Route><div className="p-8 text-center text-muted-foreground">Page not found</div></Route>
      </Switch>
    </PortalLayout>
  );
}
