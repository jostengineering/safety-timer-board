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
  const { config, isLoading, updateRecord } = useAccidentConfig();

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

    // Update record if current days exceeds it
    if (days > config.recordDays) {
      updateRecord(days);
    }
  }, [currentTime, config, updateRecord]);

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
      <header className="relative p-2 sm:p-4">
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center gap-1 sm:gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xl sm:text-3xl font-bold text-foreground tabular-nums">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {formatDate(currentTime)}
            </div>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-muted-foreground text-xs sm:text-sm"
          >
            Admin
          </Button>
        </div>
        <div className="flex justify-start">
          <div className="bg-white dark:bg-white p-2 sm:p-4 rounded-lg">
            <img 
              src={asbLogo} 
              alt="ASB Logo" 
              className="h-16 sm:h-32 md:h-48 w-auto max-w-[50vw] object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-8 py-0">
        <h1 className="text-[clamp(2rem,5vw,6rem)] font-bold text-foreground mb-4 sm:mb-8">
          Unfallfrei seit:
        </h1>

        {/* Timer Display */}
        <div className="border-4 border-red-500 rounded-2xl sm:rounded-3xl px-4 sm:px-8 md:px-12 lg:px-16 py-4 sm:py-6 md:py-8 lg:py-12 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 text-foreground">
            <div className="text-center">
              <div className="text-[clamp(2rem,6vw,12rem)] font-bold tabular-nums leading-none">
                {elapsedTime.days.toString().padStart(3, "0")}
              </div>
              <div className="text-[clamp(0.75rem,1.2vw,2rem)] mt-2 text-foreground">Tage</div>
            </div>
            <div className="text-[clamp(1.5rem,4vw,8rem)] font-light text-foreground/50">:</div>
            <div className="text-center">
              <div className="text-[clamp(1.5rem,4vw,8rem)] font-bold tabular-nums leading-none">
                {elapsedTime.hours.toString().padStart(2, "0")}
              </div>
              <div className="text-[clamp(0.75rem,1vw,1.5rem)] mt-2 text-foreground">Std</div>
            </div>
            <div className="text-[clamp(1.5rem,4vw,8rem)] font-light text-foreground/50">:</div>
            <div className="text-center">
              <div className="text-[clamp(1.5rem,4vw,8rem)] font-bold tabular-nums leading-none">
                {elapsedTime.minutes.toString().padStart(2, "0")}
              </div>
              <div className="text-[clamp(0.75rem,1vw,1.5rem)] mt-2 text-foreground">Min</div>
            </div>
            <div className="text-[clamp(1.5rem,4vw,8rem)] font-light text-foreground/50">:</div>
            <div className="text-center">
              <div className="text-[clamp(1.5rem,4vw,8rem)] font-bold tabular-nums leading-none">
                {elapsedTime.seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-[clamp(0.75rem,1vw,1.5rem)] mt-2 text-foreground">Sek</div>
            </div>
          </div>
        </div>

        {/* Record Display */}
        <div className="mt-4 sm:mt-8 border-4 border-red-500 rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 md:py-6 lg:py-8">
          <div className="flex items-center justify-between gap-3 sm:gap-6 lg:gap-10">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div>
                <p className="text-[clamp(1rem,2vw,2.5rem)] uppercase tracking-wide text-foreground font-semibold mb-1">
                  Rekord
                </p>
                <p className="text-[clamp(0.875rem,1.5vw,1.75rem)] text-foreground hidden sm:block">
                  Längste unfallfreie Zeit
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[clamp(2.5rem,5vw,10rem)] font-bold text-red-600 dark:text-red-500 tabular-nums leading-none">
                {config?.recordDays ?? 0}
              </p>
              <p className="text-[clamp(0.875rem,1.5vw,2rem)] text-foreground mt-2">
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
