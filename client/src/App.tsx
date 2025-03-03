import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import EmployeeManagementPage from "@/pages/employee-management";
import ThanksPage from "@/pages/thanks-page";
import ApprovalPage from "@/pages/approval-page";
import ThanksManagementPage from "@/pages/admin/thanks-management";
import RankingsPage from "@/pages/rankings-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <ProtectedRoute path="/thanks" component={ThanksPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/employees" component={EmployeeManagementPage} />
      <ProtectedRoute path="/approvals" component={ApprovalPage} />
      <ProtectedRoute path="/admin/thanks" component={ThanksManagementPage} />
      <ProtectedRoute path="/rankings" component={RankingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;