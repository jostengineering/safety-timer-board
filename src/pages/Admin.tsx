import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getTimeApiConfig, saveTimeApiConfig, useServerTime } from "@/hooks/useServerTime";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [lastAccidentDate, setLastAccidentDate] = useState<Date | null>(null);
  
  // Time API settings
  const [timeApiUrl, setTimeApiUrl] = useState("");
  const [timeApiEnabled, setTimeApiEnabled] = useState(true);
  const { currentTime, isOnline, lastSync, error } = useServerTime();

  // Simple password - in production, this should be more secure
  const ADMIN_PASSWORD = "AsbBrandenburg";

  useEffect(() => {
    // Check if already logged in (session)
    const loggedIn = sessionStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
      loadLastAccidentDate();
      loadTimeApiConfig();
    }
  }, []);

  const loadLastAccidentDate = () => {
    const lastAccident = localStorage.getItem("lastAccidentDate");
    if (lastAccident) {
      setLastAccidentDate(new Date(lastAccident));
    }
  };

  const loadTimeApiConfig = () => {
    const config = getTimeApiConfig();
    setTimeApiUrl(config.apiUrl);
    setTimeApiEnabled(config.enabled);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem("adminLoggedIn", "true");
      loadLastAccidentDate();
      loadTimeApiConfig();
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

  const handleSaveTimeApiConfig = () => {
    saveTimeApiConfig({
      apiUrl: timeApiUrl,
      timezone: "Europe/Berlin",
      enabled: timeApiEnabled,
    });
    toast({
      title: "Einstellungen gespeichert",
      description: "Die Zeit-API Konfiguration wurde aktualisiert. Seite neu laden um Änderungen anzuwenden.",
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

        <Card>
          <CardHeader>
            <CardTitle>Zeit-API Konfiguration</CardTitle>
            <CardDescription>
              Konfigurieren Sie die HTTP Zeit-API für die Zeitsynchronisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {timeApiEnabled ? (isOnline ? "Verbunden" : "Nicht verbunden") : "Deaktiviert"}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${timeApiEnabled ? (isOnline ? "bg-green-500" : "bg-red-500") : "bg-gray-400"}`} />
            </div>

            {error && timeApiEnabled && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">Fehler: {error}</p>
              </div>
            )}

            {lastSync && timeApiEnabled && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Letzte Synchronisation: {lastSync.toLocaleTimeString("de-DE")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Aktuelle Zeit: {currentTime.toLocaleTimeString("de-DE")}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="timeApiEnabled">Zeit-API aktivieren</Label>
                <p className="text-sm text-muted-foreground">
                  Bei Deaktivierung wird die Systemzeit verwendet
                </p>
              </div>
              <Switch
                id="timeApiEnabled"
                checked={timeApiEnabled}
                onCheckedChange={setTimeApiEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeApiUrl">API URL</Label>
              <Input
                id="timeApiUrl"
                value={timeApiUrl}
                onChange={(e) => setTimeApiUrl(e.target.value)}
                placeholder="https://worldtimeapi.org/api/timezone/Europe/Berlin"
              />
              <p className="text-xs text-muted-foreground">
                Unterstützt worldtimeapi.org Format. Beispiele:
                <br />
                • https://worldtimeapi.org/api/timezone/Europe/Berlin
                <br />
                • https://worldtimeapi.org/api/timezone/Europe/London
              </p>
            </div>

            <Button onClick={handleSaveTimeApiConfig} className="w-full">
              Einstellungen speichern
            </Button>
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
