import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useServerTime } from "@/hooks/useServerTime";
import { useAccidentConfig } from "@/hooks/useAccidentConfig";
import asbLogo from "@/assets/asb-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [elapsedTime, setElapsedTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { currentTime } = useServerTime();
  const { config, isLoading } = useAccidentConfig();

  // Update elapsed time based on server time and database config
  useEffect(() => {
    if (!config) return;
    
    const startDate = config.lastAccidentDate;
    const diff = currentTime.getTime() - startDate.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setElapsedTime({ days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes), seconds: Math.max(0, seconds) });
  }, [currentTime, config]);

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
      <header className="relative p-2 sm:p-3 flex-shrink-0">
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 sm:gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground tabular-nums">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(currentTime)}
            </div>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-muted-foreground text-xs"
          >
            Admin
          </Button>
        </div>
        <div className="flex justify-start">
          <div className="bg-white dark:bg-white p-2 rounded-lg">
            <img 
              src={asbLogo} 
              alt="ASB Logo" 
              className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto max-w-[40vw] object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 sm:px-6 py-2">
        <h1 className="text-[clamp(1.5rem,4vw,4rem)] font-bold text-foreground mb-2 sm:mb-4">
          Unfallfrei seit:
        </h1>

        {/* Timer Display */}
        <div className="border-4 border-red-500 rounded-xl sm:rounded-2xl px-3 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 md:py-6 mb-2 sm:mb-4">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 text-foreground">
            <div className="text-center">
              <div className="text-[clamp(1.75rem,5vw,8rem)] font-bold tabular-nums leading-none">
                {elapsedTime.days.toString().padStart(3, "0")}
              </div>
              <div className="text-[clamp(0.625rem,1vw,1.25rem)] mt-1 text-foreground">Tage</div>
            </div>
            <div className="text-[clamp(1.25rem,3vw,5rem)] font-light text-foreground/50">:</div>
            <div className="text-center">
              <div className="text-[clamp(1.25rem,3vw,5rem)] font-bold tabular-nums leading-none">
                {elapsedTime.hours.toString().padStart(2, "0")}
              </div>
              <div className="text-[clamp(0.625rem,0.8vw,1rem)] mt-1 text-foreground">Std</div>
            </div>
            <div className="text-[clamp(1.25rem,3vw,5rem)] font-light text-foreground/50">:</div>
            <div className="text-center">
              <div className="text-[clamp(1.25rem,3vw,5rem)] font-bold tabular-nums leading-none">
                {elapsedTime.minutes.toString().padStart(2, "0")}
              </div>
              <div className="text-[clamp(0.625rem,0.8vw,1rem)] mt-1 text-foreground">Min</div>
            </div>
            <div className="text-[clamp(1.25rem,3vw,5rem)] font-light text-foreground/50">:</div>
            <div className="text-center">
              <div className="text-[clamp(1.25rem,3vw,5rem)] font-bold tabular-nums leading-none">
                {elapsedTime.seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-[clamp(0.625rem,0.8vw,1rem)] mt-1 text-foreground">Sek</div>
            </div>
          </div>
        </div>

        {/* Record Display */}
        <div className="border-4 border-red-500 rounded-lg sm:rounded-xl px-3 sm:px-5 md:px-8 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
            <div>
              <p className="text-[clamp(0.875rem,1.5vw,1.75rem)] uppercase tracking-wide text-foreground font-semibold">
                Rekord
              </p>
              <p className="text-[clamp(0.75rem,1vw,1.25rem)] text-foreground hidden sm:block">
                Längste unfallfreie Zeit
              </p>
            </div>
            <div className="text-right">
              <p className="text-[clamp(2rem,4vw,6rem)] font-bold text-red-600 dark:text-red-500 tabular-nums leading-none">
                {config?.recordDays ?? 0}
              </p>
              <p className="text-[clamp(0.75rem,1vw,1.25rem)] text-foreground mt-1">
                {(config?.recordDays ?? 0) === 1 ? 'Tag' : 'Tage'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
