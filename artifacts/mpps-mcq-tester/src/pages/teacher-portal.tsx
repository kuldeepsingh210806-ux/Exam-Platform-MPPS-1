import { PortalLayout } from "@/components/portal-layout";
import { Presentation } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherPortal() {
  const links = [
    { label: "Create Tests", href: "/create-test" },
    { label: "Upload MCQ Questions", href: "/upload-mcq" },
    { label: "Manage Students", href: "/students" },
    { label: "View Results", href: "/results" },
    { label: "Generate PDF Reports", href: "/reports" },
  ];

  return (
    <PortalLayout title="Teacher Portal" links={links} basePath="/teacher">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <Card className="border-t-4 border-t-primary shadow-sm flex-1 flex flex-col items-center justify-center p-12 text-center">
          <CardHeader className="items-center pb-2">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Presentation className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Teacher Dashboard</CardTitle>
            <CardDescription className="text-base mt-2 max-w-md mx-auto">
              The faculty portal is being built. You will soon have access to tools for test creation, student management, and comprehensive performance reporting.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
             <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              Coming Soon
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
