import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AccidentConfig {
  lastAccidentDate: Date;
  recordDays: number;
}

interface UseAccidentConfigResult {
  config: AccidentConfig | null;
  isLoading: boolean;
  error: string | null;
  resetTimer: () => Promise<boolean>;
  setRecord: (days: number) => Promise<boolean>;
  resetRecord: () => Promise<boolean>;
}

export const useAccidentConfig = (): UseAccidentConfigResult => {
  const [config, setConfig] = useState<AccidentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastCheckedRecord = useRef<number>(0);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("accident_config")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching accident config:", fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setConfig({
          lastAccidentDate: new Date(data.last_accident_date),
          recordDays: data.record_days,
        });
        lastCheckedRecord.current = data.record_days;
        setError(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Unerwarteter Fehler beim Laden der Konfiguration");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Check and update record every 10 minutes
  useEffect(() => {
    const checkAndUpdateRecord = async () => {
      if (!config) return;

      const now = new Date();
      const diff = now.getTime() - config.lastAccidentDate.getTime();
      const currentDays = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (currentDays > lastCheckedRecord.current) {
        console.log(`Updating record: ${lastCheckedRecord.current} -> ${currentDays}`);
        lastCheckedRecord.current = currentDays;

        try {
          const { error: updateError } = await supabase
            .from("accident_config")
            .update({
              record_days: currentDays,
              updated_at: new Date().toISOString(),
            })
            .eq("id", 1);

          if (updateError) {
            console.error("Error updating record:", updateError);
          } else {
            console.log("Record updated successfully to:", currentDays);
            setConfig(prev => prev ? { ...prev, recordDays: currentDays } : null);
          }
        } catch (err) {
          console.error("Unexpected error updating record:", err);
        }
      }
    };

    // Check immediately on mount
    checkAndUpdateRecord();

    // Then check every 10 minutes (600000ms)
    const interval = setInterval(checkAndUpdateRecord, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [config?.lastAccidentDate]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("accident_config_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accident_config",
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          if (payload.new && typeof payload.new === "object" && "last_accident_date" in payload.new) {
            const newData = payload.new as { last_accident_date: string; record_days: number };
            setConfig({
              lastAccidentDate: new Date(newData.last_accident_date),
              recordDays: newData.record_days,
            });
            lastCheckedRecord.current = newData.record_days;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetTimer = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error: rpcError } = await supabase.rpc("reset_accident_timer");

      if (rpcError) {
        console.error("Error resetting timer:", rpcError);
        setError(rpcError.message);
        return false;
      }

      console.log("Timer reset with server timestamp:", data);
      await fetchConfig();
      return true;
    } catch (err) {
      console.error("Unexpected error resetting timer:", err);
      setError("Unerwarteter Fehler beim Zurücksetzen");
      return false;
    }
  }, [fetchConfig]);

  const setRecord = useCallback(async (days: number): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("accident_config")
        .update({
          record_days: days,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (updateError) {
        console.error("Error setting record:", updateError);
        setError(updateError.message);
        return false;
      }

      lastCheckedRecord.current = days;
      setConfig(prev => prev ? { ...prev, recordDays: days } : null);
      return true;
    } catch (err) {
      console.error("Unexpected error setting record:", err);
      setError("Unerwarteter Fehler beim Setzen des Rekords");
      return false;
    }
  }, []);

  const resetRecord = useCallback(async (): Promise<boolean> => {
    return setRecord(0);
  }, [setRecord]);

  return {
    config,
    isLoading,
    error,
    resetTimer,
    setRecord,
    resetRecord,
  };
};
