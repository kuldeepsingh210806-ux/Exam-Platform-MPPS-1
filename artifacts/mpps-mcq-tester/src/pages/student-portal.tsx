import { PortalLayout } from "@/components/portal-layout";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentPortal() {
  const links = [
    { label: "Live Tests", href: "/live-tests" },
    { label: "Upcoming Tests", href: "/upcoming" },
    { label: "Previous Tests", href: "/previous" },
    { label: "Results", href: "/results" },
    { label: "Review Answers", href: "/review" },
  ];

  return (
    <PortalLayout title="Student Portal" links={links} basePath="/student">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <Card className="border-t-4 border-t-accent shadow-sm flex-1 flex flex-col items-center justify-center p-12 text-center">
          <CardHeader className="items-center pb-2">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome, Student</CardTitle>
            <CardDescription className="text-base mt-2 max-w-md mx-auto">
              This portal is currently under construction. Soon, you will be able to take live tests, view your past results, and track your academic progress right here.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm">
              Coming Soon
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
