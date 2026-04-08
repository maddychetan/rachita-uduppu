/**
 * Analytics & Microsoft Clarity helpers for Rachita Uduppu
 * ─────────────────────────────────────────────────────────
 * Wraps Google Analytics (gtag) and Microsoft Clarity APIs
 * so the rest of the app can fire events without worrying
 * about whether the scripts have loaded yet.
 */

// ── Type declarations ──
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    clarity?: (...args: any[]) => void;
  }
}

// ── Google Analytics helpers ──

/** Fire a GA4 custom event */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  window.gtag?.("event", eventName, params);
}

/** Track a virtual pageview (useful for SPA hash-routing) */
export function trackPageView(path: string, title?: string) {
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
}

// ── Microsoft Clarity helpers ──

/** Set a Clarity custom tag (key-value) for session segmentation */
export function clarityTag(key: string, value: string) {
  window.clarity?.("set", key, value);
}

/** Identify a user in Clarity (e.g. admin vs visitor) */
export function clarityIdentify(userId: string, sessionId?: string, pageId?: string) {
  window.clarity?.("identify", userId, sessionId, pageId);
}

/** Trigger a Clarity custom event (appears in Clarity dashboard) */
export function clarityEvent(name: string) {
  window.clarity?.("event", name);
}

// ── Convenience wrappers for common events ──

export function trackNavClick(section: string) {
  trackEvent("nav_click", { section });
  clarityEvent(`nav_${section}`);
}

export function trackCTAClick(ctaName: string, location: string) {
  trackEvent("cta_click", { cta_name: ctaName, location });
  clarityEvent(`cta_${ctaName}`);
}

export function trackSocialClick(platform: string) {
  trackEvent("social_click", { platform });
  clarityEvent(`social_${platform}`);
}

export function trackCategoryFilter(categoryName: string) {
  trackEvent("category_filter", { category: categoryName });
  clarityEvent(`filter_${categoryName}`);
}

export function trackProductView(productName: string, sku: string, price: number) {
  trackEvent("view_item", {
    item_name: productName,
    item_id: sku,
    price,
    currency: "INR",
  });
}

export function trackWhatsAppEnquiry(productName: string, sku: string, price: number) {
  trackEvent("whatsapp_enquiry", {
    product_name: productName,
    product_sku: sku,
    value: price,
    currency: "INR",
  });
  clarityEvent("whatsapp_enquiry");
}

export function trackThemeToggle(theme: "dark" | "light") {
  trackEvent("theme_toggle", { theme });
  clarityTag("theme", theme);
}

export function trackSectionView(section: string) {
  trackEvent("section_view", { section });
  clarityEvent(`view_${section}`);
}

/** Call once on storefront load to tag the Clarity session */
export function initStorefrontSession() {
  clarityTag("page_type", "storefront");
  clarityTag("user_role", "visitor");
  trackPageView("/", "Rachita Uduppu — Storefront");
}

/** Call once on admin load to tag the Clarity session */
export function initAdminSession() {
  clarityTag("page_type", "admin");
  clarityTag("user_role", "admin");
}
