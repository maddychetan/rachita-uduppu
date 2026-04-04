import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Tag } from "lucide-react";
import type { Category } from "@shared/types";

const EMPTY = { name: "", slug: "", description: "", sortOrder: 0 };

function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function Categories() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  const { data: products = [] } = useQuery<any[]>({ queryKey: ["/api/products"] });

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  function openNew() {
    setEditing(null);
    setSlugEdited(false);
    setForm({ ...EMPTY, sortOrder: categories.length + 1 });
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setSlugEdited(true);
    setForm({ name: c.name, slug: c.slug, description: c.description || "", sortOrder: c.sortOrder });
    setOpen(true);
  }

  function handleNameChange(name: string) {
    setForm(prev => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : toSlug(name),
    }));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { ...form, description: form.description || null };
      if (editing) return apiRequest("PATCH", `/api/categories/${editing.id}`, body);
      return apiRequest("POST", "/api/categories", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      toast({ title: editing ? "Category updated" : "Category added" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Category deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Cannot delete", description: e.message, variant: "destructive" });
    },
  });

  function handleDelete(cat: Category) {
    const productCount = products.filter((p: any) => p.categoryId === cat.id).length;
    if (productCount > 0) {
      toast({
        title: "Cannot delete",
        description: `Move or delete the ${productCount} product(s) in "${cat.name}" first.`,
        variant: "destructive",
      });
      return;
    }
    deleteMutation.mutate(cat.id);
  }

  return (
    <div className="space-y-6" data-testid="categories-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Categories</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {categories.length} categories · these appear as filter tabs on your storefront
          </p>
        </div>
        <Button onClick={openNew} className="font-body" data-testid="add-category-btn">
          <Plus size={16} className="mr-2" /> Add Category
        </Button>
      </div>

      {isLoading && (
        <p className="font-body text-sm text-muted-foreground">Loading...</p>
      )}

      <div className="space-y-3">
        {sorted.map(cat => {
          const count = products.filter((p: any) => p.categoryId === cat.id).length;
          return (
            <Card
              key={cat.id}
              className="flex items-center gap-4 p-4 border-border"
              data-testid={`category-row-${cat.id}`}
            >
              <GripVertical size={18} className="text-muted-foreground flex-shrink-0" />
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(355 72% 32% / 0.1)" }}>
                <Tag size={18} style={{ color: "hsl(355 72% 32%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-foreground">{cat.name}</h3>
                  <Badge variant="secondary" className="font-body text-xs">{count} products</Badge>
                </div>
                {cat.description && (
                  <p className="font-body text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                )}
                <p className="font-body text-xs text-muted-foreground/60 mt-0.5">slug: {cat.slug}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}
                  data-testid={`edit-category-${cat.id}`}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cat)}
                  data-testid={`delete-category-${cat.id}`}>
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            </Card>
          );
        })}

        {categories.length === 0 && !isLoading && (
          <div className="text-center py-16 text-muted-foreground font-body">
            No categories yet. Add your first one above.
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? `Edit "${editing.name}"` : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }}
            className="space-y-4 mt-2"
          >
            <div>
              <label className="font-body text-sm font-medium text-foreground">Category Name *</label>
              <input
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Kurtis"
                required
                autoFocus
                data-testid="input-category-name"
              />
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground">Slug</label>
              <input
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.slug}
                onChange={e => { setSlugEdited(true); setForm(p => ({ ...p, slug: e.target.value })); }}
                placeholder="kurtis"
                required
                data-testid="input-category-slug"
              />
              <p className="font-body text-xs text-muted-foreground mt-1">Auto-filled from name. Used in URLs.</p>
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground">Description <span className="text-muted-foreground">(optional)</span></label>
              <textarea
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={2}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Short description shown in collection filters"
                data-testid="input-category-description"
              />
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground">Sort Order</label>
              <input
                type="number"
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm font-body bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.sortOrder}
                onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                min={1}
                data-testid="input-category-sort"
              />
              <p className="font-body text-xs text-muted-foreground mt-1">Lower number = appears first in filter tabs.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 font-body" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 font-body" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Add Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
