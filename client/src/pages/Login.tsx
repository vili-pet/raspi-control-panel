import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lock, Terminal } from "lucide-react";
import { useState } from "react";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/panel-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        onLogin();
      } else {
        setError("Väärä salasana");
        setPassword("");
      }
    } catch {
      setError("Yhteysvirhe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Terminal className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Raspi Control Panel
          </CardTitle>
          <CardDescription>
            Kirjoita salasana päästäksesi hallintapaneeliin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Salasana"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoFocus
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password}
            >
              {loading ? "Kirjaudutaan..." : "Kirjaudu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
