import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Phone, Mail, MapPin, MessageCircle, FileText,
  Star, Instagram, Youtube, Facebook, Globe, Image as ImageIcon,
} from "lucide-react";

export interface SiteSettings {
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
  statPartners: string;
  statOrders: string;
  statHappyCustomers: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  facebookHandle: string;
  youtubeUrl: string;
  youtubeHandle: string;
}

const DEFAULT: SiteSettings = {
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
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-body text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="font-body text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SiteSettings>(DEFAULT);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const token = sessionStorage.getItem("admin-token") || "";
      const res = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) setForm({ ...DEFAULT, ...settings });
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data: SiteSettings) => {
      const token = sessionStorage.getItem("admin-token") || "";
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "Settings saved", description: "Changes are now live on the website." });
    },
    onError: (e: any) => {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    },
  });

  function set(field: keyof SiteSettings, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-body">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Site Settings</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Edit every part of your website from here. Changes go live instantly after saving.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Hero Section ── */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <ImageIcon size={16} className="text-amber-500" /> Hero Section
            </CardTitle>
            <CardDescription className="font-body text-xs">The big banner at the top of your website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Brand Name (heading)">
              <Input value={form.heroHeading} onChange={e => set("heroHeading", e.target.value)} />
            </Field>
            <Field label="Tagline (italic text under heading)">
              <Input value={form.heroTagline} onChange={e => set("heroTagline", e.target.value)} />
            </Field>
            <Field label="Description (paragraph below tagline)">
              <Textarea value={form.heroDescription} onChange={e => set("heroDescription", e.target.value)} rows={2} />
            </Field>
          </CardContent>
        </Card>

        {/* ── WhatsApp & Contact ── */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <MessageCircle size={16} className="text-green-600" /> WhatsApp & Contact
            </CardTitle>
            <CardDescription className="font-body text-xs">Shown on all WhatsApp buttons and the Contact section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="WhatsApp Number" hint="Include country code, no + or spaces. Example: 917829441004">
              <Input value={form.waNumber} onChange={e => set("waNumber", e.target.value)} placeholder="917829441004" />
            </Field>
            <Field label="Phone (displayed on website)">
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 78294 41004" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={e => set("location", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        {/* ── About Section ── */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <FileText size={16} className="text-primary" /> About / Our Story
            </CardTitle>
            <CardDescription className="font-body text-xs">The "Our Story" section in the middle of your website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Section Heading">
              <Input value={form.aboutTitle} onChange={e => set("aboutTitle", e.target.value)} />
            </Field>
            <Field label="Section Subheading (italic)">
              <Input value={form.aboutSubtitle} onChange={e => set("aboutSubtitle", e.target.value)} />
            </Field>
            <Field label="First Paragraph">
              <Textarea value={form.aboutLine1} onChange={e => set("aboutLine1", e.target.value)} rows={3} />
            </Field>
            <Field label="Second Paragraph">
              <Textarea value={form.aboutLine2} onChange={e => set("aboutLine2", e.target.value)} rows={3} />
            </Field>
          </CardContent>
        </Card>

        {/* ── Stats ── */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Star size={16} className="text-amber-500" /> Stats (About Section)
            </CardTitle>
            <CardDescription className="font-body text-xs">
              The number boxes shown in the About section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-body text-xs text-muted-foreground -mt-1">Products and Collections are counted automatically from your inventory.</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Partners">
                <Input value={form.statPartners} onChange={e => set("statPartners", e.target.value)} placeholder="50+" />
              </Field>
              <Field label="Orders">
                <Input value={form.statOrders} onChange={e => set("statOrders", e.target.value)} placeholder="100+" />
              </Field>
              <Field label="Happy Customers">
                <Input value={form.statHappyCustomers} onChange={e => set("statHappyCustomers", e.target.value)} placeholder="200+" />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* ── Social Links ── */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Globe size={16} className="text-blue-500" /> Social Media Links
            </CardTitle>
            <CardDescription className="font-body text-xs">Shown in the hero, contact section, and footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Instagram */}
            <div className="space-y-3">
              <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 inline-block" /> Instagram
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Profile URL">
                  <Input value={form.instagramUrl} onChange={e => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." />
                </Field>
                <Field label="Handle (displayed)">
                  <Input value={form.instagramHandle} onChange={e => set("instagramHandle", e.target.value)} placeholder="@rachitauduppu" />
                </Field>
              </div>
            </div>
            {/* Facebook */}
            <div className="space-y-3">
              <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-600 inline-block" /> Facebook
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Profile URL">
                  <Input value={form.facebookUrl} onChange={e => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." />
                </Field>
                <Field label="Handle (displayed)">
                  <Input value={form.facebookHandle} onChange={e => set("facebookHandle", e.target.value)} placeholder="/rachitauduppu" />
                </Field>
              </div>
            </div>
            {/* YouTube */}
            <div className="space-y-3">
              <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-red-600 inline-block" /> YouTube
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Channel URL">
                  <Input value={form.youtubeUrl} onChange={e => set("youtubeUrl", e.target.value)} placeholder="https://youtube.com/@..." />
                </Field>
                <Field label="Handle (displayed)">
                  <Input value={form.youtubeHandle} onChange={e => set("youtubeHandle", e.target.value)} placeholder="/rachitauduppu" />
                </Field>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full font-body"
          data-testid="button-save-settings"
          style={saved ? { background: "#16a34a" } : {}}
        >
          <Save size={15} className="mr-2" />
          {mutation.isPending ? "Saving..." : saved ? "Saved!" : "Save All Changes"}
        </Button>
      </form>
    </div>
  );
}
