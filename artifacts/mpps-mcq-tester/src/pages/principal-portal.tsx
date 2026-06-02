import { Switch, Route } from "wouter";
import { LayoutDashboard, BarChart2, GraduationCap, Megaphone, Users, ShieldAlert, TrendingUp } from "lucide-react";
import { PortalLayout } from "@/components/portal-layout";
import PrincipalDashboard from "./principal/dashboard";
import AllResults from "./principal/all-results";
import ManageTeachers from "./principal/manage-teachers";
import PrincipalNotices from "./principal/notices";
import PrincipalManageStudents from "./principal/manage-students";
import PrincipalIntegrityReport from "./principal/integrity";
import SchoolAnalytics from "./principal/analytics";

export default function PrincipalPortal() {
  const links = [
    { label: "Dashboard",        href: "",             icon: LayoutDashboard },
    { label: "All Results",      href: "/all-results", icon: BarChart2       },
    { label: "Analytics",        href: "/analytics",   icon: TrendingUp      },
    { label: "Manage Students",  href: "/students",    icon: Users           },
    { label: "Manage Teachers",  href: "/teachers",    icon: GraduationCap   },
    { label: "Integrity Report", href: "/integrity",   icon: ShieldAlert     },
    { label: "Notices",          href: "/notices",     icon: Megaphone       },
  ];

  return (
    <PortalLayout title="Principal Portal" links={links} basePath="/principal">
      <Switch>
        <Route path="/principal"              component={PrincipalDashboard}       />
        <Route path="/principal/all-results"  component={AllResults}               />
        <Route path="/principal/analytics"    component={SchoolAnalytics}          />
        <Route path="/principal/students"     component={PrincipalManageStudents}  />
        <Route path="/principal/teachers"     component={ManageTeachers}           />
        <Route path="/principal/integrity"    component={PrincipalIntegrityReport} />
        <Route path="/principal/notices"      component={PrincipalNotices}         />
        <Route><div className="p-8 text-center text-muted-foreground">Page not found</div></Route>
      </Switch>
    </PortalLayout>
  );
}
