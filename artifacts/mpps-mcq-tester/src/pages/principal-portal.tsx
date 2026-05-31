import { Switch, Route } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import PrincipalDashboard from "./principal/dashboard";
import SchoolAnalytics from "./principal/analytics";
import ClassRankings from "./principal/rankings";
import PerformanceReport from "./principal/performance";
import NoticeBoard from "./principal/notices";
import PrincipalReports from "./principal/reports";

export default function PrincipalPortal() {
  const links = [
    { label: "Dashboard", href: "" },
    { label: "School Analytics", href: "/analytics" },
    { label: "Class Rankings", href: "/rankings" },
    { label: "Performance Reports", href: "/performance" },
    { label: "Notices", href: "/notices" },
    { label: "PDF Report Generation", href: "/reports" },
  ];

  return (
    <PortalLayout title="Principal Portal" links={links} basePath="/principal">
      <Switch>
        <Route path="/principal" component={PrincipalDashboard} />
        <Route path="/principal/analytics" component={SchoolAnalytics} />
        <Route path="/principal/rankings" component={ClassRankings} />
        <Route path="/principal/performance" component={PerformanceReport} />
        <Route path="/principal/notices" component={NoticeBoard} />
        <Route path="/principal/reports" component={PrincipalReports} />
        <Route>
          <div className="p-8 text-center text-muted-foreground">Page not found in Principal Portal</div>
        </Route>
      </Switch>
    </PortalLayout>
  );
}
