import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import asbLogo from "@/assets/asb-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [elapsedTime, setElapsedTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [recordDays, setRecordDays] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Get last accident timestamp from localStorage
    const lastAccident = localStorage.getItem("lastAccidentDate");
    const startDate = lastAccident ? new Date(lastAccident) : new Date();

    if (!lastAccident) {
      localStorage.setItem("lastAccidentDate", startDate.toISOString());
    }

    // Get record from localStorage
    const savedRecord = localStorage.getItem("recordDays");
    if (savedRecord) {
      setRecordDays(parseInt(savedRecord));
    }

    // Update elapsed time every second
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime({ days, hours, minutes, seconds });

      // Update record if current days exceeds it
      const currentRecord = parseInt(localStorage.getItem("recordDays") || "0");
      if (days > currentRecord) {
        localStorage.setItem("recordDays", days.toString());
        setRecordDays(days);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Update current time every second
    const clock = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clock);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header with Logo, Time and Admin Button */}
      <header className="relative p-4">
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground tabular-nums">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(currentTime)}
            </div>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-muted-foreground"
          >
            Admin
          </Button>
        </div>
        <div className="flex justify-start">
          <div className="bg-white dark:bg-white p-4 rounded-lg">
            <img 
              src={asbLogo} 
              alt="ASB Logo" 
              className="h-48 w-auto max-w-[50vw] object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-0">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          Unfallfrei seit:
        </h1>

        {/* Timer Display */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-3xl px-12 py-8 shadow-2xl mb-6 border-2 border-red-500/50">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-7xl font-bold tabular-nums">
                {elapsedTime.days.toString().padStart(3, "0")}
              </div>
              <div className="text-xl mt-1 opacity-90">Tage</div>
            </div>
            <div className="text-5xl font-light opacity-50">:</div>
            <div className="text-center">
              <div className="text-5xl font-bold tabular-nums">
                {elapsedTime.hours.toString().padStart(2, "0")}
              </div>
              <div className="text-lg mt-1 opacity-90">Std</div>
            </div>
            <div className="text-5xl font-light opacity-50">:</div>
            <div className="text-center">
              <div className="text-5xl font-bold tabular-nums">
                {elapsedTime.minutes.toString().padStart(2, "0")}
              </div>
              <div className="text-lg mt-1 opacity-90">Min</div>
            </div>
            <div className="text-5xl font-light opacity-50">:</div>
            <div className="text-center">
              <div className="text-5xl font-bold tabular-nums">
                {elapsedTime.seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-lg mt-1 opacity-90">Sek</div>
            </div>
          </div>
        </div>

        {/* Record Display */}
        <div className="mt-8 bg-gradient-to-r from-red-500/10 via-yellow-500/20 to-red-500/10 border border-red-500/30 rounded-2xl px-8 py-6 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🏆</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                  Rekord
                </p>
                <p className="text-sm text-muted-foreground">
                  Längste unfallfreie Zeit
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-red-600 dark:text-red-500 tabular-nums">
                {recordDays}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {recordDays === 1 ? 'Tag' : 'Tage'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
