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
  offset: number;
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

const saveTimeSync = (offset: number) => {
  const sync: TimeSync = {
    offset,
    lastSync: new Date().toISOString(),
  };
  localStorage.setItem("timeSync", JSON.stringify(sync));
};

export const useServerTime = (): ServerTimeResult => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeOffset, setTimeOffset] = useState(() => {
    // Initialize from localStorage
    const stored = getStoredTimeSync();
    return stored?.offset ?? 0;
  });

  // Load stored sync on mount
  useEffect(() => {
    const stored = getStoredTimeSync();
    if (stored) {
      setTimeOffset(stored.offset);
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
      
      // worldtimeapi.org returns datetime in ISO format
      let serverTime: Date;
      if (data.datetime) {
        serverTime = new Date(data.datetime);
      } else if (data.unixtime) {
        serverTime = new Date(data.unixtime * 1000);
      } else {
        throw new Error("Unbekanntes API-Format");
      }

      const localTime = new Date();
      const offset = serverTime.getTime() - localTime.getTime();
      
      setTimeOffset(offset);
      saveTimeSync(offset); // Store in localStorage for all windows
      setIsOnline(true);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      // If we have a stored offset, keep using it
      const stored = getStoredTimeSync();
      if (stored) {
        setTimeOffset(stored.offset);
        setLastSync(new Date(stored.lastSync));
      }
      setIsOnline(false);
      setError(err instanceof Error ? err.message : "Verbindungsfehler");
    }
  }, []);

  // Initial sync and periodic re-sync every 5 minutes
  useEffect(() => {
    fetchServerTime();
    const syncInterval = setInterval(fetchServerTime, 5 * 60 * 1000);
    return () => clearInterval(syncInterval);
  }, [fetchServerTime]);

  // Listen for localStorage changes from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "timeSync" && e.newValue) {
        try {
          const sync: TimeSync = JSON.parse(e.newValue);
          setTimeOffset(sync.offset);
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

  // Update time every second using offset
  useEffect(() => {
    const timer = setInterval(() => {
      const config = getTimeApiConfig();
      if (config.enabled && timeOffset !== 0) {
        setCurrentTime(new Date(Date.now() + timeOffset));
      } else {
        setCurrentTime(new Date());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeOffset]);

  return { currentTime, isOnline, lastSync, error };
};
