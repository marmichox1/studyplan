import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Calendar from "@/pages/Calendar";
import StudySessions from "@/pages/StudySessions";
import Exams from "@/pages/Exams";
import Profile from "@/pages/Profile";
import Subjects from "@/pages/Subjects";
import AuthPage from "@/pages/auth-page";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      <ProtectedRoute path="/calendar" component={() => (
        <AppLayout>
          <Calendar />
        </AppLayout>
      )} />
      <ProtectedRoute path="/sessions" component={() => (
        <AppLayout>
          <StudySessions />
        </AppLayout>
      )} />
      {/* Progress page removed as requested */}
      <ProtectedRoute path="/exams" component={() => (
        <AppLayout>
          <Exams />
        </AppLayout>
      )} />
      <ProtectedRoute path="/profile" component={() => (
        <AppLayout>
          <Profile />
        </AppLayout>
      )} />
      <ProtectedRoute path="/subjects" component={() => (
        <AppLayout>
          <Subjects />
        </AppLayout>
      )} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Router />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
