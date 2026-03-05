import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SensorReading } from "@/hooks/sensorHooks";
import { useToast } from "@/hooks/use-toast";
import { DogDataManager } from "@/lib/dogDataManager";

const SERVICE_UUID = "12345678-1234-1234-1234-123456789012";
const CHARACTERISTIC_UUID = "87654321-4321-4321-4321-210987654321";
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

/** Parse the BLE JSON payload from ESP32:
 * {"barkSpike":N,"ammoniaPPM":N,"methanePPM":N,"co2PPM":N,"scratchIntensity":N,"diagnosis":"...","skinStatus":"...","timestamp":N}
 */
function parseBleData(raw: string): {
  bark: number; ammonia: number; methane: number; co2: number;
  activity: number; diagnosis: string | null; skinStatus: string | null; timestamp: number;
} | null {
  try {
    const d = JSON.parse(raw);
    return {
      bark: d.barkSpike ?? 0,
      ammonia: d.ammoniaPPM ?? 0,
      methane: d.methanePPM ?? 0,
      co2: d.co2PPM ?? 0,
      activity: parseFloat((d.scratchIntensity ?? 0).toFixed(2)),
      diagnosis: d.diagnosis || null,
      skinStatus: d.skinStatus || null,
      timestamp: d.timestamp ?? Date.now(),
    };
  } catch {
    // Fallback: try old key:value format
    try {
      const parts: Record<string, number> = {};
      raw.split(",").forEach((seg) => {
        const [key, val] = seg.split(":");
        if (key && val) parts[key.trim()] = parseFloat(val);
      });
      return {
        bark: parts["Bark"] ?? 0,
        ammonia: parts["Smell"] ?? 0,
        methane: 0, co2: 0,
        activity: parseFloat((parts["Activity"] ?? 0).toFixed(2)),
        diagnosis: null, skinStatus: null,
        timestamp: Date.now(),
      };
    } catch { return null; }
  }
}

