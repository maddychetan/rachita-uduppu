import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import * as crypto from "crypto";

// ── Auth ─────────────────────────────────────────────────────────────────────
// Password set via ADMIN_PASSWORD environment variable in Netlify.
// Falls back to "RachitaAdmin2026" if not set.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Arthi123!@#";
const TOKEN_SECRET = process.env.TOKEN_SECRET || "rachita-secret-key-change-me";

function createToken(): string {
  const payload = { ts: Date.now(), r: crypto.randomBytes(8).toString("hex") };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [data, sig] = parts;
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
  if (sig !== expected) return false;
  // Token valid for 24 hours
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    return Date.now() - payload.ts < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isAuthenticated(event: HandlerEvent): boolean {
  const auth = event.headers["authorization"] || event.headers["Authorization"] || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return verifyToken(token);
}

function unauthorized(msg = "Unauthorized") {
  return json({ error: msg }, 401);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

interface Product {
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

interface Variant {
  id: number;
  productId: number;
  size: string;
  color: string;
  stock: number;
}

interface NextIds {
  category: number;
  product: number;
  variant: number;
}

interface SiteSettings {
  waNumber: string;
  phone: string;
  email: string;
  location: string;
  aboutLine1: string;
  aboutLine2: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  waNumber: "917829441004",
  phone: "+91 78294 41004",
  email: "hello@rachitauduppu.in",
  location: "Davangere, Karnataka, India",
  aboutLine1: "Rachita Uduppu was born from a deep love for India's textile heritage. Based in Davangere, Karnataka, every piece we create bridges centuries-old craft traditions and contemporary style.",
  aboutLine2: "From Banarasi silk sarees to modern cord sets, we work directly with artisans to bring you garments that are truly one-of-a-kind.",
};

// ── Seed data ────────────────────────────────────────────────────────────────

function buildSeedData(): { categories: Category[]; products: Product[]; variants: Variant[]; nextIds: NextIds } {
  const categories: Category[] = [
    { id: 1, name: "Kurtis", slug: "kurtis", description: "Designer kurtis for every occasion", sortOrder: 1 },
    { id: 2, name: "Two Piece Cord Sets", slug: "two-piece-cord-sets", description: "Matching top and bottom cord sets", sortOrder: 2 },
    { id: 3, name: "Three Piece Cord Sets", slug: "three-piece-cord-sets", description: "Complete three-piece cord ensembles", sortOrder: 3 },
    { id: 4, name: "Sarees", slug: "sarees", description: "Traditional and contemporary sarees", sortOrder: 4 },
    { id: 5, name: "Gowns", slug: "gowns", description: "Elegant gowns for special occasions", sortOrder: 5 },
  ];

  const products: Product[] = [
    {
      id: 1, name: "Embroidered Anarkali Kurti", sku: "KUR-001",
      description: "Flared anarkali kurti with delicate thread embroidery and mirror work. Perfect for festive occasions.",
      categoryId: 1, price: 2200, comparePrice: 2800,
      imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80",
      imageUrl2: null, imageUrl3: null, status: "active", featured: true,
    },
    {
      id: 2, name: "Straight Linen Kurti", sku: "KUR-002",
      description: "Minimal straight-cut linen kurti with wooden buttons. Ideal for everyday elegance.",
      categoryId: 1, price: 1400, comparePrice: null,
      imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
      imageUrl2: null, imageUrl3: null, status: "active", featured: false,
    },
    {
      id: 3, name: "Floral Cord Set — 2 Piece", sku: "CS2-001",
      description: "Cotton floral-print kurta with matching palazzo pants. Breathable and comfortable.",
      categoryId: 2, price: 1800, comparePrice: 2400,
      imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
      imageUrl2: null, imageUrl3: null, status: "active", featured: true,
    },
    {
      id: 4, name: "Embroidered Cord Set — 3 Piece", sku: "CS3-001",
      description: "Kurta, palazzo and dupatta set with chikankari embroidery on pure cotton.",
      categoryId: 3, price: 3200, comparePrice: 4000,
      imageUrl: "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=600&q=80",
      imageUrl2: null, imageUrl3: null, status: "active", featured: true,
    },
    {
      id: 5, name: "Banarasi Silk Saree", sku: "SAR-001",
      description: "Handwoven Banarasi silk saree with intricate gold zari border and pallu.",
      categoryId: 4, price: 8500, comparePrice: 12000,
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
      imageUrl2: null, imageUrl3: null, status: "active", featured: true,
    },
    {
      id: 6, name: "Chanderi Cotton Saree", sku: "SAR-002",
      description: "Lightweight Chanderi saree with tissue weaving and self-border design.",
      categoryId: 4, price: 3800, comparePrice: null,
      imageUrl: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
      imageUrl2: null, imageUrl3: null, status: "active", featured: false,
    },
    {
      id: 7, name: "Silk Gown — Evening", sku: "GWN-001",
      description: "Floor-length silk gown with hand-embellished bodice. Perfect for receptions and gala events.",
      categoryId: 5, price: 6500, comparePrice: 8000,
      imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
      imageUrl2: null, imageUrl3: null, status: "active", featured: false,
    },
  ];

  // Build variants
  const variants: Variant[] = [];
  let vid = 1;
  const sizes = ["S", "M", "L", "XL"];
  const colorSets: Record<string, string[]> = {
    "KUR-001": ["Maroon", "Navy", "Olive"],
    "KUR-002": ["Beige", "White", "Sky Blue"],
    "CS2-001": ["Pink Floral", "Blue Floral"],
    "CS3-001": ["White", "Peach"],
    "SAR-001": ["Red & Gold", "Magenta & Gold"],
    "SAR-002": ["Saffron", "Teal", "Ivory"],
    "GWN-001": ["Wine", "Dusty Rose", "Black"],
  };

  // Use deterministic stock values instead of random
  const stockCycle = [8, 5, 3, 7, 2, 9, 4, 6, 1, 10, 3, 5, 7, 2, 8, 4, 6, 9, 1, 7];
  let stockIdx = 0;

  for (const p of products) {
    const colors = colorSets[p.sku] || ["Default"];
    const useSizes = p.sku.startsWith("SAR") ? ["Free Size"] : sizes;
    for (const color of colors) {
      for (const size of useSizes) {
        variants.push({
          id: vid++,
          productId: p.id,
          size,
          color,
          stock: stockCycle[stockIdx % stockCycle.length],
        });
        stockIdx++;
      }
    }
  }

  const nextIds: NextIds = {
    category: categories.length + 1,
    product: products.length + 1,
    variant: variants.length + 1,
  };

  return { categories, products, variants, nextIds };
}

// ── Store helpers ─────────────────────────────────────────────────────────────

async function getStoreData<T>(store: ReturnType<typeof getStore>, key: string, fallback: T): Promise<T> {
  try {
    const raw = await store.get(key, { type: "text" });
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setStoreData<T>(store: ReturnType<typeof getStore>, key: string, data: T): Promise<void> {
  await store.set(key, JSON.stringify(data));
}

async function ensureSeeded(store: ReturnType<typeof getStore>): Promise<void> {
  // Check if already seeded by looking for categories
  const existing = await store.get("categories", { type: "text" });
  if (existing) return;

  const { categories, products, variants, nextIds } = buildSeedData();
  await Promise.all([
    store.set("categories", JSON.stringify(categories)),
    store.set("products", JSON.stringify(products)),
    store.set("variants", JSON.stringify(variants)),
    store.set("next-ids", JSON.stringify(nextIds)),
  ]);
}

// ── Response helpers ──────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(data),
  };
}

function notFound(msg = "Not found") {
  return json({ error: msg }, 404);
}

function badRequest(msg = "Bad request") {
  return json({ error: msg }, 400);
}

// ── Main handler ──────────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: "",
    };
  }

  // Parse path: event.path is like /api/products or /api/products/3/variants
  // The splat from netlify.toml gives us the part after /api/
  // In Netlify Functions, the full path comes in event.path
  const rawPath = event.path || "";

  // Strip /.netlify/functions/api prefix if present (local dev) or /api prefix
  let path = rawPath
    .replace(/^\/.netlify\/functions\/api/, "")
    .replace(/^\/api/, "");

  // Remove trailing slash
  path = path.replace(/\/$/, "") || "/";

  const method = event.httpMethod;

  // ── Auth routes (no store needed) ──────────────────────────────────────────
  if (path === "/admin/login" && method === "POST") {
    let loginBody: Record<string, unknown> = {};
    try { loginBody = JSON.parse(event.body || "{}"); } catch { return badRequest("Invalid JSON"); }
    if (loginBody.password === ADMIN_PASSWORD) {
      return json({ token: createToken() });
    }
    return json({ error: "Invalid password" }, 401);
  }

  if (path === "/admin/verify" && method === "GET") {
    return isAuthenticated(event) ? json({ ok: true }) : unauthorized();
  }

  // ── Protect all write operations (POST, PATCH, DELETE) ─────────────────────
  if (method !== "GET" && !isAuthenticated(event)) {
    return unauthorized("Login required to modify data");
  }

  // ── Store (only needed for data routes below) ─────────────────────────────
  const store = getStore("rachita-store");

  // Ensure seed data exists on first request
  await ensureSeeded(store);

  let body: Record<string, unknown> = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      return badRequest("Invalid JSON body");
    }
  }

  // ── Route: GET /categories ───────────────────────────────────────────────
  if (path === "/categories" && method === "GET") {
    const cats = await getStoreData<Category[]>(store, "categories", []);
    return json(cats.sort((a, b) => a.sortOrder - b.sortOrder));
  }

  // ── Route: POST /categories ──────────────────────────────────────────────
  if (path === "/categories" && method === "POST") {
    const cats = await getStoreData<Category[]>(store, "categories", []);
    const ids = await getStoreData<NextIds>(store, "next-ids", { category: 1, product: 1, variant: 1 });

    const newCat: Category = {
      id: ids.category,
      name: String(body.name || ""),
      slug: String(body.slug || ""),
      description: body.description != null ? String(body.description) : null,
      sortOrder: Number(body.sortOrder ?? 0),
    };
    if (!newCat.name || !newCat.slug) return badRequest("name and slug are required");

    cats.push(newCat);
    ids.category++;
    await Promise.all([
      setStoreData(store, "categories", cats),
      setStoreData(store, "next-ids", ids),
    ]);
    return json(newCat, 201);
  }

  // ── Route: PATCH /categories/:id ─────────────────────────────────────────
  const catPatchMatch = path.match(/^\/categories\/(\d+)$/);
  if (catPatchMatch && method === "PATCH") {
    const id = parseInt(catPatchMatch[1]);
    const cats = await getStoreData<Category[]>(store, "categories", []);
    const idx = cats.findIndex(c => c.id === id);
    if (idx === -1) return notFound("Category not found");

    cats[idx] = { ...cats[idx], ...body, id } as Category;
    await setStoreData(store, "categories", cats);
    return json(cats[idx]);
  }

  // ── Route: DELETE /categories/:id ────────────────────────────────────────
  if (catPatchMatch && method === "DELETE") {
    const id = parseInt(catPatchMatch[1]);
    let cats = await getStoreData<Category[]>(store, "categories", []);
    cats = cats.filter(c => c.id !== id);
    await setStoreData(store, "categories", cats);
    return json({ success: true });
  }

  // ── Route: GET /products ─────────────────────────────────────────────────
  if (path === "/products" && method === "GET") {
    const prods = await getStoreData<Product[]>(store, "products", []);
    return json(prods.sort((a, b) => b.id - a.id));
  }

  // ── Route: POST /products ────────────────────────────────────────────────
  if (path === "/products" && method === "POST") {
    const prods = await getStoreData<Product[]>(store, "products", []);
    const ids = await getStoreData<NextIds>(store, "next-ids", { category: 1, product: 1, variant: 1 });

    const newProd: Product = {
      id: ids.product,
      name: String(body.name || ""),
      sku: String(body.sku || ""),
      description: body.description != null ? String(body.description) : null,
      categoryId: Number(body.categoryId),
      price: Number(body.price ?? 0),
      comparePrice: body.comparePrice != null ? Number(body.comparePrice) : null,
      imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
      imageUrl2: body.imageUrl2 != null ? String(body.imageUrl2) : null,
      imageUrl3: body.imageUrl3 != null ? String(body.imageUrl3) : null,
      status: String(body.status || "active"),
      featured: Boolean(body.featured ?? false),
    };
    if (!newProd.name || !newProd.sku) return badRequest("name and sku are required");

    prods.push(newProd);
    ids.product++;
    await Promise.all([
      setStoreData(store, "products", prods),
      setStoreData(store, "next-ids", ids),
    ]);
    return json(newProd, 201);
  }

  // ── Route: GET /products/:id ─────────────────────────────────────────────
  const prodIdMatch = path.match(/^\/products\/(\d+)$/);
  if (prodIdMatch && method === "GET") {
    const id = parseInt(prodIdMatch[1]);
    const prods = await getStoreData<Product[]>(store, "products", []);
    const prod = prods.find(p => p.id === id);
    if (!prod) return notFound("Product not found");
    return json(prod);
  }

  // ── Route: PATCH /products/:id ───────────────────────────────────────────
  if (prodIdMatch && method === "PATCH") {
    const id = parseInt(prodIdMatch[1]);
    const prods = await getStoreData<Product[]>(store, "products", []);
    const idx = prods.findIndex(p => p.id === id);
    if (idx === -1) return notFound("Product not found");

    prods[idx] = { ...prods[idx], ...body, id } as Product;
    await setStoreData(store, "products", prods);
    return json(prods[idx]);
  }

  // ── Route: DELETE /products/:id ──────────────────────────────────────────
  if (prodIdMatch && method === "DELETE") {
    const id = parseInt(prodIdMatch[1]);
    let prods = await getStoreData<Product[]>(store, "products", []);
    let vars = await getStoreData<Variant[]>(store, "variants", []);
    prods = prods.filter(p => p.id !== id);
    vars = vars.filter(v => v.productId !== id);
    await Promise.all([
      setStoreData(store, "products", prods),
      setStoreData(store, "variants", vars),
    ]);
    return json({ success: true });
  }

  // ── Route: GET /products/:id/variants ────────────────────────────────────
  const prodVariantsMatch = path.match(/^\/products\/(\d+)\/variants$/);
  if (prodVariantsMatch && method === "GET") {
    const productId = parseInt(prodVariantsMatch[1]);
    const vars = await getStoreData<Variant[]>(store, "variants", []);
    return json(vars.filter(v => v.productId === productId));
  }

  // ── Route: POST /variants ────────────────────────────────────────────────
  if (path === "/variants" && method === "POST") {
    const vars = await getStoreData<Variant[]>(store, "variants", []);
    const ids = await getStoreData<NextIds>(store, "next-ids", { category: 1, product: 1, variant: 1 });

    const newVar: Variant = {
      id: ids.variant,
      productId: Number(body.productId),
      size: String(body.size || ""),
      color: String(body.color || ""),
      stock: Number(body.stock ?? 0),
    };
    if (!newVar.size || !newVar.color) return badRequest("size and color are required");

    vars.push(newVar);
    ids.variant++;
    await Promise.all([
      setStoreData(store, "variants", vars),
      setStoreData(store, "next-ids", ids),
    ]);
    return json(newVar, 201);
  }

  // ── Route: PATCH /variants/:id ───────────────────────────────────────────
  const varIdMatch = path.match(/^\/variants\/(\d+)$/);
  if (varIdMatch && method === "PATCH") {
    const id = parseInt(varIdMatch[1]);
    const vars = await getStoreData<Variant[]>(store, "variants", []);
    const idx = vars.findIndex(v => v.id === id);
    if (idx === -1) return notFound("Variant not found");

    vars[idx] = { ...vars[idx], ...body, id } as Variant;
    await setStoreData(store, "variants", vars);
    return json(vars[idx]);
  }

  // ── Route: DELETE /variants/:id ──────────────────────────────────────────
  if (varIdMatch && method === "DELETE") {
    const id = parseInt(varIdMatch[1]);
    let vars = await getStoreData<Variant[]>(store, "variants", []);
    vars = vars.filter(v => v.id !== id);
    await setStoreData(store, "variants", vars);
    return json({ success: true });
  }

  // ── Route: GET /dashboard ────────────────────────────────────────────────
  if (path === "/dashboard" && method === "GET") {
    const [prods, vars, cats] = await Promise.all([
      getStoreData<Product[]>(store, "products", []),
      getStoreData<Variant[]>(store, "variants", []),
      getStoreData<Category[]>(store, "categories", []),
    ]);

    const activeProducts = prods.filter(p => p.status === "active");
    const totalStock = vars.reduce((s, v) => s + v.stock, 0);
    const lowStockCount = vars.filter(v => v.stock > 0 && v.stock <= 3).length;
    const outOfStockCount = vars.filter(v => v.stock === 0).length;

    const categoryCounts = cats
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        name: c.name,
        count: activeProducts.filter(p => p.categoryId === c.id).length,
      }));

    return json({
      totalProducts: activeProducts.length,
      totalStock,
      lowStockCount,
      outOfStockCount,
      categoryCounts,
    });
  }

  // ── Route: GET /settings ─────────────────────────────────────────────────
  if (path === "/settings" && method === "GET") {
    const settings = await getStoreData<SiteSettings>(store, "settings", DEFAULT_SETTINGS);
    return json(settings);
  }

  // ── Route: PATCH /settings ────────────────────────────────────────────────
  if (path === "/settings" && method === "PATCH") {
    const current = await getStoreData<SiteSettings>(store, "settings", DEFAULT_SETTINGS);
    const updated: SiteSettings = { ...current, ...body } as SiteSettings;
    await setStoreData(store, "settings", updated);
    return json(updated);
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return json({ error: `No route found: ${method} ${path}` }, 404);
};
