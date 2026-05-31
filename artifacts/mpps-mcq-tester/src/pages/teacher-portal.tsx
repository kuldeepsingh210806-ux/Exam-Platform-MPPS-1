import { Switch, Route, useRoute } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import TeacherDashboard from "./teacher/dashboard";
import CreateTest from "./teacher/create-test";
import UploadMCQ from "./teacher/upload-mcq";
import ManageStudents from "./teacher/manage-students";
import TeacherResults from "./teacher/results";
import TeacherReports from "./teacher/reports";

export default function TeacherPortal() {
  const links = [
    { label: "Dashboard", href: "" },
    { label: "Create Tests", href: "/create-test" },
    { label: "Upload MCQ Questions", href: "/upload-mcq" },
    { label: "Manage Students", href: "/students" },
    { label: "View Results", href: "/results" },
    { label: "Generate PDF Reports", href: "/reports" },
  ];

  return (
    <PortalLayout title="Teacher Portal" links={links} basePath="/teacher">
      <Switch>
        <Route path="/teacher" component={TeacherDashboard} />
        <Route path="/teacher/create-test" component={CreateTest} />
        <Route path="/teacher/upload-mcq" component={UploadMCQ} />
        <Route path="/teacher/students" component={ManageStudents} />
        <Route path="/teacher/results" component={TeacherResults} />
        <Route path="/teacher/reports" component={TeacherReports} />
        <Route>
          <div className="p-8 text-center text-muted-foreground">Page not found in Teacher Portal</div>
        </Route>
      </Switch>
    </PortalLayout>
  );
}
