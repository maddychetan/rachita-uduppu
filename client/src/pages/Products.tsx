import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image } from "lucide-react";
import type { Product, Category } from "@shared/types";

export default function Products() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const catMap = new Map(categories.map(c => [c.id, c.name]));

  // Form state
  const [form, setForm] = useState({
    name: "", sku: "", description: "", categoryId: 0, price: 0, comparePrice: 0,
    imageUrl: "", imageUrl2: "", imageUrl3: "", status: "active", featured: false,
  });

  function openNew() {
    setEditing(null);
    setForm({ name: "", sku: "", description: "", categoryId: categories[0]?.id || 0, price: 0, comparePrice: 0, imageUrl: "", imageUrl2: "", imageUrl3: "", status: "active", featured: false });
    setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, description: p.description || "", categoryId: p.categoryId,
      price: p.price, comparePrice: p.comparePrice || 0,
      imageUrl: p.imageUrl || "", imageUrl2: p.imageUrl2 || "", imageUrl3: p.imageUrl3 || "",
      status: p.status, featured: !!p.featured,
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { ...form, comparePrice: form.comparePrice || null, imageUrl2: form.imageUrl2 || null, imageUrl3: form.imageUrl3 || null };
      if (editing) {
        return apiRequest("PATCH", `/api/products/${editing.id}`, body);
      }
      return apiRequest("POST", "/api/products", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      toast({ title: editing ? "Product updated" : "Product created" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Product deleted" });
    },
  });

  return (
    <div className="space-y-6" data-testid="products-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Products</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{products.length} products</p>
        </div>
        <Button onClick={openNew} className="font-body" data-testid="add-product-btn">
          <Plus size={16} className="mr-2" /> Add Product
        </Button>
      </div>

      <div className="grid gap-4">
        {products.map(p => (
          <Card key={p.id} className="flex items-center gap-4 p-4 border-border" data-testid={`product-row-${p.id}`}>
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Image size={20} className="text-muted-foreground" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-semibold text-foreground truncate">{p.name}</h3>
                {p.featured && <Badge variant="secondary" className="text-xs font-body">Featured</Badge>}
              </div>
              <p className="font-body text-xs text-muted-foreground">{p.sku} · {catMap.get(p.categoryId) || "Unknown"}</p>
              <p className="font-body text-sm font-semibold mt-1">₹{p.price.toLocaleString("en-IN")}
                {p.comparePrice ? <span className="text-muted-foreground line-through ml-2 font-normal">₹{p.comparePrice.toLocaleString("en-IN")}</span> : null}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.status === "active" ? "default" : "secondary"} className="font-body text-xs capitalize">{p.status}</Badge>
              <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`}><Pencil size={16} /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} data-testid={`delete-product-${p.id}`}><Trash2 size={16} className="text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4 mt-4">
            <div>
              <label className="font-body text-sm font-medium text-foreground">Name</label>
              <input className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground">SKU</label>
                <input className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground">Category</label>
                <select className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: Number(e.target.value) })} required>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground">Description</label>
              <textarea className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground">Price (₹)</label>
                <input type="number" className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} required min={0} />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground">Compare Price (₹)</label>
                <input type="number" className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={form.comparePrice} onChange={e => setForm({ ...form, comparePrice: Number(e.target.value) })} min={0} />
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground">Main Image URL</label>
              <input className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground">Image 2 URL</label>
                <input className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={form.imageUrl2} onChange={e => setForm({ ...form, imageUrl2: e.target.value })} placeholder="optional" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground">Image 3 URL</label>
                <input className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background" value={form.imageUrl3} onChange={e => setForm({ ...form, imageUrl3: e.target.value })} placeholder="optional" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="rounded" />
                <span className="font-body text-sm">Featured</span>
              </label>
              <div>
                <select className="px-3 py-1.5 border border-border rounded-lg text-sm font-body bg-background" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full font-body" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editing ? "Update Product" : "Create Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
