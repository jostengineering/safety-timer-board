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
  serverUnixTime: number;
  localUnixTime: number;
  lastSync: string;
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

const getStoredTimeSync = (): TimeSync | null => {
  try {
    const saved = localStorage.getItem("timeSync");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        typeof parsed.serverUnixTime === "number" &&
        typeof parsed.localUnixTime === "number" &&
        !isNaN(parsed.serverUnixTime) &&
        !isNaN(parsed.localUnixTime)
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  // Clear corrupted data
  localStorage.removeItem("timeSync");
  return null;
};

const saveTimeSync = (serverUnixTime: number, localUnixTime: number) => {
  if (isNaN(serverUnixTime) || isNaN(localUnixTime)) {
    return; // Don't save invalid data
  }
  const sync: TimeSync = {
    serverUnixTime,
    localUnixTime,
    lastSync: new Date().toISOString(),
  };
  localStorage.setItem("timeSync", JSON.stringify(sync));
};

// Calculate current server time based on stored sync point
const calculateServerTime = (): Date => {
  const config = getTimeApiConfig();
  
  if (!config.enabled) {
    return new Date();
  }
  
  const stored = getStoredTimeSync();
  if (!stored) {
    return new Date();
  }
  
  const elapsedSinceSync = Date.now() - stored.localUnixTime;
  const currentServerTime = stored.serverUnixTime + elapsedSinceSync;
  
  if (isNaN(currentServerTime)) {
    return new Date();
  }
  
  return new Date(currentServerTime);
};

export const useServerTime = (): ServerTimeResult => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isOnline, setIsOnline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize from stored sync
  useEffect(() => {
    const stored = getStoredTimeSync();
    if (stored && getTimeApiConfig().enabled) {
      setLastSync(new Date(stored.lastSync));
      setIsOnline(true);
    }
  }, []);

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

  // Initial sync and periodic re-sync
  useEffect(() => {
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
          if (sync && !isNaN(sync.serverUnixTime)) {
            setLastSync(new Date(sync.lastSync));
            setIsOnline(true);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(calculateServerTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return { currentTime, isOnline, lastSync, error };
};
