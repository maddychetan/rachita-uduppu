import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Storefront from "@/pages/Storefront";
import AdminLayout from "@/pages/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Inventory from "@/pages/Inventory";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Storefront} />
        <Route path="/admin">
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </Route>
        <Route path="/admin/products">
          <AdminLayout>
            <Products />
          </AdminLayout>
        </Route>
        <Route path="/admin/inventory">
          <AdminLayout>
            <Inventory />
          </AdminLayout>
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
