import { motion } from "framer-motion";
import { Radio, Square, Activity, Wind, AudioLines, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SensorReading } from "@/hooks/useLiveSensorData";

interface LiveSensorPanelProps {
  connected: boolean;
  secondsActive: number;
  latest: SensorReading | null;
  readings: SensorReading[];
  onStart: () => void;
  onStop: () => void;
  sensorType: "bark" | "skin" | "poop" | "collar";
  gradient: string;
}

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const getGasLevel = (ppm: number) => {
  if (ppm < 200) return { label: "Normal", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (ppm < 500) return { label: "Elevated", color: "text-glow-amber", bg: "bg-glow-amber/10" };
  return { label: "High", color: "text-destructive", bg: "bg-destructive/10" };
};

const getScratchLevel = (val: number) => {
  if (val < 3) return { label: "Calm", color: "text-emerald-500" };
  if (val < 8) return { label: "Mild", color: "text-glow-amber" };
  return { label: "Intense", color: "text-destructive" };
};

const getBarkLevel = (val: number) => {
  if (val < 100) return { label: "Quiet", color: "text-muted-foreground" };
  if (val < 500) return { label: "Mild", color: "text-glow-amber" };
  return { label: "Loud", color: "text-destructive" };
};

const LiveSensorPanel = ({ connected, secondsActive, latest, readings, onStart, onStop, sensorType, gradient }: LiveSensorPanelProps) => {
  if (!connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 text-center space-y-4">
        <Radio className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
        <div>
          <p className="font-display font-semibold text-foreground text-sm tracking-tight">24/7 Collar Monitoring</p>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Live sensor data from your ESP32-C3 smart collar
          </p>
        </div>
        <Button onClick={onStart} className={`${gradient} text-white rounded-xl h-11 px-8 btn-squishy font-body shadow-glow-sm w-full max-w-xs`}>
          <Activity className="w-4 h-4 mr-2" /> Start Live Monitoring
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 space-y-3 ring-2 ring-primary/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div className="w-3 h-3 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-sm font-display font-semibold text-emerald-500">Live</span>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {formatTime(secondsActive)}
          </Badge>
        </div>
        <Button onClick={onStop} variant="outline" size="sm"
          className="h-7 text-xs rounded-lg font-body border-destructive/30 text-destructive hover:bg-destructive/10">
          <Square className="w-3 h-3 mr-1" /> Stop
        </Button>
      </div>

      {latest && (
        <div className="space-y-3">
          {/* Sensor cards based on type */}
          {sensorType === "bark" && latest.bark_spike != null && (
            <div className="bg-secondary/30 rounded-xl p-4 text-center">
              <AudioLines className="w-6 h-6 text-glow-amber mx-auto mb-1" strokeWidth={2} />
              <p className="text-3xl font-display font-bold text-foreground">{latest.bark_spike}</p>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Bark Spike</p>
              <span className={`text-xs font-body font-medium ${getBarkLevel(latest.bark_spike).color}`}>
                {getBarkLevel(latest.bark_spike).label}
              </span>
            </div>
          )}

          {sensorType === "skin" && (
            <div className="grid grid-cols-2 gap-3">
              {latest.scratch_intensity != null && (
                <div className="bg-secondary/30 rounded-xl p-4 text-center">
                  <Activity className="w-5 h-5 text-glow-rose mx-auto mb-1" strokeWidth={2} />
                  <p className="text-2xl font-display font-bold text-foreground">{latest.scratch_intensity.toFixed(1)}</p>
                  <p className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">Scratch</p>
                  <span className={`text-[10px] font-body font-medium ${getScratchLevel(latest.scratch_intensity).color}`}>
                    {getScratchLevel(latest.scratch_intensity).label}
                  </span>
                </div>
              )}
              {latest.skin_status && (
                <div className="bg-secondary/30 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                  <Thermometer className="w-5 h-5 text-primary mx-auto mb-1" strokeWidth={2} />
                  <p className="text-sm font-display font-semibold text-foreground">{latest.skin_status}</p>
                  <p className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">Status</p>
                </div>
              )}
            </div>
          )}

          {sensorType === "poop" && (
            <div className="grid grid-cols-3 gap-2">
              {latest.ammonia_ppm != null && (
                <div className={`rounded-xl p-3 text-center ${getGasLevel(latest.ammonia_ppm).bg}`}>
                  <p className="text-lg font-display font-bold text-foreground">{latest.ammonia_ppm.toFixed(0)}</p>
                  <p className="text-[8px] text-muted-foreground font-body uppercase tracking-wider">NH₃ ppm</p>
                  <span className={`text-[10px] font-body font-medium ${getGasLevel(latest.ammonia_ppm).color}`}>
                    {getGasLevel(latest.ammonia_ppm).label}
                  </span>
                </div>
              )}
              {latest.methane_ppm != null && (
                <div className={`rounded-xl p-3 text-center ${getGasLevel(latest.methane_ppm).bg}`}>
                  <p className="text-lg font-display font-bold text-foreground">{latest.methane_ppm.toFixed(0)}</p>
                  <p className="text-[8px] text-muted-foreground font-body uppercase tracking-wider">CH₄ ppm</p>
                  <span className={`text-[10px] font-body font-medium ${getGasLevel(latest.methane_ppm).color}`}>
                    {getGasLevel(latest.methane_ppm).label}
                  </span>
                </div>
              )}
              {latest.co2_ppm != null && (
                <div className={`rounded-xl p-3 text-center ${getGasLevel(latest.co2_ppm).bg}`}>
                  <p className="text-lg font-display font-bold text-foreground">{latest.co2_ppm.toFixed(0)}</p>
                  <p className="text-[8px] text-muted-foreground font-body uppercase tracking-wider">CO₂ ppm</p>
                  <span className={`text-[10px] font-body font-medium ${getGasLevel(latest.co2_ppm).color}`}>
                    {getGasLevel(latest.co2_ppm).label}
                  </span>
                </div>
              )}
            </div>
          )}


          {/* Recent readings feed */}
          {readings.length > 1 && (
            <div className="bg-secondary/30 rounded-xl p-3 max-h-28 overflow-y-auto">
              <p className="text-[10px] font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Recent</p>
              <div className="space-y-0.5">
                {readings.slice(0, 15).map((r, i) => {
                  const time = new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                  return (
                    <div key={r.id || i} className="flex items-center justify-between text-[10px] font-body text-muted-foreground">
                      <span>{time}</span>
                      <div className="flex gap-2">
                        {sensorType === "bark" && r.bark_spike != null && <span>🎤{r.bark_spike}</span>}
                        {sensorType === "skin" && r.scratch_intensity != null && <span>🐾{r.scratch_intensity.toFixed(1)}</span>}
                        {sensorType === "poop" && r.ammonia_ppm != null && <span>NH₃:{r.ammonia_ppm.toFixed(0)}</span>}
                        {sensorType === "poop" && r.methane_ppm != null && <span>CH₄:{r.methane_ppm.toFixed(0)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!latest && (
        <div className="text-center py-4">
          <motion.div className="flex gap-0.5 items-end h-5 justify-center">
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} className="w-1 rounded-full bg-primary/60"
                animate={{ height: [3, 12, 5, 16, 6, 10, 3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.06 }} />
            ))}
          </motion.div>
          <p className="text-xs text-muted-foreground font-body mt-2">Waiting for collar data...</p>
        </div>
      )}
    </motion.div>
  );
};

export default LiveSensorPanel;
