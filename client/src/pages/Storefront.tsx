import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShoppingBag, ArrowRight, Phone, Mail, MapPin, Menu, X, Moon, Sun, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Product, Category, Variant } from "@shared/types";

interface SiteSettings {
  waNumber: string;
  phone: string;
  email: string;
  location: string;
  heroHeading: string;
  heroTagline: string;
  heroDescription: string;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutLine1: string;
  aboutLine2: string;
  statArtisanPartners: string;
  statYearsOfCraft: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  facebookHandle: string;
  youtubeUrl: string;
  youtubeHandle: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
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
  statArtisanPartners: "50+",
  statYearsOfCraft: "5+",
  instagramUrl: "https://instagram.com/rachitauduppu",
  instagramHandle: "@rachitauduppu",
  facebookUrl: "https://facebook.com/rachitauduppu",
  facebookHandle: "/rachitauduppu",
  youtubeUrl: "https://youtube.com/@rachitauduppu",
  youtubeHandle: "/rachitauduppu",
};

function waLink(waNumber: string, productName?: string) {
  const msg = productName
    ? `Hello, I'm interested in *${productName}* from Rachita Uduppu. Please share more details.`
    : `Hello, I'd like to know more about your collection at Rachita Uduppu.`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
}

// Social icons (static SVGs, URLs come from settings)
const IGIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const FBIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const YTIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;

// ── Bare gold "RU" monogram logo ──
function RULogo({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 120 132" fill="none" aria-label="Rachita Uduppu logo" className={className}>
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#F7D96B"/><stop offset="35%" stopColor="#E8A800"/><stop offset="65%" stopColor="#D4900A"/><stop offset="100%" stopColor="#B87A00"/>
        </linearGradient>
        <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#F5C842"/><stop offset="50%" stopColor="#D4900A"/><stop offset="100%" stopColor="#A36800"/>
        </linearGradient>
      </defs>
      <circle cx="42" cy="8" r="3.5" fill="#D4A017" opacity="0.9"/>
      <ellipse cx="42" cy="4" rx="2" ry="3.5" fill="#C8930C" opacity="0.85"/>
      <ellipse cx="46" cy="6" rx="2" ry="3" fill="#D4A017" opacity="0.8" transform="rotate(45 46 6)"/>
      <ellipse cx="38" cy="6" rx="2" ry="3" fill="#C8930C" opacity="0.8" transform="rotate(-45 38 6)"/>
      <ellipse cx="45" cy="10" rx="2" ry="3" fill="#D4A017" opacity="0.75" transform="rotate(30 45 10)"/>
      <ellipse cx="39" cy="10" rx="2" ry="3" fill="#C8930C" opacity="0.75" transform="rotate(-30 39 10)"/>
      <circle cx="55" cy="12" r="2.5" fill="#D4A017" opacity="0.8"/>
      <ellipse cx="55" cy="9" rx="1.5" ry="2.5" fill="#C8930C" opacity="0.75"/>
      <path d="M 50 18 C 58 28, 70 38, 72 52 C 74 65, 68 72, 62 80 C 58 87, 55 92, 56 100" stroke="#C8930C" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <ellipse cx="66" cy="42" rx="5" ry="2.5" fill="#C8930C" opacity="0.8" transform="rotate(40 66 42)"/>
      <ellipse cx="71" cy="55" rx="4.5" ry="2" fill="#D4A017" opacity="0.75" transform="rotate(-20 71 55)"/>
      <circle cx="62" cy="108" r="3" fill="#D4A017" opacity="0.85"/>
      <ellipse cx="62" cy="104.5" rx="1.8" ry="3" fill="#C8930C" opacity="0.8"/>
      <ellipse cx="65.5" cy="110" rx="1.8" ry="2.5" fill="#D4A017" opacity="0.75" transform="rotate(35 65.5 110)"/>
      <ellipse cx="58.5" cy="110" rx="1.8" ry="2.5" fill="#C8930C" opacity="0.75" transform="rotate(-35 58.5 110)"/>
      <text x="5" y="80" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="88" fontWeight="700" fontStyle="italic" fill="url(#goldGrad)">R</text>
      <text x="48" y="128" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="72" fontWeight="700" fontStyle="italic" fill="url(#goldGrad2)">U</text>
    </svg>
  );
}

function RUBadge({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="Rachita Uduppu">
      <defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F5C842"/><stop offset="100%" stopColor="#C9960C"/></linearGradient></defs>
      <path d="M22 8 Q28 18 26 30" stroke="#C8930C" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.8"/>
      <ellipse cx="28" cy="14" rx="3" ry="1.5" fill="#C8930C" opacity="0.7" transform="rotate(35 28 14)"/>
      <text x="2" y="30" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="30" fontWeight="700" fontStyle="italic" fill="url(#g2)">R</text>
      <text x="20" y="38" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="22" fontWeight="700" fontStyle="italic" fill="url(#g2)">U</text>
    </svg>
  );
}

