import { z } from "zod";

// ── Plain TypeScript Interfaces ───────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  categoryId: number;
  price: number;
  comparePrice: number | null;
  imageUrl: string | null;
  imageUrl2: string | null;
  imageUrl3: string | null;
  status: string;
  featured: boolean;
}

export interface Variant {
  id: number;
  productId: number;
  size: string;
  color: string;
  stock: number;
}

// ── Insert Types (no id) ──────────────────────────────────────────────────────

export type InsertCategory = Omit<Category, "id">;
export type InsertProduct = Omit<Product, "id">;
export type InsertVariant = Omit<Variant, "id">;

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().nullable().optional(),
  categoryId: z.number().int(),
  price: z.number(),
  comparePrice: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageUrl2: z.string().nullable().optional(),
  imageUrl3: z.string().nullable().optional(),
  status: z.string().default("active"),
  featured: z.boolean().default(false),
});

export const insertVariantSchema = z.object({
  productId: z.number().int(),
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.number().int().default(0),
});
