import { Switch, Route } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import PrincipalDashboard from "./principal/dashboard";
import AllResults from "./principal/all-results";
import ManageTeachers from "./principal/manage-teachers";
import PrincipalNotices from "./principal/notices";

export default function PrincipalPortal() {
  const links = [
    { label: "Dashboard", href: "" },
    { label: "All Results", href: "/all-results" },
    { label: "Manage Teachers", href: "/teachers" },
    { label: "Notices", href: "/notices" },
  ];

  return (
    <PortalLayout title="Principal Portal" links={links} basePath="/principal">
      <Switch>
        <Route path="/principal" component={PrincipalDashboard} />
        <Route path="/principal/all-results" component={AllResults} />
        <Route path="/principal/teachers" component={ManageTeachers} />
        <Route path="/principal/notices" component={PrincipalNotices} />
        <Route><div className="p-8 text-center text-muted-foreground">Page not found</div></Route>
      </Switch>
    </PortalLayout>
  );
}
