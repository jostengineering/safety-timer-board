import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AccidentConfig {
  lastAccidentDate: Date;
  recordDays: number;
}

interface ResetResult {
  new_timestamp: string;
  previous_days: number;
  old_record: number;
  new_record: number;
  record_broken: boolean;
}

interface UseAccidentConfigResult {
  config: AccidentConfig | null;
  isLoading: boolean;
  error: string | null;
  resetTimer: () => Promise<ResetResult | null>;
  setRecord: (days: number) => Promise<boolean>;
  resetRecord: () => Promise<boolean>;
}

export const useAccidentConfig = (): UseAccidentConfigResult => {
  const [config, setConfig] = useState<AccidentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset timer - record update happens atomically on server
  const resetTimer = useCallback(async (): Promise<ResetResult | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc("reset_accident_timer");

      if (rpcError) {
        console.error("Error resetting timer:", rpcError);
        setError(rpcError.message);
        return null;
      }

      console.log("Timer reset result:", data);
      await fetchConfig();
      return data as unknown as ResetResult;
    } catch (err) {
      console.error("Unexpected error resetting timer:", err);
      setError("Unerwarteter Fehler beim Zurücksetzen");
      return null;
    }
  }, [fetchConfig]);

  // Manual record override (admin only)
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
