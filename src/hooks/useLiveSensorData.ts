import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SensorReading {
  id: string;
  bark_spike: number | null;
  ammonia_ppm: number | null;
  methane_ppm: number | null;
  co2_ppm: number | null;
  scratch_intensity: number | null;
  diagnosis: string | null;
  skin_status: string | null;
  device_timestamp: number | null;
  created_at: string;
}

export function useLiveSensorData() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [connected, setConnected] = useState(false);
  const [secondsActive, setSecondsActive] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  const fetchRecent = useCallback(async () => {
    const { data } = await supabase
      .from("sensor_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data && data.length > 0) {
      setReadings(data as SensorReading[]);
      setLatest(data[0] as SensorReading);
    }
  }, []);

  const startMonitoring = useCallback(() => {
    fetchRecent();
    setConnected(true);
    setSecondsActive(0);
    timerRef.current = setInterval(() => setSecondsActive((s) => s + 1), 1000);

    const channel = supabase
      .channel("sensor_readings_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_readings" },
        (payload) => {
          const newReading = payload.new as SensorReading;
          setLatest(newReading);
          setReadings((prev) => [newReading, ...prev].slice(0, 50));
        }
      )
      .subscribe();
    channelRef.current = channel;
  }, [fetchRecent]);

  const stopMonitoring = useCallback(() => {
    setConnected(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return { readings, latest, connected, secondsActive, startMonitoring, stopMonitoring };
}