export function useBleCollar() {
  const [connected, setConnected] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [justPaired, setJustPaired] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [secondsActive, setSecondsActive] = useState(0);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const { toast } = useToast();

  const deviceRef = useRef<any>(null);
  const charRef = useRef<any>(null);
  const manualDisconnectRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    setSecondsActive(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSecondsActive((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle incoming BLE notification
  const handleNotification = useCallback((event: Event) => {
    const target = event.target as any;
    const value = target?.value;
    if (!value) return;

    const decoder = new TextDecoder();
    const raw = decoder.decode(value);
    const parsed = parseBleData(raw);
    if (!parsed) return;

    const newReading: SensorReading = {
      id: crypto.randomUUID(),
      bark_spike: parsed.bark,
      ammonia_ppm: parsed.ammonia,
      methane_ppm: parsed.methane,
      co2_ppm: parsed.co2,
      scratch_intensity: parsed.activity,
      diagnosis: parsed.diagnosis,
      skin_status: parsed.skinStatus,
      device_timestamp: parsed.timestamp,
      created_at: new Date().toISOString(),
    };

    setLatest(newReading);
    const updatedReadings = [newReading, ...readings].slice(0, 50);
    setReadings(updatedReadings);
    
    // Store in dog-specific storage
    DogDataManager.setDogData("sensor_readings", updatedReadings);
    DogDataManager.setDogData("latest_reading", newReading);

    // Also persist to cloud (fire-and-forget)
    supabase.from("sensor_readings").insert({
      bark_spike: parsed.bark,
      ammonia_ppm: parsed.ammonia,
      methane_ppm: parsed.methane,
      co2_ppm: parsed.co2,
      scratch_intensity: parsed.activity,
      diagnosis: parsed.diagnosis,
      skin_status: parsed.skinStatus,
      device_timestamp: parsed.timestamp,
    }).then(() => {});
  }, []);

  // Subscribe to the characteristic
  const subscribeToChar = useCallback(async (char: any) => {
    await char.startNotifications();
    char.addEventListener("characteristicvaluechanged", handleNotification);
    charRef.current = char;
  }, [handleNotification]);

  // Connect to GATT and subscribe
  const connectToDevice = useCallback(async (device: any): Promise<boolean> => {
    try {
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const char = await service.getCharacteristic(CHARACTERISTIC_UUID);
      await subscribeToChar(char);
      return true;
    } catch (err) {
      console.error("BLE connect error:", err);
      return false;
    }
  }, [subscribeToChar]);

  // Auto-reconnect logic
  const attemptReconnect = useCallback(async (device: any, attempt = 1) => {
    if (manualDisconnectRef.current || attempt > MAX_RECONNECT_ATTEMPTS) {
      setReconnecting(false);
      setReconnectAttempt(0);
      setConnected(false);
      stopTimer();
      return;
    }

    setReconnecting(true);
    setReconnectAttempt(attempt);

    reconnectTimeoutRef.current = setTimeout(async () => {
      const success = await connectToDevice(device);
      if (success) {
        setConnected(true);
        setReconnecting(false);
        setReconnectAttempt(0);
      } else {
        attemptReconnect(device, attempt + 1);
      }
    }, RECONNECT_DELAY_MS);
  }, [connectToDevice, stopTimer]);

  // Handle unexpected disconnect
  const handleDisconnect = useCallback(() => {
    if (manualDisconnectRef.current) {
      setConnected(false);
      stopTimer();
      return;
    }
    setConnected(false);
    if (deviceRef.current) {
      attemptReconnect(deviceRef.current);
    }
  }, [attemptReconnect, stopTimer]);

  // Start monitoring – triggers BLE scan & pair
  const startMonitoring = useCallback(async () => {
    console.log("[BLE] startMonitoring called");
    manualDisconnectRef.current = false;

    // Check browser support
    const nav = navigator as any;
    console.log("[BLE] navigator.bluetooth:", nav.bluetooth);
    if (!nav.bluetooth) {
      console.error("[BLE] Bluetooth not supported");
      toast({
        title: "❌ Bluetooth Not Supported",
        description: "Web Bluetooth requires Chrome/Edge browser. Firefox and Safari are not supported.",
        variant: "destructive",
      });
      return;
    }

    // Check HTTPS (except localhost)
    console.log("[BLE] Protocol:", window.location.protocol, "Hostname:", window.location.hostname);
    if (window.location.protocol !== "https:" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
      console.error("[BLE] HTTPS required");
      toast({
        title: "⚠️ HTTPS Required",
        description: "Web Bluetooth requires HTTPS connection (except localhost).",
        variant: "destructive",
      });
      return;
    }

    console.log("[BLE] Setting pairing to true");
    setPairing(true);
    setJustPaired(false);

    try {
      console.log("[BLE] Requesting device...");
      // Try filtering by service UUID first (shows only matching devices)
      let device;
      try {
        console.log("[BLE] Trying filtered scan with SERVICE_UUID:", SERVICE_UUID);
        device = await nav.bluetooth.requestDevice({
          filters: [{ services: [SERVICE_UUID] }],
        });
        console.log("[BLE] Device selected:", device);
      } catch (filterErr: any) {
        // If filtered scan fails (e.g. service not advertised), fall back to accept all
        console.log("[BLE] Filtered scan failed, trying acceptAllDevices:", filterErr?.message);
        
        if (filterErr?.name === "NotFoundError") {
          console.error("[BLE] No devices found");
          toast({
            title: "🔍 No Devices Found",
            description: "Make sure your ESP32-C3 collar is powered on and nearby.",
          });
          setPairing(false);
          return;
        }

        console.log("[BLE] Trying acceptAllDevices fallback");
        device = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [SERVICE_UUID],
        });
        console.log("[BLE] Device selected (acceptAll):", device);
      }

      deviceRef.current = device;
      setDeviceName(device.name ?? "Pawsitive Collar");

      device.addEventListener("gattserverdisconnected", handleDisconnect);

      const success = await connectToDevice(device);
      if (success) {
        setConnected(true);
        setPairing(false);
        setJustPaired(true);
        startTimer();

        toast({
          title: "✅ Collar Connected!",
          description: `${device.name ?? "Pawsitive Collar"} - All sensors will start automatically`,
        });

        // Show success for 3 seconds
        setTimeout(() => setJustPaired(false), 3000);

        // Load dog-specific data
        const dogReadings = DogDataManager.getDogData("sensor_readings") || [];
        if (dogReadings.length > 0) {
          setReadings(dogReadings);
          setLatest(dogReadings[0]);
        }
      } else {
        setPairing(false);
        toast({
          title: "❌ Connection Failed",
          description: "Could not connect to device. Try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("BLE request error:", err);
      setPairing(false);

      if (err?.name === "NotFoundError") {
        toast({
          title: "🔍 No Device Selected",
          description: "Please select a device from the Bluetooth pairing dialog.",
        });
      } else if (err?.name === "SecurityError") {
        toast({
          title: "🔒 Security Error",
          description: "Bluetooth access denied. Check browser permissions.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Bluetooth Error",
          description: err?.message || "Failed to scan for devices.",
          variant: "destructive",
        });
      }
    }
  }, [connectToDevice, handleDisconnect, startTimer, toast]);

  // Manual disconnect
  const stopMonitoring = useCallback(() => {
    manualDisconnectRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setReconnecting(false);
    setReconnectAttempt(0);

    if (charRef.current) {
      try {
        charRef.current.removeEventListener("characteristicvaluechanged", handleNotification);
        charRef.current.stopNotifications().catch(() => {});
      } catch {}
      charRef.current = null;
    }

    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;

    setConnected(false);
    stopTimer();
  }, [handleNotification, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [stopTimer]);

  return {
    connected,
    pairing,
    justPaired,
    reconnecting,
    reconnectAttempt,
    latest,
    readings,
    secondsActive,
    deviceName,
    startMonitoring,
    stopMonitoring,
  };
}