// WhatsApp icon component
function WAIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function Storefront() {
  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: settings = DEFAULT_SETTINGS } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
  });

  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    setDark(!dark);
  }

  const SOCIALS = [
    { name: "Instagram", handle: settings.instagramHandle, url: settings.instagramUrl, icon: <IGIcon />, bg: "from-purple-500 via-pink-500 to-orange-400" },
    { name: "Facebook",  handle: settings.facebookHandle,  url: settings.facebookUrl,  icon: <FBIcon />, bg: "from-blue-600 to-blue-700" },
    { name: "YouTube",   handle: settings.youtubeHandle,   url: settings.youtubeUrl,   icon: <YTIcon />, bg: "from-red-500 to-red-600" },
  ];

  const activeProducts = products.filter(p => p.status === "active");
  const featured = activeProducts.filter(p => p.featured);
  const filtered = activeCategory
    ? activeProducts.filter(p => p.categoryId === activeCategory)
    : activeProducts;

  return (
    <div className="min-h-screen bg-background" data-testid="storefront">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <button onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })} className="flex items-center gap-2.5" data-testid="nav-logo">
            <RUBadge size={36} />
            <div className="hidden sm:block text-left">
              <p className="font-display text-base font-semibold text-foreground leading-tight">Rachita Uduppu</p>
              <p className="text-[10px] tracking-widest uppercase font-body" style={{ color: "hsl(42 70% 40%)" }}>Crafted with Tradition</p>
            </div>
          </button>
          <nav className="hidden md:flex items-center gap-8 text-sm font-body text-muted-foreground">
            {["collection", "about", "contact"].map(s => (
              <button key={s} onClick={() => document.getElementById(s)?.scrollIntoView({ behavior: "smooth" })} className="capitalize hover:text-foreground transition-colors">{s}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="storefront-theme-toggle">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-btn">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
            {["collection", "about", "contact"].map(s => (
              <button key={s} onClick={() => { document.getElementById(s)?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }} className="block w-full text-left capitalize text-sm text-muted-foreground hover:text-foreground py-1">{s}</button>
            ))}
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section id="hero" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, hsl(355 72% 22% / 0.92) 0%, hsl(0 50% 12% / 0.88) 100%)" }} />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="flex justify-center mb-6"><RULogo size={110} /></div>
          <h1 className="font-display text-5xl sm:text-7xl font-semibold text-white mb-3 leading-tight tracking-wide" data-testid="hero-heading">{settings.heroHeading}</h1>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/70" />
            <p className="font-display italic text-amber-300/90 text-lg sm:text-xl tracking-wide">{settings.heroTagline}</p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/70" />
          </div>
          <p className="font-body text-white/75 text-base sm:text-lg mb-10 max-w-md mx-auto">{settings.heroDescription}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={waLink(settings.waNumber)} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="font-body font-semibold w-full sm:w-auto" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)", color: "#fff" }}>
                <WAIcon className="w-5 h-5 mr-2" />
                WhatsApp to Order
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-body"
              onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}>
              View Collection <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-5 mt-10">
            {SOCIALS.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-1.5" aria-label={s.name}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>{s.icon}</div>
                <span className="font-body text-white/60 text-xs group-hover:text-white/90 transition-colors">{s.handle}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collection ── */}
      <section id="collection" className="py-20 px-4" data-testid="collection-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-semibold text-foreground mb-3">Our Collection</h2>
            <p className="font-body text-muted-foreground max-w-md mx-auto">Browse our handcrafted pieces — tap any product to enquire on WhatsApp.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-10" data-testid="category-filter">
            <button onClick={() => setActiveCategory(null)} className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors border ${activeCategory === null ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>All</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors border ${activeCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{cat.name}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground font-body py-12">No products in this category yet.</p>
          )}
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20 px-4 bg-secondary/30" data-testid="about-section">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-body text-xs tracking-widest uppercase mb-3 block" style={{ color: "hsl(42 70% 38%)" }}>Our Story</span>
            <h2 className="font-display text-4xl font-semibold text-foreground mb-2">{settings.aboutTitle}</h2>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px w-8 bg-amber-500/50" />
              <span className="font-display italic text-sm" style={{ color: "hsl(42 70% 38%)" }}>{settings.aboutSubtitle}</span>
            </div>
            <p className="font-body text-muted-foreground mb-4 leading-relaxed">{settings.aboutLine1}</p>
            <p className="font-body text-muted-foreground leading-relaxed">{settings.aboutLine2}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: "Products", value: `${activeProducts.length}+` }, { label: "Artisan Partners", value: settings.statArtisanPartners }, { label: "Collections", value: `${categories.length}` }, { label: "Years of Craft", value: settings.statYearsOfCraft }].map(({ label, value }) => (
              <div key={label} className="bg-card rounded-xl p-6 text-center border border-border">
                <p className="font-display text-4xl font-semibold" style={{ color: "hsl(355 72% 32%)" }}>{value}</p>
                <p className="font-body text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-20 px-4" data-testid="contact-section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl font-semibold text-foreground mb-3">Get in Touch</h2>
          <p className="font-body text-muted-foreground mb-10">For orders, custom requests, or just to say hello.</p>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[{ icon: Phone, label: "Phone", value: settings.phone }, { icon: Mail, label: "Email", value: settings.email }, { icon: MapPin, label: "Location", value: settings.location }].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-card rounded-xl p-6 border border-border">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(355 72% 32% / 0.1)" }}>
                  <Icon size={20} style={{ color: "hsl(355 72% 32%)" }} />
                </div>
                <p className="font-body text-sm font-medium text-foreground">{label}</p>
                <p className="font-body text-sm text-muted-foreground mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6">
            {SOCIALS.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2" aria-label={s.name}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:shadow-lg transition-all`}>
                  <span className="scale-125">{s.icon}</span>
                </div>
                <span className="font-body text-xs text-muted-foreground group-hover:text-foreground transition-colors">{s.handle}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-4 bg-card" data-testid="footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <RUBadge size={32} />
            <div>
              <p className="font-display text-base font-semibold text-foreground leading-tight">Rachita Uduppu</p>
              <p className="font-display italic text-xs" style={{ color: "hsl(42 70% 38%)" }}>Crafted with Tradition</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {SOCIALS.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.bg} flex items-center justify-center text-white hover:scale-110 transition-transform`} aria-label={s.name}>
                <span className="scale-75">{s.icon}</span>
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <p className="font-body text-xs text-muted-foreground">© 2025 Rachita Uduppu. All rights reserved.</p>
            <Link href="/admin"><Button variant="ghost" size="sm" className="font-body text-xs text-muted-foreground">Admin →</Button></Link>
          </div>
        </div>
      </footer>

      {/* ── Sticky WhatsApp (mobile) ── */}
      <a href={waLink(settings.waNumber)} target="_blank" rel="noopener noreferrer" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden flex items-center gap-2 px-5 py-3 rounded-full font-body font-bold text-white text-sm shadow-lg hover:shadow-xl transition-all" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)", boxShadow: "0 6px 24px rgba(37,211,102,0.45)" }}>
        <WAIcon className="w-5 h-5" /> WhatsApp to Order
      </a>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const imgSrc = product.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80";
  const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : null;

  // Fetch variants for stock info
  const { data: variantList = [] } = useQuery<Variant[]>({ queryKey: ["/api/products", product.id, "variants"], queryFn: async () => {
    const { apiRequest } = await import("@/lib/queryClient");
    const res = await apiRequest("GET", `/api/products/${product.id}/variants`);
    return res.json();
  }});
  const totalStock = variantList.reduce((s, v) => s + v.stock, 0);
  const inStock = totalStock > 0;

  return (
    <Card className="product-card overflow-hidden border-border group" data-testid={`product-card-${product.id}`}>
      <div className="overflow-hidden aspect-[3/4] bg-muted relative">
        <img src={imgSrc} alt={product.name} className="w-full h-full object-cover product-card-img" />
        {discount && (
          <Badge className="absolute top-3 left-3 font-body text-xs" style={{ background: "hsl(355 72% 32%)", color: "hsl(38 90% 92%)" }}>-{discount}%</Badge>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="font-body font-semibold text-white text-sm bg-black/60 px-4 py-2 rounded-full">Out of Stock</span>
          </div>
        )}
        {/* Hover WhatsApp overlay */}
        <a href={waLink(settings.waNumber, product.name)} target="_blank" rel="noopener noreferrer"
          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-full font-body font-semibold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <WAIcon className="w-4 h-4" /> Enquire on WhatsApp
          </span>
        </a>
      </div>
      <div className="p-4">
        <p className="font-body text-xs text-muted-foreground mb-1 uppercase tracking-wide">{product.sku}</p>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2 leading-snug">{product.name}</h3>
        {product.description && (
          <p className="font-body text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="font-body font-semibold text-foreground text-lg">₹{product.price.toLocaleString("en-IN")}</span>
            {product.comparePrice && (
              <span className="font-body text-sm text-muted-foreground line-through ml-2">₹{product.comparePrice.toLocaleString("en-IN")}</span>
            )}
          </div>
          <a href={waLink(settings.waNumber, product.name)} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="font-body" style={{ background: "#25d366", color: "#fff" }}>
              <WAIcon className="w-3.5 h-3.5 mr-1" /> Order
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
