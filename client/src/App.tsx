import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Files from "./pages/Files";
import Terminal from "./pages/Terminal";
import Services from "./pages/Services";
import Network from "./pages/Network";
import N8n from "./pages/N8n";
import Processes from "./pages/Processes";
import Login from "./pages/Login";
import { useCallback, useEffect, useState } from "react";

const isStandalone = import.meta.env.VITE_OAUTH_PORTAL_URL === 'disabled';

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/files"} component={Files} />
      <Route path={"/processes"} component={Processes} />
      <Route path={"/terminal"} component={Terminal} />
      <Route path={"/services"} component={Services} />
      <Route path={"/network"} component={Network} />
      <Route path={"/n8n"} component={N8n} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/panel-auth/check", { credentials: "include" });
      const data = await res.json();
      setAuthenticated(data.authenticated);
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (isStandalone) {
      checkAuth();
    } else {
      setAuthenticated(true);
    }
  }, [checkAuth]);

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Ladataan...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AuthGate>
            <Router />
          </AuthGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
