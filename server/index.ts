import express from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { db, getSettings, updateSettings } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Arthi123!@#";
const TOKEN_SECRET = process.env.TOKEN_SECRET || "rachita-secret-key-change-me";

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.options("/{*path}", (_req, res) => res.sendStatus(204));

// ── Auth helpers ──────────────────────────────────────────────────────────────

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
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    return Date.now() - payload.ts < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isAuthenticated(req: express.Request): boolean {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return verifyToken(token);
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: createToken() });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.get("/api/admin/verify", (req, res) => {
  if (isAuthenticated(req)) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ── Categories ────────────────────────────────────────────────────────────────

app.get("/api/categories", (_req, res) => {
  const cats = db.prepare("SELECT * FROM categories ORDER BY sortOrder ASC").all();
  res.json(cats);
});

app.post("/api/categories", requireAuth, (req, res) => {
  const { name, slug, description, sortOrder } = req.body;
  if (!name || !slug) { res.status(400).json({ error: "name and slug are required" }); return; }
  const result = db.prepare(
    "INSERT INTO categories (name, slug, description, sortOrder) VALUES (?, ?, ?, ?)"
  ).run(name, slug, description ?? null, sortOrder ?? 0);
  const cat = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(cat);
});

app.patch("/api/categories/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const cat = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
  const { name, slug, description, sortOrder } = req.body;
  db.prepare(
    "UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), sortOrder = COALESCE(?, sortOrder) WHERE id = ?"
  ).run(name ?? null, slug ?? null, description ?? null, sortOrder ?? null, id);
  res.json(db.prepare("SELECT * FROM categories WHERE id = ?").get(id));
});

app.delete("/api/categories/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM categories WHERE id = ?").run(parseInt(req.params.id));
  res.json({ success: true });
});

// ── Products ──────────────────────────────────────────────────────────────────

app.get("/api/products", (_req, res) => {
  const prods = db.prepare("SELECT * FROM products ORDER BY id DESC").all();
  // Convert SQLite integers to booleans
  const mapped = (prods as any[]).map(p => ({ ...p, featured: p.featured === 1 }));
  res.json(mapped);
});

app.get("/api/products/:id", (req, res) => {
  const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(parseInt(req.params.id));
  if (!prod) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ...(prod as any), featured: (prod as any).featured === 1 });
});

app.post("/api/products", requireAuth, (req, res) => {
  const { name, sku, description, categoryId, price, comparePrice, imageUrl, imageUrl2, imageUrl3, status, featured } = req.body;
  if (!name || !sku) { res.status(400).json({ error: "name and sku are required" }); return; }
  const result = db.prepare(`
    INSERT INTO products (name, sku, description, categoryId, price, comparePrice, imageUrl, imageUrl2, imageUrl3, status, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, sku, description ?? null, categoryId ?? null, price ?? 0, comparePrice ?? null,
         imageUrl ?? null, imageUrl2 ?? null, imageUrl3 ?? null, status ?? "active", featured ? 1 : 0);
  const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid) as any;
  res.status(201).json({ ...prod, featured: prod.featured === 1 });
});

app.patch("/api/products/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
  if (!existing) { res.status(404).json({ error: "Product not found" }); return; }

  const fields: Record<string, any> = { ...existing, ...req.body, id };
  db.prepare(`
    UPDATE products SET name=?, sku=?, description=?, categoryId=?, price=?, comparePrice=?,
    imageUrl=?, imageUrl2=?, imageUrl3=?, status=?, featured=? WHERE id=?
  `).run(fields.name, fields.sku, fields.description, fields.categoryId, fields.price,
         fields.comparePrice, fields.imageUrl, fields.imageUrl2, fields.imageUrl3,
         fields.status, fields.featured ? 1 : 0, id);
  const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
  res.json({ ...prod, featured: prod.featured === 1 });
});

app.delete("/api/products/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare("DELETE FROM variants WHERE productId = ?").run(id);
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  res.json({ success: true });
});

// ── Variants ──────────────────────────────────────────────────────────────────

app.get("/api/products/:id/variants", (req, res) => {
  const variants = db.prepare("SELECT * FROM variants WHERE productId = ?").all(parseInt(req.params.id));
  res.json(variants);
});

app.post("/api/variants", requireAuth, (req, res) => {
  const { productId, size, color, stock } = req.body;
  if (!size || !color) { res.status(400).json({ error: "size and color are required" }); return; }
  const result = db.prepare(
    "INSERT INTO variants (productId, size, color, stock) VALUES (?, ?, ?, ?)"
  ).run(productId, size, color, stock ?? 0);
  res.status(201).json(db.prepare("SELECT * FROM variants WHERE id = ?").get(result.lastInsertRowid));
});

app.patch("/api/variants/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare("SELECT * FROM variants WHERE id = ?").get(id);
  if (!existing) { res.status(404).json({ error: "Variant not found" }); return; }
  const fields = { ...(existing as any), ...req.body, id };
  db.prepare("UPDATE variants SET productId=?, size=?, color=?, stock=? WHERE id=?")
    .run(fields.productId, fields.size, fields.color, fields.stock, id);
  res.json(db.prepare("SELECT * FROM variants WHERE id = ?").get(id));
});

app.delete("/api/variants/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM variants WHERE id = ?").run(parseInt(req.params.id));
  res.json({ success: true });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

app.get("/api/dashboard", (_req, res) => {
  const prods = db.prepare("SELECT * FROM products WHERE status = 'active'").all() as any[];
  const vars = db.prepare("SELECT * FROM variants").all() as any[];
  const cats = db.prepare("SELECT * FROM categories ORDER BY sortOrder ASC").all() as any[];

  const totalStock = vars.reduce((s: number, v: any) => s + v.stock, 0);
  const lowStockCount = vars.filter((v: any) => v.stock > 0 && v.stock <= 3).length;
  const outOfStockCount = vars.filter((v: any) => v.stock === 0).length;

  const categoryCounts = cats.map((c: any) => ({
    name: c.name,
    count: prods.filter((p: any) => p.categoryId === c.id).length,
  }));

  res.json({
    totalProducts: prods.length,
    totalStock,
    lowStockCount,
    outOfStockCount,
    categoryCounts,
  });
});

// ── Images ────────────────────────────────────────────────────────────────────

app.post("/api/upload", requireAuth, (req, res) => {
  const { data: dataUrl, filename } = req.body;
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    res.status(400).json({ error: "Invalid image data" }); return;
  }
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!matches) { res.status(400).json({ error: "Invalid base64 image" }); return; }
  const [, mime, b64] = matches;
  const ext = mime.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
  const key = `img-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const buf = Buffer.from(b64, "base64");
  db.prepare("INSERT INTO images (key, data, mime) VALUES (?, ?, ?)").run(key, buf, mime);
  res.json({ url: `/api/images/${key}` });
});

app.get("/api/images/:key", (req, res) => {
  const row = db.prepare("SELECT data, mime FROM images WHERE key = ?").get(req.params.key) as any;
  if (!row) { res.status(404).json({ error: "Image not found" }); return; }
  res.setHeader("Content-Type", row.mime);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(row.data);
});

// ── Settings ──────────────────────────────────────────────────────────────────

app.get("/api/settings", (_req, res) => {
  res.json(getSettings());
});

app.patch("/api/settings", requireAuth, (req, res) => {
  updateSettings(req.body);
  res.json(getSettings());
});

// ── Serve React frontend ───────────────────────────────────────────────────────

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Rachita Uduppu server running on port ${PORT}`);
});
