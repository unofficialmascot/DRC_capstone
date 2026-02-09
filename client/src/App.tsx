import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Applications from "@/pages/Applications";
import ChangeSupervisor from "@/pages/applications/ChangeSupervisor";
import PreTalkApplication from "@/pages/applications/PreTalkApplication";
import ExtensionApplication from "@/pages/applications/ExtensionApplication";
import ReRegistrationApplication from "@/pages/applications/ReRegistrationApplication";
import ThesisSubmission from "@/pages/applications/ThesisSubmission";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/applications" component={() => <Redirect to="/applications/track" />} />
      <Route path="/applications/track" component={Applications} />
      <Route path="/applications/change-supervisor" component={ChangeSupervisor} />
      <Route path="/applications/pre-talk" component={PreTalkApplication} />
      <Route path="/applications/extension" component={ExtensionApplication} />
      <Route path="/applications/re-registration" component={ReRegistrationApplication} />
      <Route path="/applications/thesis-submission" component={ThesisSubmission} />
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
