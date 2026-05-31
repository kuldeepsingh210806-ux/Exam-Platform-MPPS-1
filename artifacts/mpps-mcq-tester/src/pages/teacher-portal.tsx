import { Switch, Route } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import TeacherDashboard from "./teacher/dashboard";
import CreateTest from "./teacher/create-test";
import ManageTests from "./teacher/manage-tests";
import ManageStudents from "./teacher/manage-students";
import TeacherResults from "./teacher/results";
import TeacherReports from "./teacher/reports";

export default function TeacherPortal() {
  const links = [
    { label: "Dashboard", href: "" },
    { label: "Create Test", href: "/create-test" },
    { label: "Manage Tests", href: "/manage-tests" },
    { label: "Manage Students", href: "/students" },
    { label: "View Results", href: "/results" },
    { label: "PDF Reports", href: "/reports" },
  ];

  return (
    <PortalLayout title="Teacher Portal" links={links} basePath="/teacher">
      <Switch>
        <Route path="/teacher" component={TeacherDashboard} />
        <Route path="/teacher/create-test" component={CreateTest} />
        <Route path="/teacher/manage-tests" component={ManageTests} />
        <Route path="/teacher/students" component={ManageStudents} />
        <Route path="/teacher/results" component={TeacherResults} />
        <Route path="/teacher/reports" component={TeacherReports} />
        <Route><div className="p-8 text-center text-muted-foreground">Page not found</div></Route>
      </Switch>
    </PortalLayout>
  );
}
