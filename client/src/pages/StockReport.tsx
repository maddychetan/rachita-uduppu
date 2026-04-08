import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, Package, Layers, Search } from "lucide-react";
import * as XLSX from "xlsx";
import type { Product, Variant, Category } from "@shared/types";

export default function StockReport() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "out-of-stock">("all");

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  // Fetch all variants for all products
  const activeProducts = products.filter(p => p.status === "active");
  const productIds = activeProducts.map(p => p.id);

  const { data: allVariantsMap = {} } = useQuery<Record<number, Variant[]>>({
    queryKey: ["/api/all-variants", ...productIds],
    queryFn: async () => {
      const map: Record<number, Variant[]> = {};
      await Promise.all(
        activeProducts.map(async (p) => {
          const res = await apiRequest("GET", `/api/products/${p.id}/variants`);
          map[p.id] = await res.json();
        })
      );
      return map;
    },
    enabled: activeProducts.length > 0,
  });

  // Build flat data for display
  const flatRows = activeProducts.flatMap(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    const variants = allVariantsMap[p.id] || [];
    if (variants.length === 0) {
      return [{
        product: p,
        category: cat,
        variant: null as Variant | null,
        totalStock: 0,
      }];
    }
    return variants.map(v => ({
      product: p,
      category: cat,
      variant: v,
      totalStock: variants.reduce((s, v2) => s + v2.stock, 0),
    }));
  });

  // Apply filters
  const filtered = flatRows.filter(row => {
    if (categoryFilter !== "all" && row.product.categoryId !== categoryFilter) return false;
    if (stockFilter === "in-stock" && row.variant && row.variant.stock === 0) return false;
    if (stockFilter === "out-of-stock" && row.variant && row.variant.stock > 0) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        row.product.name.toLowerCase().includes(q) ||
        row.product.sku.toLowerCase().includes(q) ||
        (row.category?.name || "").toLowerCase().includes(q) ||
        (row.variant?.color || "").toLowerCase().includes(q) ||
        (row.variant?.size || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Summary stats
  const allVariants = Object.values(allVariantsMap).flat();
  const totalStock = allVariants.reduce((s, v) => s + v.stock, 0);
  const outOfStock = allVariants.filter(v => v.stock === 0).length;
  const totalVariants = allVariants.length;

  // Group by product for summary
  const productSummary = activeProducts.map(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    const variants = allVariantsMap[p.id] || [];
    const total = variants.reduce((s, v) => s + v.stock, 0);
    const oos = variants.filter(v => v.stock === 0).length;
    return { product: p, category: cat, variants, totalStock: total, outOfStock: oos };
  });

  function downloadExcel() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary by Product
    const summaryData = productSummary.map(row => ({
      "Product Name": row.product.name,
      "SKU": row.product.sku,
      "Category": row.category?.name || "—",
      "Price (₹)": row.product.price,
      "Compare Price (₹)": row.product.comparePrice || "",
      "Total Variants": row.variants.length,
      "Total Stock": row.totalStock,
      "Out of Stock Variants": row.outOfStock,
      "Status": row.product.status,
      "Featured": row.product.featured ? "Yes" : "No",
    }));
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    // Set column widths
    ws1["!cols"] = [
      { wch: 30 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 16 },
      { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "Product Summary");

    // Sheet 2: Full Variant Details
    const detailData = activeProducts.flatMap(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      const variants = allVariantsMap[p.id] || [];
      return variants.map(v => ({
        "Product Name": p.name,
        "SKU": p.sku,
        "Category": cat?.name || "—",
        "Size": v.size,
        "Color": v.color,
        "Stock": v.stock,
        "Stock Status": v.stock === 0 ? "Out of Stock" : "In Stock",
        "Price (₹)": p.price,
        "Compare Price (₹)": p.comparePrice || "",
      }));
    });
    const ws2 = XLSX.utils.json_to_sheet(detailData);
    ws2["!cols"] = [
      { wch: 30 }, { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 16 },
      { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "Variant Details");

    // Sheet 3: Category-wise Summary
    const catData = categories.map(cat => {
      const catProducts = activeProducts.filter(p => p.categoryId === cat.id);
      const catVariants = catProducts.flatMap(p => allVariantsMap[p.id] || []);
      const catStock = catVariants.reduce((s, v) => s + v.stock, 0);
      const catOOS = catVariants.filter(v => v.stock === 0).length;
      return {
        "Category": cat.name,
        "Total Products": catProducts.length,
        "Total Variants": catVariants.length,
        "Total Stock": catStock,
        "Out of Stock Variants": catOOS,
      };
    });
    const ws3 = XLSX.utils.json_to_sheet(catData);
    ws3["!cols"] = [
      { wch: 25 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, "Category Summary");

    // Download
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(wb, `Rachita_Uduppu_Stock_Report_${dateStr}.xlsx`);
  }

  return (
    <div className="space-y-6" data-testid="stock-report-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Stock Report</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Full inventory overview with download</p>
        </div>
        <Button onClick={downloadExcel} className="font-body gap-2" data-testid="download-excel-btn">
          <Download size={16} />
          Download Excel
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
              <Package size={16} className="text-primary" />
            </div>
            <span className="font-body text-xs text-muted-foreground">Products</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{activeProducts.length}</p>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10">
              <Layers size={16} className="text-amber-600" />
            </div>
            <span className="font-body text-xs text-muted-foreground">Total Variants</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{totalVariants}</p>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/10">
              <FileSpreadsheet size={16} className="text-green-600" />
            </div>
            <span className="font-body text-xs text-muted-foreground">Total Stock</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{totalStock}</p>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10">
              <Package size={16} className="text-red-500" />
            </div>
            <span className="font-body text-xs text-muted-foreground">Out of Stock</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{outOfStock}</p>
        </Card>
      </div>

      {/* Product-wise stock overview */}
      <Card className="p-6 border-border">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Product Stock Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Product</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">SKU</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Category</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">Price</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">Variants</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">Total Stock</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">Out of Stock</th>
              </tr>
            </thead>
            <tbody>
              {productSummary.map(row => (
                <tr key={row.product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-2 font-medium">{row.product.name}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{row.product.sku}</td>
                  <td className="py-2.5 px-2">
                    <Badge variant="outline" className="text-xs font-body">{row.category?.name || "—"}</Badge>
                  </td>
                  <td className="py-2.5 px-2 text-center">₹{row.product.price.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 px-2 text-center">{row.variants.length}</td>
                  <td className="py-2.5 px-2 text-center font-semibold">{row.totalStock}</td>
                  <td className="py-2.5 px-2 text-center">
                    {row.outOfStock > 0 ? (
                      <Badge variant="destructive" className="text-xs font-body">{row.outOfStock}</Badge>
                    ) : (
                      <span className="text-green-600 font-medium">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detailed variant view with filters */}
      <Card className="p-6 border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Detailed Variant Stock</h2>
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="pl-8 pr-3 py-1.5 border border-border rounded-lg text-sm font-body bg-background w-48"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Category filter */}
            <select
              className="px-3 py-1.5 border border-border rounded-lg text-sm font-body bg-background"
              value={categoryFilter === "all" ? "all" : String(categoryFilter)}
              onChange={e => setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            {/* Stock filter */}
            <select
              className="px-3 py-1.5 border border-border rounded-lg text-sm font-body bg-background"
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value as "all" | "in-stock" | "out-of-stock")}
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Product</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">SKU</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Category</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Size</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Color</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">Stock</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={`${row.product.id}-${row.variant?.id || 0}-${idx}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-2 font-medium">{row.product.name}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{row.product.sku}</td>
                  <td className="py-2.5 px-2">
                    <Badge variant="outline" className="text-xs font-body">{row.category?.name || "—"}</Badge>
                  </td>
                  <td className="py-2.5 px-2">{row.variant?.size || "—"}</td>
                  <td className="py-2.5 px-2">{row.variant?.color || "—"}</td>
                  <td className="py-2.5 px-2 text-center font-semibold">
                    {row.variant ? row.variant.stock : 0}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.variant ? (
                      row.variant.stock === 0 ? (
                        <Badge variant="destructive" className="text-xs font-body">Out of Stock</Badge>
                      ) : (
                        <Badge className="text-xs font-body bg-green-100 text-green-700 hover:bg-green-100">In Stock</Badge>
                      )
                    ) : (
                      <Badge variant="secondary" className="text-xs font-body">No Variants</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">No matching variants found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-body">
            Showing {filtered.length} of {flatRows.length} variants
          </p>
        </div>
      </Card>
    </div>
  );
}
