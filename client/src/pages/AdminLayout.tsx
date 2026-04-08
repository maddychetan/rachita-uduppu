import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, Layers, Tag, Settings, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initAdminSession, trackPageView } from "@/lib/analytics";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Inventory", href: "/admin/inventory", icon: Layers },
  { label: "Stock Report", href: "/admin/stock-report", icon: FileSpreadsheet },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Analytics: tag as admin session on mount
  useEffect(() => {
    initAdminSession();
  }, []);

  // Analytics: track admin page navigation
  useEffect(() => {
    trackPageView(location, `Admin — ${location}`);
  }, [location]);

  return (
    <div className="min-h-screen bg-background flex" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card py-6 px-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <svg width="32" height="35" viewBox="0 0 120 132" fill="none">
            <defs><linearGradient id="sGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F5C842"/><stop offset="100%" stopColor="#C9960C"/></linearGradient></defs>
            <circle cx="42" cy="8" r="3.5" fill="#D4A017" opacity=".9"/>
            <path d="M 50 18 C 58 28, 70 38, 72 52 C 74 65, 68 72, 62 80" stroke="#C8930C" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
            <text x="5" y="80" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="88" fontWeight="700" fontStyle="italic" fill="url(#sGold)">R</text>
            <text x="48" y="128" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="72" fontWeight="700" fontStyle="italic" fill="url(#sGold)">U</text>
          </svg>
          <div>
            <p className="font-display text-sm font-semibold text-foreground leading-tight">Admin Panel</p>
            <p className="text-[10px] font-body text-muted-foreground">Rachita Uduppu</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(n => {
            const active = location === n.href;
            return (
              <Link key={n.href} href={n.href}>
                <button className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-body transition-colors ${active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`} data-testid={`nav-${n.label.toLowerCase()}`}>
                  <n.icon size={18} />
                  {n.label}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start font-body text-muted-foreground" data-testid="back-to-store">
              <ArrowLeft size={16} className="mr-2" /> Back to Store
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="24" height="26" viewBox="0 0 120 132" fill="none">
            <defs><linearGradient id="mGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F5C842"/><stop offset="100%" stopColor="#C9960C"/></linearGradient></defs>
            <text x="5" y="80" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="88" fontWeight="700" fontStyle="italic" fill="url(#mGold)">R</text>
            <text x="48" y="128" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="72" fontWeight="700" fontStyle="italic" fill="url(#mGold)">U</text>
          </svg>
          <span className="font-display text-sm font-semibold">Admin</span>
        </div>
        <div className="flex gap-1">
          {NAV.map(n => {
            const active = location === n.href;
            return (
              <Link key={n.href} href={n.href}>
                <button className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                  {n.label}
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="md:p-8 p-4 pt-20 md:pt-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
