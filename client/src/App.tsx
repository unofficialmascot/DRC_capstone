import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import ResearchProgress from "@/pages/ResearchProgress";
import Applications from "@/pages/Applications";
import ChangeSupervisor from "@/pages/applications/ChangeSupervisor";
import PreTalkApplication from "@/pages/applications/PreTalkApplication";
import ExtensionApplication from "@/pages/applications/ExtensionApplication";
import ReRegistrationApplication from "@/pages/applications/ReRegistrationApplication";
import ThesisSubmission from "@/pages/applications/ThesisSubmission";
import { DocHubPage } from "@/pages/DocHubPage";
import { NoticesPage } from "@/pages/NoticesPage";
import { GenericInfoPage } from "@/pages/GenericInfoPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/research" component={ResearchProgress} />
      <Route path="/fees" component={() => <GenericInfoPage title="Fee Details" description="Fee records and payment status will appear here." />} />
      <Route path="/applications" component={() => <Redirect to="/applications/track" />} />
      <Route path="/applications/track" component={Applications} />
      <Route path="/applications/change-supervisor" component={ChangeSupervisor} />
      <Route path="/applications/pre-talk" component={PreTalkApplication} />
      <Route path="/applications/extension" component={ExtensionApplication} />
      <Route path="/applications/re-registration" component={ReRegistrationApplication} />
      <Route path="/applications/thesis-submission" component={ThesisSubmission} />
      <Route path="/academic" component={() => <GenericInfoPage title="Academic Progress" description="Academic milestones and coursework progress will appear here." />} />
      <Route path="/doc-hub" component={DocHubPage} />
      <Route path="/notices" component={NoticesPage} />
      <Route path="/repository" component={() => <GenericInfoPage title="Repository" description="Research repository integrations will appear here." />} />
      <Route path="/support" component={() => <GenericInfoPage title="Support" description="Support resources and issue tracking will appear here." />} />
      <Route path="/rac-reports" component={() => <GenericInfoPage title="RAC Reports" description="RAC reports and review summaries will appear here." />} />
      <Route path="/biometric" component={() => <GenericInfoPage title="Biometric" description="Biometric attendance insights will appear here." />} />
      <Route path="/lpc" component={() => <GenericInfoPage title="LPC" description="LPC workflow and approvals will appear here." />} />
      <Route path="/reviews" component={() => <GenericInfoPage title="RAC Reviews" description="Pending and completed RAC reviews will appear here." />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
