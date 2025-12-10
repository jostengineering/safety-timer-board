import { useState, useEffect } from "react";

interface ServerTimeResult {
  currentTime: Date;
}

/**
 * Simple hook that returns local system time, updated every second.
 * The actual accident timestamp comes from the Postgres database (NTP-synced server).
 */
export const useServerTime = (): ServerTimeResult => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { currentTime };
};
