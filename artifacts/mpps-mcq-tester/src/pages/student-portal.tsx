import { Switch, Route, useRoute } from "wouter";
import { LayoutDashboard, Zap, CalendarClock, History, BarChart2, Bell } from "lucide-react";
import { PortalLayout } from "@/components/portal-layout";
import StudentDashboard from "./student/dashboard";
import LiveTests from "./student/live-tests";
import TakeTest from "./student/take-test";
import UpcomingTests from "./student/upcoming-tests";
import PreviousTests from "./student/previous-tests";
import StudentResults from "./student/results";
import ReviewAnswers from "./student/review-answers";
import StudentNotices from "./student/notices";

export default function StudentPortal() {
  const [isTakingTest] = useRoute("/student/take/:testId");

  const links = [
    { label: "Dashboard",      href: "",          icon: LayoutDashboard },
    { label: "Live Tests",     href: "/live",     icon: Zap             },
    { label: "Upcoming Tests", href: "/upcoming", icon: CalendarClock   },
    { label: "Previous Tests", href: "/previous", icon: History         },
    { label: "My Results",     href: "/results",  icon: BarChart2       },
    { label: "Notices",        href: "/notices",  icon: Bell            },
  ];

  if (isTakingTest) {
    return (
      <Switch>
        <Route path="/student/take/:testId" component={TakeTest} />
      </Switch>
    );
  }

  return (
    <PortalLayout title="Student Portal" links={links} basePath="/student" noticeAudience="Students">
      <Switch>
        <Route path="/student"                 component={StudentDashboard} />
        <Route path="/student/live"            component={LiveTests}        />
        <Route path="/student/upcoming"        component={UpcomingTests}    />
        <Route path="/student/previous"        component={PreviousTests}    />
        <Route path="/student/results"         component={StudentResults}   />
        <Route path="/student/review/:testId"  component={ReviewAnswers}    />
        <Route path="/student/notices"         component={StudentNotices}   />
        <Route><div className="p-8 text-center text-muted-foreground">Page not found</div></Route>
      </Switch>
    </PortalLayout>
  );
}
