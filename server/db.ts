import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || 
  (process.env.NODE_ENV === "production" ? "/data/rachita.db" : path.join(__dirname, "..", "data", "rachita.db"));

// Ensure data directory exists
import fs from "fs";
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sortOrder INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    description TEXT,
    categoryId INTEGER,
    price REAL NOT NULL DEFAULT 0,
    comparePrice REAL,
    imageUrl TEXT,
    imageUrl2 TEXT,
    imageUrl3 TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    featured INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS images (
    key TEXT PRIMARY KEY,
    data BLOB NOT NULL,
    mime TEXT NOT NULL,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

// ── Seed data ─────────────────────────────────────────────────────────────────

function seed() {
  const count = (db.prepare("SELECT COUNT(*) as n FROM categories").get() as any).n;
  if (count > 0) return; // Already seeded

  const insertCat = db.prepare(
    "INSERT INTO categories (name, slug, description, sortOrder) VALUES (?, ?, ?, ?)"
  );
  const insertProd = db.prepare(`
    INSERT INTO products (name, sku, description, categoryId, price, comparePrice, imageUrl, imageUrl2, imageUrl3, status, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertVar = db.prepare(
    "INSERT INTO variants (productId, size, color, stock) VALUES (?, ?, ?, ?)"
  );

  const seedAll = db.transaction(() => {
    const cats = [
      [1, "Kurtis", "kurtis", "Designer kurtis for every occasion", 1],
      [2, "Two Piece Cord Sets", "two-piece-cord-sets", "Matching top and bottom cord sets", 2],
      [3, "Three Piece Cord Sets", "three-piece-cord-sets", "Complete three-piece cord ensembles", 3],
      [4, "Sarees", "sarees", "Traditional and contemporary sarees", 4],
      [5, "Gowns", "gowns", "Elegant gowns for special occasions", 5],
    ];
    for (const [, name, slug, desc, order] of cats)
      insertCat.run(name, slug, desc, order);

    const products = [
      ["Embroidered Anarkali Kurti", "KUR-001", "Flared anarkali kurti with delicate thread embroidery and mirror work. Perfect for festive occasions.", 1, 2200, 2800, "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80", null, null, "active", 1],
      ["Straight Linen Kurti", "KUR-002", "Minimal straight-cut linen kurti with wooden buttons. Ideal for everyday elegance.", 1, 1400, null, "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80", null, null, "active", 0],
      ["Floral Cord Set — 2 Piece", "CS2-001", "Cotton floral-print kurta with matching palazzo pants. Breathable and comfortable.", 2, 1800, 2400, "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80", null, null, "active", 1],
      ["Embroidered Cord Set — 3 Piece", "CS3-001", "Kurta, palazzo and dupatta set with chikankari embroidery on pure cotton.", 3, 3200, 4000, "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=600&q=80", null, null, "active", 1],
      ["Banarasi Silk Saree", "SAR-001", "Handwoven Banarasi silk saree with intricate gold zari border and pallu.", 4, 8500, 12000, "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80", null, null, "active", 1],
      ["Chanderi Cotton Saree", "SAR-002", "Lightweight Chanderi saree with tissue weaving and self-border design.", 4, 3800, null, "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80", null, null, "active", 0],
      ["Silk Gown — Evening", "GWN-001", "Floor-length silk gown with hand-embellished bodice. Perfect for receptions and gala events.", 5, 6500, 8000, "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80", null, null, "active", 0],
    ];

    const colorSets: Record<string, string[]> = {
      "KUR-001": ["Rose", "Mint Green", "Ivory"],
      "KUR-002": ["Off White", "Sky Blue"],
      "CS2-001": ["Peach", "Lavender"],
      "CS3-001": ["Blush Pink", "Sage Green"],
      "SAR-001": ["Red Gold", "Maroon Gold"],
      "SAR-002": ["Pastel Yellow", "Silver Grey"],
      "GWN-001": ["Champagne", "Deep Navy"],
    };

    const stockCycle = [8, 5, 3, 7, 2, 9, 4, 6, 1, 10, 3, 5, 7, 2, 8, 4, 6, 9, 1, 7];
    let stockIdx = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const result = insertProd.run(...(p as any[]));
      const productId = result.lastInsertRowid as number;
      const sku = p[1] as string;
      const colors = colorSets[sku] || ["Default"];
      const sizes = sku.startsWith("SAR") ? ["Free Size"] : ["S", "M", "L", "XL"];
      for (const color of colors) {
        for (const size of sizes) {
          insertVar.run(productId, size, color, stockCycle[stockIdx % stockCycle.length]);
          stockIdx++;
        }
      }
    }

    // Default settings
    const defaultSettings = {
      waNumber: "917829441004",
      phone: "+91 78294 41004",
      email: "hello@rachitauduppu.in",
      location: "Davangere, Karnataka, India",
      heroHeading: "Rachita Uduppu",
      heroTagline: "Crafted with Tradition",
      heroDescription: "Handcrafted sarees, kurtis, cord sets & gowns — each piece a celebration of India's textile heritage.",
      aboutTitle: "Woven with Tradition, Worn with Pride",
      aboutSubtitle: "Crafted with Tradition",
      aboutLine1: "Rachita Uduppu was born from a deep love for India's textile heritage. Based in Davangere, Karnataka, every piece we create bridges centuries-old craft traditions and contemporary style.",
      aboutLine2: "From Banarasi silk sarees to modern cord sets, we work directly with artisans to bring you garments that are truly one-of-a-kind.",
      statPartners: "50+",
      statOrders: "0",
      statHappyCustomers: "0",
      instagramUrl: "https://instagram.com/rachitauduppu",
      instagramHandle: "@rachitauduppu",
      facebookUrl: "https://facebook.com/rachitauduppu",
      facebookHandle: "/rachitauduppu",
      youtubeUrl: "https://youtube.com/@rachitauduppu",
      youtubeHandle: "/rachitauduppu",
      whatsappCommunityUrl: "https://chat.whatsapp.com/CFY64aWAw6UHoUW0lMcczz",
    };

    const insertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(defaultSettings)) {
      insertSetting.run(key, String(value));
    }
  });

  seedAll();
}

seed();

// ── Settings helpers ──────────────────────────────────────────────────────────

export function getSettings(): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export function updateSettings(data: Record<string, string>) {
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  const tx = db.transaction((entries: [string, string][]) => {
    for (const [k, v] of entries) stmt.run(k, v);
  });
  tx(Object.entries(data));
}
