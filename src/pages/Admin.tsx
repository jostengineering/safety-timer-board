import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAccidentConfig } from "@/hooks/useAccidentConfig";
import { supabase } from "@/integrations/supabase/client";

interface ResetHistoryEntry {
  id: string;
  reset_at: string;
  previous_days: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [newRecordDays, setNewRecordDays] = useState("");
  const [resetHistory, setResetHistory] = useState<ResetHistoryEntry[]>([]);
  const { config, resetTimer, setRecord, resetRecord, isLoading } = useAccidentConfig();

  const fetchResetHistory = async () => {
    const { data, error } = await supabase
      .from("timer_reset_history")
      .select("*")
      .order("reset_at", { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setResetHistory(data);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchResetHistory();
    }
  }, [isLoggedIn]);

  // Simple password - in production, this should be more secure
  const ADMIN_PASSWORD = "AsbBrandenburg";

  useEffect(() => {
    // Check if already logged in (session)
    const loggedIn = sessionStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (config) {
      setNewRecordDays(config.recordDays.toString());
    }
  }, [config]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem("adminLoggedIn", "true");
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

  const handleResetTimer = async () => {
    const success = await resetTimer();
    if (success) {
      await fetchResetHistory();
      toast({
        title: "Timer zurückgesetzt",
        description: "Der Unfallzähler wurde auf 0 zurückgesetzt (Server-Zeit)",
      });
    } else {
      toast({
        title: "Fehler",
        description: "Timer konnte nicht zurückgesetzt werden",
        variant: "destructive",
      });
    }
  };

  const handleSetRecord = async () => {
    const days = parseInt(newRecordDays, 10);
    if (isNaN(days) || days < 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige Zahl ein",
        variant: "destructive",
      });
      return;
    }

    const success = await setRecord(days);
    if (success) {
      toast({
        title: "Rekord aktualisiert",
        description: `Rekord wurde auf ${days} Tage gesetzt`,
      });
    } else {
      toast({
        title: "Fehler",
        description: "Rekord konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleResetRecord = async () => {
    const success = await resetRecord();
    if (success) {
      setNewRecordDays("0");
      toast({
        title: "Rekord zurückgesetzt",
        description: "Rekord wurde auf 0 Tage zurückgesetzt",
      });
    } else {
      toast({
        title: "Fehler",
        description: "Rekord konnte nicht zurückgesetzt werden",
        variant: "destructive",
      });
    }
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
              Verwalten Sie den Unfallzähler für die Hauptanzeige (Daten werden in der Datenbank gespeichert)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Lade Daten...</p>
              </div>
            ) : config && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Letzter Unfall zurückgesetzt am:
                </p>
                <p className="text-lg font-semibold">
                  {config.lastAccidentDate.toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  {" um "}
                  {config.lastAccidentDate.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Aktueller Rekord: <span className="font-semibold">{config.recordDays} Tage</span>
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
                Dies setzt den Unfallzähler auf der Hauptseite zurück (verwendet Server-Zeit)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekord-Verwaltung</CardTitle>
            <CardDescription>
              Setzen oder bearbeiten Sie den Rekord manuell
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="recordDays" className="sr-only">Rekord in Tagen</Label>
                <Input
                  id="recordDays"
                  type="number"
                  min="0"
                  value={newRecordDays}
                  onChange={(e) => setNewRecordDays(e.target.value)}
                  placeholder="Rekord in Tagen"
                />
              </div>
              <Button onClick={handleSetRecord}>
                Speichern
              </Button>
            </div>
            <Button
              onClick={handleResetRecord}
              variant="outline"
              className="w-full"
            >
              Rekord auf 0 zurücksetzen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reset-Historie</CardTitle>
            <CardDescription>
              Übersicht aller Timer-Zurücksetzungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Einträge vorhanden</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {resetHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(entry.reset_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                        {" um "}
                        {new Date(entry.reset_at).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Nach {entry.previous_days} Tagen
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
