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
  apiUrl: "https://timeapi.io/api/time/current/zone?timeZone=Europe/Berlin",
  timezone: "Europe/Berlin",
  enabled: true,
};

// Fallback APIs to try if primary fails
const FALLBACK_APIS = [
  "https://timeapi.io/api/time/current/zone?timeZone=Europe/Berlin",
  "https://worldtimeapi.org/api/timezone/Europe/Berlin",
];

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

// Parse time from various API response formats
const parseTimeFromResponse = (data: unknown): number | null => {
  if (!data || typeof data !== "object") return null;
  
  const d = data as Record<string, unknown>;
  
  // worldtimeapi.org format: { unixtime: 1234567890 }
  if (typeof d.unixtime === "number") {
    return d.unixtime * 1000;
  }
  
  // timeapi.io format: { dateTime: "2024-01-15T12:30:45.123" }
  if (typeof d.dateTime === "string") {
    const time = new Date(d.dateTime).getTime();
    if (!isNaN(time)) return time;
  }
  
  // Generic datetime field
  if (typeof d.datetime === "string") {
    const time = new Date(d.datetime).getTime();
    if (!isNaN(time)) return time;
  }
  
  return null;
};

// Fetch current time from NTP server - returns unix timestamp in ms
export const fetchNtpTime = async (): Promise<number | null> => {
  const config = getTimeApiConfig();
  
  if (!config.enabled) {
    return null;
  }

  // Try configured API first, then fallbacks
  const apisToTry = [config.apiUrl, ...FALLBACK_APIS.filter(url => url !== config.apiUrl)];
  
  for (const apiUrl of apisToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        continue;
      }
      
      const data = await response.json();
      const serverTimeMs = parseTimeFromResponse(data);
      
      if (serverTimeMs && !isNaN(serverTimeMs)) {
        return serverTimeMs;
      }
    } catch {
      // Try next API
      continue;
    }
  }
  
  return null;
};

export const useServerTime = (): ServerTimeResult => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isOnline, setIsOnline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Store the last fetched NTP time and when we fetched it
  const [ntpReference, setNtpReference] = useState<{ ntpTime: number; localTime: number } | null>(null);

  const fetchServerTime = useCallback(async () => {
    const config = getTimeApiConfig();
    
    if (!config.enabled) {
      setIsOnline(false);
      setError(null);
      return;
    }

    // Try configured API first, then fallbacks
    const apisToTry = [config.apiUrl, ...FALLBACK_APIS.filter(url => url !== config.apiUrl)];
    
    for (const apiUrl of apisToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          continue;
        }
        
        const data = await response.json();
        const localTimeAtFetch = Date.now();
        const serverTimeMs = parseTimeFromResponse(data);
        
        if (serverTimeMs && !isNaN(serverTimeMs)) {
          setNtpReference({ ntpTime: serverTimeMs, localTime: localTimeAtFetch });
          setCurrentTime(new Date(serverTimeMs));
          setIsOnline(true);
          setLastSync(new Date());
          setError(null);
          return; // Success!
        }
      } catch {
        // Try next API
        continue;
      }
    }
    
    // All APIs failed
    setIsOnline(false);
    setError("Alle Zeit-APIs nicht erreichbar");
  }, []);

  // Initial sync and periodic re-sync every 30 seconds
  useEffect(() => {
    fetchServerTime();
    const syncInterval = setInterval(fetchServerTime, 30000);
    return () => clearInterval(syncInterval);
  }, [fetchServerTime]);

  // Update time every second by interpolating from last NTP fetch
  useEffect(() => {
    const timer = setInterval(() => {
      if (ntpReference) {
        const elapsed = Date.now() - ntpReference.localTime;
        setCurrentTime(new Date(ntpReference.ntpTime + elapsed));
      } else {
        setCurrentTime(new Date());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [ntpReference]);

  return { currentTime, isOnline, lastSync, error };
};
