import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import asbLogo from "@/assets/asb-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [elapsedTime, setElapsedTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Get last accident timestamp from localStorage
    const lastAccident = localStorage.getItem("lastAccidentDate");
    const startDate = lastAccident ? new Date(lastAccident) : new Date();

    if (!lastAccident) {
      localStorage.setItem("lastAccidentDate", startDate.toISOString());
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Logo, Time and Admin Button */}
      <header className="relative p-8">
        <div className="absolute top-8 right-8 flex items-center gap-6">
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground tabular-nums">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(currentTime)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-muted-foreground"
          >
            Admin
          </Button>
        </div>
        <div className="flex justify-center">
          <img 
            src={asbLogo} 
            alt="ASB Logo" 
            className="h-40 w-auto object-contain"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
        <h1 className="text-5xl font-bold text-foreground mb-16">
          Tage ohne Arbeitsunfall
        </h1>

        {/* Timer Display */}
        <div className="bg-primary text-primary-foreground rounded-3xl px-16 py-12 shadow-2xl mb-8">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-8xl font-bold tabular-nums">
                {elapsedTime.days.toString().padStart(3, "0")}
              </div>
              <div className="text-2xl mt-2 opacity-90">Tage</div>
            </div>
            <div className="text-6xl font-light opacity-50">:</div>
            <div className="text-center">
              <div className="text-6xl font-bold tabular-nums">
                {elapsedTime.hours.toString().padStart(2, "0")}
              </div>
              <div className="text-xl mt-2 opacity-90">Std</div>
            </div>
            <div className="text-6xl font-light opacity-50">:</div>
            <div className="text-center">
              <div className="text-6xl font-bold tabular-nums">
                {elapsedTime.minutes.toString().padStart(2, "0")}
              </div>
              <div className="text-xl mt-2 opacity-90">Min</div>
            </div>
            <div className="text-6xl font-light opacity-50">:</div>
            <div className="text-center">
              <div className="text-6xl font-bold tabular-nums">
                {elapsedTime.seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-xl mt-2 opacity-90">Sek</div>
            </div>
          </div>
        </div>

        <p className="text-2xl text-muted-foreground">
          Sicherheit ist unsere Priorität
        </p>
      </main>

      {/* Footer */}
      <footer className="p-8">
        <div className="text-center text-sm text-muted-foreground">
          Sicherheit geht vor
        </div>
      </footer>
    </div>
  );
};

export default Index;
