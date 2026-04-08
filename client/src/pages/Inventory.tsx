import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import type { Product, Variant } from "@shared/types";

export default function Inventory() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [vForm, setVForm] = useState({ size: "", color: "", stock: 0 });

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  function openProduct(p: Product) {
    setSelectedProduct(p);
  }

  function openNewVariant() {
    setEditingVariant(null);
    setVForm({ size: "M", color: "", stock: 0 });
    setVariantOpen(true);
  }
  function openEditVariant(v: Variant) {
    setEditingVariant(v);
    setVForm({ size: v.size, color: v.color, stock: v.stock });
    setVariantOpen(true);
  }

  const saveVariant = useMutation({
    mutationFn: async () => {
      if (editingVariant) {
        return apiRequest("PATCH", `/api/variants/${editingVariant.id}`, vForm);
      }
      return apiRequest("POST", "/api/variants", { ...vForm, productId: selectedProduct!.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProduct!.id, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setVariantOpen(false);
      toast({ title: editingVariant ? "Variant updated" : "Variant added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteVariant = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/variants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProduct!.id, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Variant deleted" });
    },
  });

  return (
    <div className="space-y-6" data-testid="inventory-page">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Inventory</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Manage stock levels for each product's size and color variants</p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Product list */}
        <div className="space-y-2">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Products</p>
          {products.filter(p => p.status === "active").map(p => (
            <button key={p.id} onClick={() => openProduct(p)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedProduct?.id === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
              data-testid={`inv-product-${p.id}`}>
              <p className="font-body text-sm font-semibold text-foreground truncate">{p.name}</p>
              <p className="font-body text-xs text-muted-foreground">{p.sku}</p>
            </button>
          ))}
        </div>

        {/* Variant table */}
        <Card className="p-6 border-border">
          {selectedProduct ? (
            <VariantTable
              product={selectedProduct}
              onAdd={openNewVariant}
              onEdit={openEditVariant}
              onDelete={(id) => deleteVariant.mutate(id)}
            />
          ) : (
            <div className="text-center py-12">
              <p className="font-body text-muted-foreground">Select a product to manage its inventory</p>
            </div>
          )}
        </Card>
      </div>

      {/* Variant dialog */}
      <Dialog open={variantOpen} onOpenChange={setVariantOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">{editingVariant ? "Edit Variant" : "Add Variant"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveVariant.mutate(); }} className="space-y-4 mt-4">
            <div>
              <label className="font-body text-sm font-medium">Size</label>
              <select className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={vForm.size} onChange={e => setVForm({ ...vForm, size: e.target.value })}>
                {["XS", "S", "M", "L", "XL", "XXL", "Free Size"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-sm font-medium">Color</label>
              <input className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={vForm.color} onChange={e => setVForm({ ...vForm, color: e.target.value })} required placeholder="e.g. Maroon, Navy, Saffron" />
            </div>
            <div>
              <label className="font-body text-sm font-medium">Stock Quantity</label>
              <input type="number" className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={vForm.stock} onChange={e => setVForm({ ...vForm, stock: Number(e.target.value) })} min={0} required />
            </div>
            <Button type="submit" className="w-full font-body" disabled={saveVariant.isPending}>
              {saveVariant.isPending ? "Saving..." : editingVariant ? "Update" : "Add Variant"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VariantTable({ product, onAdd, onEdit, onDelete }: {
  product: Product;
  onAdd: () => void;
  onEdit: (v: Variant) => void;
  onDelete: (id: number) => void;
}) {
  const { data: variantList = [], isLoading } = useQuery<Variant[]>({
    queryKey: ["/api/products", product.id, "variants"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/products/${product.id}/variants`);
      return res.json();
    },
  });

  const totalStock = variantList.reduce((s, v) => s + v.stock, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{product.name}</h3>
          <p className="font-body text-xs text-muted-foreground">{product.sku} · Total stock: {totalStock} units</p>
        </div>
        <Button onClick={onAdd} size="sm" className="font-body" data-testid="add-variant-btn">
          <Plus size={14} className="mr-1" /> Add Variant
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted rounded" />)}
        </div>
      ) : variantList.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-8">No variants yet. Add size/color combinations to track stock.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Size</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Color</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">Stock</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variantList.map(v => (
                <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`variant-row-${v.id}`}>
                  <td className="py-2.5 px-2 font-medium">{v.size}</td>
                  <td className="py-2.5 px-2">{v.color}</td>
                  <td className="py-2.5 px-2 text-center">
                    {v.stock === 0 ? (
                      <Badge variant="destructive" className="text-xs font-body">Out of Stock</Badge>
                    ) : (
                      <span className="font-semibold text-foreground">{v.stock}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(v)} data-testid={`edit-variant-${v.id}`}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(v.id)} data-testid={`delete-variant-${v.id}`}><Trash2 size={14} className="text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
