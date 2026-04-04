import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Package, Layers, AlertTriangle, XCircle } from "lucide-react";

interface DashboardData {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCounts: { name: string; count: number }[];
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="h-28 animate-pulse bg-muted" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Products", value: data.totalProducts, icon: Package, color: "hsl(355 72% 32%)" },
    { label: "Total Stock", value: data.totalStock, icon: Layers, color: "hsl(42 90% 40%)" },
    { label: "Low Stock", value: data.lowStockCount, icon: AlertTriangle, color: "hsl(30 80% 50%)" },
    { label: "Out of Stock", value: data.outOfStockCount, icon: XCircle, color: "hsl(0 70% 50%)" },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Overview of your inventory</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="p-5 border-border" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-foreground">{s.value}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      <Card className="p-6 border-border">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Products by Category</h2>
        <div className="space-y-3">
          {data.categoryCounts.map(c => (
            <div key={c.name} className="flex items-center justify-between" data-testid={`cat-count-${c.name.toLowerCase().replace(/\s/g, "-")}`}>
              <span className="font-body text-sm text-foreground">{c.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (c.count / Math.max(1, data.totalProducts)) * 100)}%`, background: "hsl(355 72% 32%)" }} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground w-6 text-right">{c.count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
