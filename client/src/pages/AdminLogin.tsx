import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Eye, EyeOff } from "lucide-react";

interface AdminLoginProps {
  onAuthenticated: () => void;
}

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("admin-token", data.token);
        onAuthenticated();
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-stone-200">
        <CardHeader className="text-center space-y-2">
          {/* Logo */}
          <div className="mx-auto mb-2">
            <svg width="48" height="48" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="8" y="68" fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="700" fontStyle="italic" fontSize="72" fill="#D4A017">R</text>
              <text x="52" y="100" fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="700" fontStyle="italic" fontSize="72" fill="#D4A017">U</text>
              <path d="M62 10 C66 6, 72 8, 70 14 C68 20, 74 22, 78 18" stroke="#D4A017" strokeWidth="1.5" fill="none" opacity="0.7"/>
            </svg>
          </div>
          <CardTitle className="text-lg font-semibold text-stone-800">Admin Panel</CardTitle>
          <CardDescription className="text-stone-500">Enter your password to access inventory management</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-stone-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="pl-10 pr-10"
                  autoFocus
                  data-testid="input-admin-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center" data-testid="text-login-error">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-crimson-700 hover:bg-crimson-800 text-white"
              disabled={loading || !password}
              data-testid="button-admin-login"
            >
              {loading ? "Verifying..." : "Sign In"}
            </Button>

            <p className="text-xs text-center text-stone-400">
              <a href="#/" className="hover:text-stone-600 underline">← Back to Store</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
