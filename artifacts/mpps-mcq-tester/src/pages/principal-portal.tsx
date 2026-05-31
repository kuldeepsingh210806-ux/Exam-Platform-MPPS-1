import { PortalLayout } from "@/components/portal-layout";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrincipalPortal() {
  const links = [
    { label: "School Analytics", href: "/analytics" },
    { label: "Class Rankings", href: "/rankings" },
    { label: "Performance Reports", href: "/performance" },
    { label: "Notices", href: "/notices" },
    { label: "PDF Report Generation", href: "/reports" },
  ];

  return (
    <PortalLayout title="Principal Portal" links={links} basePath="/principal">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <Card className="border-t-4 border-t-accent shadow-sm flex-1 flex flex-col items-center justify-center p-12 text-center">
          <CardHeader className="items-center pb-2">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10 text-accent" />
            </div>
            <CardTitle className="text-3xl font-bold">Administration Hub</CardTitle>
            <CardDescription className="text-base mt-2 max-w-md mx-auto">
              The administrative oversight portal is in development. Expect powerful school-wide analytics, class rankings, and instant reporting capabilities.
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
