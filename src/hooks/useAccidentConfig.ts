import { useState, useEffect, useCallback } from "react";
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
  updateRecord: (days: number) => Promise<void>;
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

  const resetTimer = useCallback(async (): Promise<boolean> => {
    try {
      // Use database server time (now()) for consistency
      const { error: updateError } = await supabase
        .from("accident_config")
        .update({
          last_accident_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (updateError) {
        console.error("Error resetting timer:", updateError);
        setError(updateError.message);
        return false;
      }

      // Refetch to get the server timestamp
      await fetchConfig();
      return true;
    } catch (err) {
      console.error("Unexpected error resetting timer:", err);
      setError("Unerwarteter Fehler beim Zurücksetzen");
      return false;
    }
  }, [fetchConfig]);

  const updateRecord = useCallback(async (days: number): Promise<void> => {
    if (!config || days <= config.recordDays) return;

    try {
      const { error: updateError } = await supabase
        .from("accident_config")
        .update({
          record_days: days,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (updateError) {
        console.error("Error updating record:", updateError);
      }
    } catch (err) {
      console.error("Unexpected error updating record:", err);
    }
  }, [config]);

  return {
    config,
    isLoading,
    error,
    resetTimer,
    updateRecord,
  };
};
