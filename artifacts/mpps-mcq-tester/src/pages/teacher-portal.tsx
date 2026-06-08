import { Switch, Route } from "wouter";
import { LayoutDashboard, PlusCircle, ClipboardList, Users, BarChart2, Printer, ShieldAlert, Megaphone } from "lucide-react";
import { PortalLayout } from "@/components/portal-layout";
import TeacherDashboard from "./teacher/dashboard";
import CreateTest from "./teacher/create-test";
import ManageTests from "./teacher/manage-tests";
import ManageStudents from "./teacher/manage-students";
import TeacherResults from "./teacher/results";
import TeacherReports from "./teacher/reports";
import IntegrityReport from "./teacher/integrity";
import TeacherNotices from "./teacher/notices";

export default function TeacherPortal() {
  const links = [
    { label: "Dashboard",        href: "",            icon: LayoutDashboard },
    { label: "Create Test",      href: "/create-test",icon: PlusCircle      },
    { label: "Manage Tests",     href: "/manage-tests",icon: ClipboardList  },
    { label: "Manage Students",  href: "/students",   icon: Users           },
    { label: "View Results",     href: "/results",    icon: BarChart2       },
    { label: "PDF Reports",      href: "/reports",    icon: Printer         },
    { label: "Integrity Report", href: "/integrity",  icon: ShieldAlert     },
    { label: "Notices",          href: "/notices",    icon: Megaphone       },
  ];

  return (
    <PortalLayout title="Teacher Portal" links={links} basePath="/teacher" noticeAudience="Teachers">
      <Switch>
        <Route path="/teacher"               component={TeacherDashboard}  />
        <Route path="/teacher/create-test"   component={CreateTest}        />
        <Route path="/teacher/manage-tests"  component={ManageTests}       />
        <Route path="/teacher/students"      component={ManageStudents}    />
        <Route path="/teacher/results"       component={TeacherResults}    />
        <Route path="/teacher/reports"       component={TeacherReports}    />
        <Route path="/teacher/integrity"     component={IntegrityReport}   />
        <Route path="/teacher/notices"       component={TeacherNotices}    />
        <Route><div className="p-8 text-center text-muted-foreground">Page not found</div></Route>
      </Switch>
    </PortalLayout>
  );
}
