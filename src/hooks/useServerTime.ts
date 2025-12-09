import { useState, useEffect, useCallback } from "react";

interface ServerTimeConfig {
  apiUrl: string;
  timezone: string;
  enabled: boolean;
}

interface ServerTimeResult {
  currentTime: Date;
  isOnline: boolean;
  lastSync: Date | null;
  error: string | null;
}

const DEFAULT_CONFIG: ServerTimeConfig = {
  apiUrl: "https://worldtimeapi.org/api/timezone/Europe/Berlin",
  timezone: "Europe/Berlin",
  enabled: true,
};

export const getTimeApiConfig = (): ServerTimeConfig => {
  try {
    const saved = localStorage.getItem("timeApiConfig");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.apiUrl === "string") {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_CONFIG;
};

export const saveTimeApiConfig = (config: ServerTimeConfig) => {
  localStorage.setItem("timeApiConfig", JSON.stringify(config));
};

// Fetch current time from NTP server - returns unix timestamp in ms
export const fetchNtpTime = async (): Promise<number | null> => {
  const config = getTimeApiConfig();
  
  if (!config.enabled) {
    return null;
  }

  try {
    const response = await fetch(config.apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    let serverTimeMs: number;
    if (typeof data.unixtime === "number") {
      serverTimeMs = data.unixtime * 1000;
    } else if (data.datetime) {
      serverTimeMs = new Date(data.datetime).getTime();
    } else {
      throw new Error("Unknown API format");
    }

    if (isNaN(serverTimeMs)) {
      throw new Error("Invalid server time");
    }

    return serverTimeMs;
  } catch {
    return null;
  }
};

export const useServerTime = (): ServerTimeResult => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isOnline, setIsOnline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchServerTime = useCallback(async () => {
    const config = getTimeApiConfig();
    
    if (!config.enabled) {
      setIsOnline(false);
      setError(null);
      return;
    }

    try {
      const response = await fetch(config.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      let serverTimeMs: number;
      if (typeof data.unixtime === "number") {
        serverTimeMs = data.unixtime * 1000;
      } else if (data.datetime) {
        serverTimeMs = new Date(data.datetime).getTime();
      } else {
        throw new Error("Unbekanntes API-Format");
      }

      if (isNaN(serverTimeMs)) {
        throw new Error("Ungültige Serverzeit");
      }

      setCurrentTime(new Date(serverTimeMs));
      setIsOnline(true);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setIsOnline(false);
      setError(err instanceof Error ? err.message : "Verbindungsfehler");
    }
  }, []);

  // Initial sync and periodic re-sync every 10 seconds
  useEffect(() => {
    fetchServerTime();
    const syncInterval = setInterval(fetchServerTime, 10000);
    return () => clearInterval(syncInterval);
  }, [fetchServerTime]);

  return { currentTime, isOnline, lastSync, error };
};
