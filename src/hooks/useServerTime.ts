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

interface TimeSync {
  serverUnixTime: number; // Server time in ms when synced
  localUnixTime: number;  // Local time in ms when synced
  lastSync: string;
}

const DEFAULT_CONFIG: ServerTimeConfig = {
  apiUrl: "https://worldtimeapi.org/api/timezone/Europe/Berlin",
  timezone: "Europe/Berlin",
  enabled: true,
};

export const getTimeApiConfig = (): ServerTimeConfig => {
  const saved = localStorage.getItem("timeApiConfig");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
};

export const saveTimeApiConfig = (config: ServerTimeConfig) => {
  localStorage.setItem("timeApiConfig", JSON.stringify(config));
};

const getStoredTimeSync = (): TimeSync | null => {
  const saved = localStorage.getItem("timeSync");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

const saveTimeSync = (serverUnixTime: number, localUnixTime: number) => {
  const sync: TimeSync = {
    serverUnixTime,
    localUnixTime,
    lastSync: new Date().toISOString(),
  };
  localStorage.setItem("timeSync", JSON.stringify(sync));
};

// Calculate current server time based on stored sync point
const calculateServerTime = (): Date => {
  const stored = getStoredTimeSync();
  const config = getTimeApiConfig();
  
  if (!config.enabled || !stored) {
    return new Date();
  }
  
  // Time elapsed since sync
  const elapsedSinceSync = Date.now() - stored.localUnixTime;
  // Current server time = server time at sync + elapsed time
  const currentServerTime = stored.serverUnixTime + elapsedSinceSync;
  
  return new Date(currentServerTime);
};

export const useServerTime = (): ServerTimeResult => {
  const [currentTime, setCurrentTime] = useState(() => calculateServerTime());
  const [isOnline, setIsOnline] = useState(() => {
    const stored = getStoredTimeSync();
    return stored !== null && getTimeApiConfig().enabled;
  });
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const stored = getStoredTimeSync();
    return stored ? new Date(stored.lastSync) : null;
  });
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
      const localTimeAtReceive = Date.now();
      
      // Get server time in milliseconds
      let serverTimeMs: number;
      if (data.unixtime) {
        serverTimeMs = data.unixtime * 1000;
      } else if (data.datetime) {
        serverTimeMs = new Date(data.datetime).getTime();
      } else {
        throw new Error("Unbekanntes API-Format");
      }

      // Save sync point to localStorage
      saveTimeSync(serverTimeMs, localTimeAtReceive);
      
      setIsOnline(true);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      const stored = getStoredTimeSync();
      if (stored) {
        setIsOnline(true);
        setLastSync(new Date(stored.lastSync));
      } else {
        setIsOnline(false);
      }
      setError(err instanceof Error ? err.message : "Verbindungsfehler");
    }
  }, []);

  // Initial sync and periodic re-sync every 5 minutes
  useEffect(() => {
    // Only fetch if we don't have a recent sync (within last 5 minutes)
    const stored = getStoredTimeSync();
    const fiveMinutes = 5 * 60 * 1000;
    const needsSync = !stored || (Date.now() - new Date(stored.lastSync).getTime() > fiveMinutes);
    
    if (needsSync) {
      fetchServerTime();
    }
    
    const syncInterval = setInterval(fetchServerTime, fiveMinutes);
    return () => clearInterval(syncInterval);
  }, [fetchServerTime]);

  // Listen for localStorage changes from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "timeSync" && e.newValue) {
        try {
          const sync: TimeSync = JSON.parse(e.newValue);
          setLastSync(new Date(sync.lastSync));
          setIsOnline(true);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Update time every second using stored sync point
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(calculateServerTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return { currentTime, isOnline, lastSync, error };
};
