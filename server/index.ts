import express from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { db, initDb, getSettings, updateSettings } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Arthi123!@#";
const TOKEN_SECRET = process.env.TOKEN_SECRET || "rachita-secret-key-change-me";

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

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

app.get("/api/categories", async (_req, res) => {
  try {
    const result = await db.execute("SELECT * FROM categories ORDER BY sortOrder ASC");
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/categories", requireAuth, async (req, res) => {
  try {
    const { name, slug, description, sortOrder } = req.body;
    if (!name || !slug) { res.status(400).json({ error: "name and slug are required" }); return; }
    const result = await db.execute({
      sql: "INSERT INTO categories (name, slug, description, sortOrder) VALUES (?, ?, ?, ?)",
      args: [name, slug, description ?? null, sortOrder ?? 0],
    });
    const cat = await db.execute({ sql: "SELECT * FROM categories WHERE id = ?", args: [Number(result.lastInsertRowid)] });
    res.status(201).json(cat.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/categories/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.execute({ sql: "SELECT * FROM categories WHERE id = ?", args: [id] });
    if (!existing.rows[0]) { res.status(404).json({ error: "Category not found" }); return; }
    const { name, slug, description, sortOrder } = req.body;
    await db.execute({
      sql: "UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), sortOrder = COALESCE(?, sortOrder) WHERE id = ?",
      args: [name ?? null, slug ?? null, description ?? null, sortOrder ?? null, id],
    });
    const updated = await db.execute({ sql: "SELECT * FROM categories WHERE id = ?", args: [id] });
    res.json(updated.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/categories/:id", requireAuth, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [parseInt(req.params.id)] });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Products ──────────────────────────────────────────────────────────────────

app.get("/api/products", async (_req, res) => {
  try {
    const result = await db.execute("SELECT * FROM products ORDER BY id DESC");
    const mapped = result.rows.map((p: any) => ({ ...p, featured: p.featured === 1 }));
    res.json(mapped);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await db.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [parseInt(req.params.id)] });
    const prod = result.rows[0] as any;
    if (!prod) { res.status(404).json({ error: "Product not found" }); return; }
    res.json({ ...prod, featured: prod.featured === 1 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/products", requireAuth, async (req, res) => {
  try {
    const { name, sku, description, categoryId, price, comparePrice, imageUrl, imageUrl2, imageUrl3, status, featured } = req.body;
    if (!name || !sku) { res.status(400).json({ error: "name and sku are required" }); return; }
    const result = await db.execute({
      sql: `INSERT INTO products (name, sku, description, categoryId, price, comparePrice, imageUrl, imageUrl2, imageUrl3, status, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [name, sku, description ?? null, categoryId ?? null, price ?? 0, comparePrice ?? null,
             imageUrl ?? null, imageUrl2 ?? null, imageUrl3 ?? null, status ?? "active", featured ? 1 : 0],
    });
    const prod = await db.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [Number(result.lastInsertRowid)] });
    const p = prod.rows[0] as any;
    res.status(201).json({ ...p, featured: p.featured === 1 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingRes = await db.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] });
    const existing = existingRes.rows[0] as any;
    if (!existing) { res.status(404).json({ error: "Product not found" }); return; }
    const fields = { ...existing, ...req.body, id };
    await db.execute({
      sql: `UPDATE products SET name=?, sku=?, description=?, categoryId=?, price=?, comparePrice=?,
            imageUrl=?, imageUrl2=?, imageUrl3=?, status=?, featured=? WHERE id=?`,
      args: [fields.name, fields.sku, fields.description, fields.categoryId, fields.price,
             fields.comparePrice, fields.imageUrl, fields.imageUrl2, fields.imageUrl3,
             fields.status, fields.featured ? 1 : 0, id],
    });
    const updated = await db.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] });
    const p = updated.rows[0] as any;
    res.json({ ...p, featured: p.featured === 1 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute({ sql: "DELETE FROM variants WHERE productId = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Variants ──────────────────────────────────────────────────────────────────

app.get("/api/products/:id/variants", async (req, res) => {
  try {
    const result = await db.execute({ sql: "SELECT * FROM variants WHERE productId = ?", args: [parseInt(req.params.id)] });
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/variants", requireAuth, async (req, res) => {
  try {
    const { productId, size, color, stock } = req.body;
    if (!size || !color) { res.status(400).json({ error: "size and color are required" }); return; }
    const result = await db.execute({
      sql: "INSERT INTO variants (productId, size, color, stock) VALUES (?, ?, ?, ?)",
      args: [productId, size, color, stock ?? 0],
    });
    const variant = await db.execute({ sql: "SELECT * FROM variants WHERE id = ?", args: [Number(result.lastInsertRowid)] });
    res.status(201).json(variant.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/variants/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingRes = await db.execute({ sql: "SELECT * FROM variants WHERE id = ?", args: [id] });
    const existing = existingRes.rows[0] as any;
    if (!existing) { res.status(404).json({ error: "Variant not found" }); return; }
    const fields = { ...existing, ...req.body, id };
    await db.execute({
      sql: "UPDATE variants SET productId=?, size=?, color=?, stock=? WHERE id=?",
      args: [fields.productId, fields.size, fields.color, fields.stock, id],
    });
    const updated = await db.execute({ sql: "SELECT * FROM variants WHERE id = ?", args: [id] });
    res.json(updated.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/variants/:id", requireAuth, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM variants WHERE id = ?", args: [parseInt(req.params.id)] });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

app.get("/api/dashboard", async (_req, res) => {
  try {
    const prodsRes = await db.execute("SELECT * FROM products WHERE status = 'active'");
    const varsRes = await db.execute("SELECT * FROM variants");
    const catsRes = await db.execute("SELECT * FROM categories ORDER BY sortOrder ASC");

    const prods = prodsRes.rows as any[];
    const vars = varsRes.rows as any[];
    const cats = catsRes.rows as any[];

    const totalStock = vars.reduce((s: number, v: any) => s + Number(v.stock), 0);
    const lowStockCount = vars.filter((v: any) => Number(v.stock) > 0 && Number(v.stock) <= 3).length;
    const outOfStockCount = vars.filter((v: any) => Number(v.stock) === 0).length;

    const categoryCounts = cats.map((c: any) => ({
      name: c.name,
      count: prods.filter((p: any) => p.categoryId === c.id).length,
    }));

    res.json({ totalProducts: prods.length, totalStock, lowStockCount, outOfStockCount, categoryCounts });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Images ────────────────────────────────────────────────────────────────────

app.post("/api/upload", requireAuth, async (req, res) => {
  try {
    const { data: dataUrl } = req.body;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      res.status(400).json({ error: "Invalid image data" }); return;
    }
    const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches) { res.status(400).json({ error: "Invalid base64 image" }); return; }
    const [, mime, b64] = matches;
    const ext = mime.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
    const key = `img-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const buf = Buffer.from(b64, "base64");
    await db.execute({
      sql: "INSERT INTO images (key, data, mime) VALUES (?, ?, ?)",
      args: [key, buf, mime],
    });
    res.json({ url: `/api/images/${key}` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/images/:key", async (req, res) => {
  try {
    const result = await db.execute({ sql: "SELECT data, mime FROM images WHERE key = ?", args: [req.params.key] });
    const row = result.rows[0] as any;
    if (!row) { res.status(404).json({ error: "Image not found" }); return; }
    res.setHeader("Content-Type", row.mime);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Settings ──────────────────────────────────────────────────────────────────

app.get("/api/settings", async (_req, res) => {
  try {
    res.json(await getSettings());
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/settings", requireAuth, async (req, res) => {
  try {
    await updateSettings(req.body);
    res.json(await getSettings());
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Serve React frontend ───────────────────────────────────────────────────────

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Rachita Uduppu server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
