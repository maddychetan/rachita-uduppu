import { useState, useEffect, useCallback } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Storefront from "@/pages/Storefront";
import AdminLogin from "@/pages/AdminLogin";
import AdminLayout from "@/pages/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Inventory from "@/pages/Inventory";
import NotFound from "@/pages/not-found";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async () => {
    const token = sessionStorage.getItem("admin-token");
    if (!token) {
      setChecking(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        sessionStorage.removeItem("admin-token");
      }
    } catch {
      // Network error — keep unauthenticated
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  if (checking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
}

function AppRouter() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Storefront} />
        <Route path="/admin">
          <AdminGuard>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </AdminGuard>
        </Route>
        <Route path="/admin/products">
          <AdminGuard>
            <AdminLayout>
              <Products />
            </AdminLayout>
          </AdminGuard>
        </Route>
        <Route path="/admin/inventory">
          <AdminGuard>
            <AdminLayout>
              <Inventory />
            </AdminLayout>
          </AdminGuard>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
