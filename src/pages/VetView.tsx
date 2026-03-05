import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { PawPrint, AudioLines, ScanEye, FlaskConical, AlertTriangle, Heart, Calendar, Weight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import AnimatedBackground from "@/components/AnimatedBackground";

interface VetShareData {
  id: string;
  dog_name: string | null;
  dog_breed: string | null;
  dog_age: string | null;
  dog_weight: string | null;
  dog_photo: string | null;
  scan_history: any[];
  emotion_logs: any[];
  sensor_readings: any[];
  created_at: string;
}

const severityColor: Record<string, string> = {
  normal: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  mild: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  moderate: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  severe: "bg-destructive/20 text-destructive border border-destructive/30",
};

const sensorIcons: Record<string, any> = {
  bark: AudioLines,
  skin: ScanEye,
  poop: FlaskConical,
};

const sensorGradients: Record<string, string> = {
  bark: "gradient-bark",
  skin: "gradient-skin",
  poop: "gradient-poop",
};

const VetView = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VetShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!id) { setError("No share ID"); setLoading(false); return; }
      const { data: row, error: err } = await supabase
        .from("vet_shares")
        .select("*")
        .eq("id", id)
        .single();
      if (err || !row) { setError("Share not found or expired"); setLoading(false); return; }
      setData(row as unknown as VetShareData);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 gradient-mesh opacity-60" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <motion.div
        className="absolute w-52 h-52 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(170 80% 45% / 0.25), transparent 70%)" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="relative z-10" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 150, damping: 15 }}>
        <div className="w-36 h-36 rounded-full bg-secondary shadow-glow ring-2 ring-primary/30 flex items-center justify-center">
          <PawPrint className="w-14 h-14 text-primary" strokeWidth={1.5} />
        </div>
      </motion.div>
      <motion.div className="relative z-10 mt-8 w-32 h-1 rounded-full bg-secondary overflow-hidden"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <motion.div className="h-full rounded-full gradient-primary"
          initial={{ width: "0%" }} animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }} />
      </motion.div>
      <motion.div className="relative z-10 mt-6 flex items-center gap-2.5"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}>
        <PawPrint className="w-6 h-6 text-primary" strokeWidth={2} />
        <span className="text-2xl font-display font-bold text-foreground tracking-tight">Pawsitive</span>
      </motion.div>
      <motion.p className="relative z-10 text-xs text-muted-foreground font-body mt-1 tracking-widest uppercase"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Loading Vet Report
      </motion.p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <AnimatedBackground />
      <div className="glass rounded-2xl p-8 text-center max-w-sm">
        <PawPrint className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display font-bold text-foreground text-lg mb-2">Share Not Found</h2>
        <p className="text-muted-foreground text-sm font-body">{error}</p>
      </div>
    </div>
  );

  const painAlerts = (data.emotion_logs || []).filter((l: any) => l.emotion === "pain");
  const sadAlerts = (data.emotion_logs || []).filter((l: any) => l.emotion === "sad");
  const scanHistory = data.scan_history || [];
  const barkScans = scanHistory.filter((s: any) => s.sensor_type === "bark");
  const skinScans = scanHistory.filter((s: any) => s.sensor_type === "skin");
  const poopScans = scanHistory.filter((s: any) => s.sensor_type === "poop");

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto shadow-glow-sm">
            <Heart className="w-6 h-6 text-primary-foreground" strokeWidth={2} />
          </div>
          <p className="text-[10px] text-primary font-display font-semibold uppercase tracking-widest">Veterinary Report</p>
          <p className="text-[10px] text-muted-foreground font-body">
            Generated {new Date(data.created_at).toLocaleDateString()} · Pawsitive Diagnosis
          </p>
        </motion.div>

        {/* Dog Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl ring-2 ring-primary/20 overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
            {data.dog_photo ? (
              <img src={data.dog_photo} alt={data.dog_name || "Dog"} className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
              {data.dog_name || "Unknown"}
            </h1>
            <div className="flex flex-wrap gap-2">
              {data.dog_breed && (
                <Badge variant="outline" className="text-[10px] font-body border-primary/30 text-primary">
                  <PawPrint className="w-3 h-3 mr-1" /> {data.dog_breed}
                </Badge>
              )}
              {data.dog_age && (
                <Badge variant="outline" className="text-[10px] font-body border-muted-foreground/30">
                  <Calendar className="w-3 h-3 mr-1" /> {data.dog_age} yrs
                </Badge>
              )}
              {data.dog_weight && (
                <Badge variant="outline" className="text-[10px] font-body border-muted-foreground/30">
                  <Weight className="w-3 h-3 mr-1" /> {data.dog_weight} kg
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pain & Distress Alerts */}
        {(painAlerts.length > 0 || sadAlerts.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-4 space-y-3 ring-2 ring-destructive/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" strokeWidth={2} />
              <h2 className="font-display font-semibold text-destructive text-sm tracking-tight">⚠️ Pain & Distress Alerts</h2>
            </div>
            {painAlerts.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-display font-semibold text-foreground">
                  🚨 Pain detected {painAlerts.length} time{painAlerts.length > 1 ? "s" : ""}
                </p>
                {painAlerts.slice(0, 5).map((l: any, i: number) => (
                  <div key={i} className="bg-destructive/10 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-foreground font-body">{l.note || "Pain detected"}</span>
                    <span className="text-[10px] text-muted-foreground font-body">
                      {l.confidence}% · {new Date(l.timestamp || l.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {sadAlerts.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-display font-semibold text-foreground">
                  😢 Excessive sadness/crying: {sadAlerts.length} time{sadAlerts.length > 1 ? "s" : ""}
                </p>
                {sadAlerts.slice(0, 3).map((l: any, i: number) => (
                  <div key={i} className="bg-blue-500/10 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-foreground font-body">{l.note || "Sadness detected"}</span>
                    <span className="text-[10px] text-muted-foreground font-body">
                      {l.confidence}% · {new Date(l.timestamp || l.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Emotion Summary */}
        {data.emotion_logs && data.emotion_logs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AudioLines className="w-4 h-4 text-primary" strokeWidth={2} />
              <h2 className="font-display font-semibold text-foreground text-sm tracking-tight">Emotion History</h2>
              <Badge variant="outline" className="text-[10px] ml-auto">{data.emotion_logs.length} logs</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["happy", "pain", "sad", "afraid", "angry", "normal"].map((emotion) => {
                const count = data.emotion_logs.filter((l: any) => l.emotion === emotion).length;
                if (count === 0) return null;
                const emojis: Record<string, string> = { happy: "😊", pain: "🚨", sad: "😢", afraid: "😨", angry: "😤", normal: "🐕" };
                return (
                  <div key={emotion} className="bg-secondary/50 rounded-xl p-2.5 text-center">
                    <p className="text-lg">{emojis[emotion]}</p>
                    <p className="text-sm font-display font-bold text-foreground">{count}</p>
                    <p className="text-[10px] text-muted-foreground font-body capitalize">{emotion}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Diagnostic History by Type */}
        {[
          { label: "Bark Analysis History", scans: barkScans, type: "bark" },
          { label: "Skin Analysis History", scans: skinScans, type: "skin" },
          { label: "Poop Analysis History", scans: poopScans, type: "poop" },
        ].map(({ label, scans, type }) => {
          if (scans.length === 0) return null;
          const Icon = sensorIcons[type];
          return (
            <motion.div key={type} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${sensorGradients[type]} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                </div>
                <h2 className="font-display font-semibold text-foreground text-sm tracking-tight">{label}</h2>
                <Badge variant="outline" className="text-[10px] ml-auto">{scans.length}</Badge>
              </div>
              <div className="space-y-2">
                {scans.slice(0, 10).map((s: any, i: number) => (
                  <div key={i} className="bg-secondary/50 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {s.severity && (
                          <Badge className={`${severityColor[s.severity] || "bg-secondary"} rounded-md text-[10px] font-body`}>
                            {s.severity}
                          </Badge>
                        )}
                        {s.health_score != null && (
                          <span className="text-sm font-display font-bold text-foreground">{s.health_score}/100</span>
                        )}
                        {s.emotional_state && (
                          <Badge variant="outline" className="text-[10px] font-body capitalize">{s.emotional_state}</Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(s.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {s.summary && (
                      <p className="text-xs text-muted-foreground font-body leading-relaxed">{s.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Recent Sensor Readings */}
        {data.sensor_readings && data.sensor_readings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 space-y-3">
            <h2 className="font-display font-semibold text-foreground text-sm tracking-tight">📡 Recent Collar Readings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-body">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-1.5 pr-2">Time</th>
                    <th className="text-center py-1.5 px-1">Bark</th>
                    <th className="text-center py-1.5 px-1">NH₃</th>
                    <th className="text-center py-1.5 px-1">CH₄</th>
                    <th className="text-center py-1.5 px-1">Scratch</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sensor_readings.slice(0, 15).map((r: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1.5 pr-2 text-muted-foreground">{new Date(r.created_at).toLocaleTimeString()}</td>
                      <td className="text-center py-1.5 px-1 text-foreground font-semibold">{r.bark_spike ?? "—"}</td>
                      <td className="text-center py-1.5 px-1 text-foreground">{r.ammonia_ppm?.toFixed(1) ?? "—"}</td>
                      <td className="text-center py-1.5 px-1 text-foreground">{r.methane_ppm?.toFixed(1) ?? "—"}</td>
                      <td className="text-center py-1.5 px-1 text-foreground">{r.scratch_intensity?.toFixed(1) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center py-4 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <PawPrint className="w-4 h-4 text-primary" strokeWidth={2} />
            <span className="font-display font-bold text-gradient text-sm tracking-tight">Pawsitive Diagnosis</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-body">AI-powered pet health monitoring · For veterinary reference only</p>
        </motion.div>
      </div>
    </div>
  );
};

export default VetView;
