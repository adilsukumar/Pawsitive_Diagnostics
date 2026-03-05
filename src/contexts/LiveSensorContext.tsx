import React, { createContext, useContext } from "react";
import { useLiveSensorData, useBleCollar } from "@/hooks/sensorHooks";
import type { SensorReading } from "@/hooks/sensorHooks";

interface LiveSensorContextType {
  // Supabase realtime sensor data
  readings: SensorReading[];
  latest: SensorReading | null;
  connected: boolean;
  secondsActive: number;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  // BLE collar state
  bleConnected: boolean;
  blePairing: boolean;
  bleJustPaired: boolean;
  bleReconnecting: boolean;
  bleReconnectAttempt: number;
  bleLatest: SensorReading | null;
  bleReadings: SensorReading[];
  bleSecondsActive: number;
  bleDeviceName: string | null;
  bleStartMonitoring: () => Promise<void>;
  bleStopMonitoring: () => void;
}

const LiveSensorContext = createContext<LiveSensorContextType | null>(null);

export const LiveSensorProvider = ({ children }: { children: React.ReactNode }) => {
  const sensorData = useLiveSensorData();
  const bleCollar = useBleCollar();

  const value: LiveSensorContextType = {
    ...sensorData,
    bleConnected: bleCollar.connected,
    blePairing: bleCollar.pairing,
    bleJustPaired: bleCollar.justPaired,
    bleReconnecting: bleCollar.reconnecting,
    bleReconnectAttempt: bleCollar.reconnectAttempt,
    bleLatest: bleCollar.latest,
    bleReadings: bleCollar.readings,
    bleSecondsActive: bleCollar.secondsActive,
    bleDeviceName: bleCollar.deviceName,
    bleStartMonitoring: bleCollar.startMonitoring,
    bleStopMonitoring: bleCollar.stopMonitoring,
  };

  return (
    <LiveSensorContext.Provider value={value}>
      {children}
    </LiveSensorContext.Provider>
  );
};

export const useGlobalSensorData = (): LiveSensorContextType => {
  const ctx = useContext(LiveSensorContext);
  if (!ctx) throw new Error("useGlobalSensorData must be used within LiveSensorProvider");
  return ctx;
};
