import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product, Variant } from "@shared/types";
import { trackWhatsAppEnquiry } from "@/lib/analytics";

// ── WhatsApp link builder (duplicated here to keep modal self-contained) ──
function waLink(waNumber: string, product: Product, selectedSize?: string, selectedColor?: string) {
  const lines = [
    `Hello! I'm interested in ordering from *Rachita Uduppu* 🛍️`,
    ``,
    `*Product:* ${product.name}`,
    `*SKU:* ${product.sku}`,
    `*Price:* ₹${product.price.toLocaleString("en-IN")}`,
  ];
  if (selectedSize) lines.push(`*Size:* ${selectedSize}`);
  if (selectedColor) lines.push(`*Color:* ${selectedColor}`);
  if (product.description) lines.push(``, `*Details:* ${product.description}`);
  lines.push(``, `Could you please confirm availability and share payment details? Thank you!`);
  const cleanNumber = waNumber.replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function WAIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.057 23.272a.75.75 0 00.916.916l5.417-1.475A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 01-4.962-1.357l-.356-.212-3.686 1.003.979-3.578-.231-.368A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
    </svg>
  );
}

interface Props {
  product: Product | null;
  waNumber: string;
  onClose: () => void;
}

export default function ProductModal({ product, waNumber, onClose }: Props) {
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Fetch variants
  const { data: variants = [] } = useQuery<Variant[]>({
    queryKey: ["/api/products", product?.id, "variants"],
    enabled: !!product,
    queryFn: async () => {
      const { apiRequest } = await import("@/lib/queryClient");
      const res = await apiRequest("GET", `/api/products/${product!.id}/variants`);
      return res.json();
    },
  });

  // Reset state when product changes
  useEffect(() => {
    setImgIndex(0);
    setSelectedSize("");
    setSelectedColor("");
  }, [product?.id]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!product) return null;

  // Build image list (filter nulls)
  const images = [product.imageUrl, product.imageUrl2, product.imageUrl3]
    .filter(Boolean) as string[];
  if (images.length === 0) images.push("https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80");

  // Derive unique sizes + colors
  const sizes = [...new Set(variants.map(v => v.size))];
  const colors = [...new Set(variants.map(v => v.color))];

  // Stock for selected variant combo
  const selectedVariant = variants.find(
    v => v.size === selectedSize && v.color === selectedColor
  );
  const stockForVariant = selectedVariant?.stock ?? null;

  // Total stock across all variants
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const inStock = totalStock > 0;

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  const handleWhatsApp = () => {
    trackWhatsAppEnquiry(product.name, product.sku, product.price);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row">

        {/* ── Close button ── */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-background/80 hover:bg-muted border border-border transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* ── Left: Image gallery ── */}
        <div className="md:w-1/2 flex-shrink-0 bg-muted rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
          <div className="relative aspect-[3/4] w-full">
            <img
              src={images[imgIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Discount badge */}
            {discount && (
              <Badge
                className="absolute top-3 left-3 font-body text-xs"
                style={{ background: "hsl(355 72% 32%)", color: "hsl(38 90% 92%)" }}
              >
                -{discount}%
              </Badge>
            )}
            {/* Out of stock overlay */}
            {!inStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="font-body font-semibold text-white text-sm bg-black/60 px-4 py-2 rounded-full">
                  Out of Stock
                </span>
              </div>
            )}
            {/* Prev / Next arrows — only when multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIndex(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/40"}`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 bg-muted/80">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${i === imgIndex ? "border-primary" : "border-transparent"}`}
                >
                  <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Details ── */}
        <div className="md:w-1/2 flex flex-col p-6 gap-4">

          {/* SKU + Name */}
          <div>
            <p className="font-body text-xs text-muted-foreground uppercase tracking-widest mb-1">
              {product.sku}
            </p>
            <h2 className="font-display text-2xl font-semibold text-foreground leading-snug">
              {product.name}
            </h2>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-body font-bold text-2xl text-foreground">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.comparePrice && (
              <span className="font-body text-base text-muted-foreground line-through">
                ₹{product.comparePrice.toLocaleString("en-IN")}
              </span>
            )}
            {discount && (
              <Badge className="font-body text-xs" style={{ background: "hsl(142 71% 28%)", color: "#fff" }}>
                Save {discount}%
              </Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(s => s === size ? "" : size)}
                    className={`px-3 py-1.5 rounded-lg border font-body text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(c => c === color ? "" : color)}
                    className={`px-3 py-1.5 rounded-lg border font-body text-sm font-medium transition-colors ${
                      selectedColor === color
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock indicator for selected variant */}
          <div className="flex items-center gap-2">
            <Package size={14} className="text-muted-foreground" />
            {stockForVariant !== null ? (
              stockForVariant === 0 ? (
                <span className="font-body text-xs text-destructive font-medium">Out of stock for this variant</span>
              ) : stockForVariant <= 3 ? (
                <span className="font-body text-xs text-amber-500 font-medium">Only {stockForVariant} left</span>
              ) : (
                <span className="font-body text-xs text-green-600 font-medium">In stock ({stockForVariant} available)</span>
              )
            ) : inStock ? (
              <span className="font-body text-xs text-green-600 font-medium">In stock — select size & color to check availability</span>
            ) : (
              <span className="font-body text-xs text-destructive font-medium">Currently out of stock</span>
            )}
          </div>

          {/* WhatsApp CTA */}
          <div className="mt-auto pt-2 flex flex-col gap-2">
            <a
              href={waLink(waNumber, product, selectedSize || undefined, selectedColor || undefined)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsApp}
              className="w-full"
            >
              <Button
                size="lg"
                className="w-full font-body font-semibold gap-2"
                style={{ background: "linear-gradient(135deg, #25d366, #128c7e)", color: "#fff" }}
              >
                <WAIcon className="w-5 h-5" />
                {selectedSize || selectedColor
                  ? `Order ${[selectedColor, selectedSize].filter(Boolean).join(" / ")} on WhatsApp`
                  : "Enquire on WhatsApp"}
              </Button>
            </a>
            <p className="font-body text-xs text-center text-muted-foreground">
              Select size & color above for a personalised order message
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
