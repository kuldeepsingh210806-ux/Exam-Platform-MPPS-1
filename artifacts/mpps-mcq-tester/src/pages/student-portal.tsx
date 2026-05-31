import { Switch, Route, useRoute } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import StudentDashboard from "./student/dashboard";
import LiveTestsList from "./student/live-tests";
import TakeTest from "./student/take-test";
import UpcomingTests from "./student/upcoming-tests";
import PreviousTests from "./student/previous-tests";
import StudentResults from "./student/results";
import ReviewAnswers from "./student/review-answers";

export default function StudentPortal() {
  const links = [
    { label: "Dashboard", href: "" },
    { label: "Live Tests", href: "/live-tests" },
    { label: "Upcoming Tests", href: "/upcoming" },
    { label: "Previous Tests", href: "/previous" },
    { label: "Results", href: "/results" }
  ];

  const [isTakingTest] = useRoute("/student/live-tests/:testId");

  if (isTakingTest) {
    return (
      <Switch>
        <Route path="/student/live-tests/:testId" component={TakeTest} />
      </Switch>
    );
  }

  return (
    <PortalLayout title="Student Portal" links={links} basePath="/student">
      <Switch>
        <Route path="/student" component={StudentDashboard} />
        <Route path="/student/live-tests" component={LiveTestsList} />
        <Route path="/student/upcoming" component={UpcomingTests} />
        <Route path="/student/previous" component={PreviousTests} />
        <Route path="/student/results" component={StudentResults} />
        <Route path="/student/review/:testId" component={ReviewAnswers} />
        <Route>
          <div className="p-8 text-center text-muted-foreground">Page not found in Student Portal</div>
        </Route>
      </Switch>
    </PortalLayout>
  );
}
