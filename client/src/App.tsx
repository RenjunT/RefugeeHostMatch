import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import RefugeeRegistration from "@/pages/refugee-registration";
import HostRegistration from "@/pages/host-registration";
import Profile from "@/pages/profile";
import Messages from "@/pages/messages";
import Matches from "@/pages/matches";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navigation />}
      
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            {user?.role === 'admin' ? (
              <Route path="/" component={AdminDashboard} />
            ) : user?.profileStatus === 'pending' ? (
              user?.role === 'refugee' ? (
                <Route path="/" component={RefugeeRegistration} />
              ) : (
                <Route path="/" component={HostRegistration} />
              )
            ) : (
              <Route path="/" component={Matches} />
            )}
            
            <Route path="/register/refugee" component={RefugeeRegistration} />
            <Route path="/register/host" component={HostRegistration} />
            <Route path="/profile" component={Profile} />
            <Route path="/messages" component={Messages} />
            <Route path="/matches" component={Matches} />
            <Route path="/admin" component={AdminDashboard} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
