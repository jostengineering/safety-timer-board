import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [lastAccidentDate, setLastAccidentDate] = useState<Date | null>(null);

  // Simple password - in production, this should be more secure
  const ADMIN_PASSWORD = "AsbBrandenburg";

  useEffect(() => {
    // Check if already logged in (session)
    const loggedIn = sessionStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
      loadLastAccidentDate();
    }
  }, []);

  const loadLastAccidentDate = () => {
    const lastAccident = localStorage.getItem("lastAccidentDate");
    if (lastAccident) {
      setLastAccidentDate(new Date(lastAccident));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem("adminLoggedIn", "true");
      loadLastAccidentDate();
      toast({
        title: "Anmeldung erfolgreich",
        description: "Willkommen im Admin-Bereich",
      });
    } else {
      toast({
        title: "Fehler",
        description: "Falsches Passwort",
        variant: "destructive",
      });
    }
  };

  const handleResetTimer = () => {
    const now = new Date();
    localStorage.setItem("lastAccidentDate", now.toISOString());
    setLastAccidentDate(now);
    toast({
      title: "Timer zurückgesetzt",
      description: "Der Unfallzähler wurde auf 0 zurückgesetzt",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("adminLoggedIn");
    setPassword("");
    navigate("/");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Bitte geben Sie das Passwort ein, um fortzufahren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Anmelden
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Zurück
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Abmelden
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unfallzähler Management</CardTitle>
            <CardDescription>
              Verwalten Sie den Unfallzähler für die Hauptanzeige
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {lastAccidentDate && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Letzter Unfall zurückgesetzt am:
                </p>
                <p className="text-lg font-semibold">
                  {lastAccidentDate.toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  {" um "}
                  {lastAccidentDate.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleResetTimer}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                Timer auf 0 zurücksetzen
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Dies setzt den Unfallzähler auf der Hauptseite zurück
              </p>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
          Zur Hauptanzeige
        </Button>
      </div>
    </div>
  );
};

export default Admin;
