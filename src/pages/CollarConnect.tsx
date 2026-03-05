import { motion, AnimatePresence } from "framer-motion";
import { Bluetooth, BluetoothOff, Activity, Wind, AudioLines, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useGlobalSensorData } from "@/contexts/LiveSensorContext";
import LiveSensorPanel from "@/components/LiveSensorPanel";

const getGasLevel = (ppm: number) => {
  if (ppm < 200) return { label: "Normal", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (ppm < 500) return { label: "Elevated", color: "text-amber-500", bg: "bg-amber-500/10" };
  return { label: "High", color: "text-destructive", bg: "bg-destructive/10" };
};

const getBarkLevel = (val: number) => {
  if (val < 100) return { label: "Quiet", color: "text-muted-foreground" };
  if (val < 500) return { label: "Mild", color: "text-amber-500" };
  return { label: "Loud", color: "text-destructive" };
};

const CollarConnect = () => {
  const {
    bleConnected: connected, blePairing: pairing, bleJustPaired: justPaired,
    bleReconnecting: reconnecting, bleReconnectAttempt: reconnectAttempt,
    bleLatest: latest, bleReadings: readings, bleSecondsActive: secondsActive,
    bleDeviceName: deviceName, bleStartMonitoring: startMonitoring, bleStopMonitoring: stopMonitoring,
  } = useGlobalSensorData();

  const handleScanClick = () => {
    console.log("[CollarConnect] Scan button clicked!");
    console.log("[CollarConnect] startMonitoring function:", startMonitoring);
    startMonitoring();
  };

  return (
    <AppLayout title="Smart Collar" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5 min-h-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-glow-sm">
            <Bluetooth className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground tracking-tight">Smart Collar</h2>
          <p className="text-muted-foreground text-sm font-body">Connect to your ESP32-C3 Pawsitive Collar via BLE</p>
          {connected && deviceName && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mt-1">
              <motion.div className="w-2 h-2 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="text-xs font-body text-emerald-500 font-medium">{deviceName} · Active 24/7</span>
            </motion.div>
          )}
        </motion.div>

        {/* Connection Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`glass rounded-2xl p-5 text-center space-y-4 ${connected ? "ring-2 ring-primary/30" : ""}`}>
          
          <AnimatePresence mode="wait">
            {/* Pairing / Loading state */}
            {pairing && (
              <motion.div key="pairing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="py-6 space-y-5">
                <div className="relative w-20 h-20 mx-auto">
                  <motion.div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bluetooth className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-display font-bold text-foreground text-base">Scanning for collar…</p>
                  <p className="text-xs text-muted-foreground font-body">
                    Select your ESP32-C3 device from the browser popup
                  </p>
                </div>
                <motion.div className="flex justify-center gap-1.5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Paired Successfully state */}
            {justPaired && connected && !pairing && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }} className="py-6 space-y-4">
                <motion.div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                  <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.3 }}>
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={2} />
                  </motion.div>
                </motion.div>
                <div className="space-y-1">
                  <motion.p className="font-display font-bold text-foreground text-lg flex items-center justify-center gap-2"
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Sparkles className="w-4 h-4 text-amber-500" /> Paired Successfully!
                  </motion.p>
                  <motion.p className="text-sm text-muted-foreground font-body"
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                    Connected to <span className="font-semibold text-foreground">{deviceName ?? "Pawsitive Collar"}</span>
                  </motion.p>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  className="text-xs text-emerald-600 font-body">
                  Live sensor data streaming…
                </motion.div>
              </motion.div>
            )}

            {/* Reconnecting state */}
            {reconnecting && !pairing && (
              <motion.div key="reconnecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-sm font-display font-semibold text-amber-500">Reconnecting…</span>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  Attempt {reconnectAttempt} of 5 — trying to restore connection to {deviceName ?? "collar"}
                </p>
              </motion.div>
            )}

            {/* Connected (normal) state */}
            {connected && !reconnecting && !justPaired && !pairing && (
              <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <motion.div className="w-3 h-3 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="text-sm font-display font-semibold text-emerald-500">Connected via BLE</span>
                  <Badge variant="outline" className="text-[10px]">{deviceName ?? "Pawsitive Collar"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  Monitoring for {Math.floor(secondsActive / 60)}m {secondsActive % 60}s
                </p>
                <Button onClick={stopMonitoring} variant="outline"
                  className="rounded-xl h-10 px-6 font-body border-destructive/30 text-destructive hover:bg-destructive/10">
                  <BluetoothOff className="w-4 h-4 mr-2" /> Disconnect
                </Button>
              </motion.div>
            )}

            {/* Disconnected state */}
            {!connected && !reconnecting && !pairing && (
              <motion.div key="disconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <Bluetooth className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
                <div>
                  <p className="font-display font-semibold text-foreground text-sm">Pair Your Collar</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Make sure your ESP32-C3 collar is powered on and Bluetooth is enabled on your device
                  </p>
                </div>
                <Button onClick={handleScanClick}
                  className="gradient-primary text-primary-foreground rounded-xl h-11 px-8 font-body shadow-glow-sm">
                  <Bluetooth className="w-4 h-4 mr-2" />
                  Scan & Connect
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Live Sensor Panel */}
        {connected && (
          <LiveSensorPanel
            connected={connected}
            secondsActive={secondsActive}
            latest={latest}
            readings={readings}
            onStart={startMonitoring}
            onStop={stopMonitoring}
            sensorType="collar"
            gradient="gradient-primary"
          />
        )}

        {/* Live Sensor Readings - quick glance cards */}
        {connected && latest && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h3 className="font-display font-semibold text-foreground text-sm tracking-tight flex items-center gap-2 px-1">
              <Activity className="w-4 h-4 text-primary" /> Sensor Overview
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4 text-center space-y-1">
                <AudioLines className="w-5 h-5 text-amber-500 mx-auto" strokeWidth={2} />
                <p className="text-lg font-display font-bold text-foreground">{latest.bark_spike ?? 0}</p>
                <p className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">Bark</p>
                <span className={`text-[10px] font-body font-medium ${getBarkLevel(latest.bark_spike ?? 0).color}`}>
                  {getBarkLevel(latest.bark_spike ?? 0).label}
                </span>
              </div>

              <div className={`glass rounded-2xl p-4 text-center space-y-1 ${getGasLevel(latest.ammonia_ppm ?? 0).bg}`}>
                <Wind className="w-5 h-5 text-blue-500 mx-auto" strokeWidth={2} />
                <p className="text-lg font-display font-bold text-foreground">{latest.ammonia_ppm ?? 0}</p>
                <p className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">Gas PPM</p>
                <span className={`text-[10px] font-body font-medium ${getGasLevel(latest.ammonia_ppm ?? 0).color}`}>
                  {getGasLevel(latest.ammonia_ppm ?? 0).label}
                </span>
              </div>

              <div className="glass rounded-2xl p-4 text-center space-y-1">
                <Activity className="w-5 h-5 text-emerald-500 mx-auto" strokeWidth={2} />
                <p className="text-lg font-display font-bold text-foreground">{latest.scratch_intensity ?? 0}</p>
                <p className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">Scratch</p>
                <span className="text-[10px] font-body font-medium text-muted-foreground">intensity</span>
              </div>
            </div>
          </motion.div>
        )}


      </div>
    </AppLayout>
  );
};

export default CollarConnect;
