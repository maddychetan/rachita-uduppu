import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Phone, Mail, MapPin, MessageCircle, FileText } from "lucide-react";

interface SiteSettings {
  waNumber: string;
  phone: string;
  email: string;
  location: string;
  aboutLine1: string;
  aboutLine2: string;
}

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings");
      return res.json();
    },
  });

  const [form, setForm] = useState<SiteSettings | null>(null);

  // Populate form when data loads
  if (settings && !form) {
    setForm({ ...settings });
  }

  const mutation = useMutation({
    mutationFn: async (data: SiteSettings) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved", description: "Your changes are now live on the website." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save settings. Please try again.", variant: "destructive" });
    },
  });

  function handleChange(field: keyof SiteSettings, value: string) {
    setForm(prev => prev ? { ...prev, [field]: value } : null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form) mutation.mutate(form);
  }

  if (isLoading || !form) {
    return (
      <div className="p-8 text-center text-muted-foreground font-body">Loading settings...</div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Site Settings</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Changes here update the live website instantly after saving.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* WhatsApp & Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <MessageCircle size={16} className="text-green-600" /> WhatsApp & Contact
            </CardTitle>
            <CardDescription className="font-body text-xs">
              These appear on all "Order on WhatsApp" buttons and the Contact section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">WhatsApp Number <span className="text-muted-foreground">(with country code, no + or spaces)</span></Label>
              <Input
                value={form.waNumber}
                onChange={e => handleChange("waNumber", e.target.value)}
                placeholder="917829441004"
                data-testid="input-wa-number"
              />
              <p className="text-xs text-muted-foreground font-body">Example: 917829441004 for +91 78294 41004</p>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm flex items-center gap-1.5"><Phone size={13} /> Phone (displayed on website)</Label>
              <Input
                value={form.phone}
                onChange={e => handleChange("phone", e.target.value)}
                placeholder="+91 78294 41004"
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm flex items-center gap-1.5"><Mail size={13} /> Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="hello@rachitauduppu.in"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm flex items-center gap-1.5"><MapPin size={13} /> Location</Label>
              <Input
                value={form.location}
                onChange={e => handleChange("location", e.target.value)}
                placeholder="Davangere, Karnataka, India"
                data-testid="input-location"
              />
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <FileText size={16} className="text-primary" /> About Section
            </CardTitle>
            <CardDescription className="font-body text-xs">
              The two paragraphs shown in the "Our Story" section on the homepage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">First Paragraph</Label>
              <Textarea
                value={form.aboutLine1}
                onChange={e => handleChange("aboutLine1", e.target.value)}
                rows={3}
                data-testid="input-about-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Second Paragraph</Label>
              <Textarea
                value={form.aboutLine2}
                onChange={e => handleChange("aboutLine2", e.target.value)}
                rows={3}
                data-testid="input-about-2"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full font-body"
          data-testid="button-save-settings"
        >
          <Save size={15} className="mr-2" />
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
