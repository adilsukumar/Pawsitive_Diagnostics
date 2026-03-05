import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, PawPrint, TrendingUp, ChevronRight, Activity, AudioLines, ScanEye, Wind, History, BookOpen, Sparkles, RefreshCw, Bluetooth, Radio, FlaskConical, Plus, X, Calendar, MapPin, Video, Star, Send, QrCode } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useDailyInsight } from "@/hooks/useDailyInsight";
import { useGlobalSensorData } from "@/contexts/LiveSensorContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const sensors = [
  {
    type: "bark",
    title: "BarkSense AI",
    desc: "AI vocal & emotional analysis",
    icon: AudioLines,
    gradient: "gradient-bark",
    glowColor: "hsl(38 95% 55% / 0.15)",
    to: "/bark-sense",
  },
  {
    type: "skin",
    title: "SkinSense AI",
    desc: "AI skin condition analysis & diagnosis",
    icon: ScanEye,
    gradient: "gradient-skin",
    glowColor: "hsl(340 75% 55% / 0.15)",
    to: "/skin-sense",
  },
  {
    type: "air",
    title: "AirSense AI",
    desc: "Environmental air quality monitoring",
    icon: Wind,
    gradient: "gradient-air",
    glowColor: "hsl(180 90% 55% / 0.15)",
    to: "/air-sense",
  },
  {
    type: "motion",
    title: "MotionSense AI",
    desc: "Real-time motion & activity tracking",
    icon: Activity,
    gradient: "gradient-motion",
    glowColor: "hsl(250 90% 55% / 0.15)",
    to: "/motion-sense",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const Dashboard = () => {
  const { insight, loading: insightLoading, refresh: refreshInsight } = useDailyInsight();
  const sensorData = useGlobalSensorData();
  const { toast } = useToast();
  
  // Get current active dog from dogs_profiles array
  const activeDogId = localStorage.getItem("active_dog_id") || "1";
  const dogs = JSON.parse(localStorage.getItem("dogs_profiles") || "[]");
  const activeDog = dogs.find((d: any) => d.id === activeDogId) || { name: "My Dog", breed: "Mixed", age: "2 years", photo: null };

  // Auto-start all monitoring when BLE collar connects (but not if user manually stopped)
  const manuallyStoppedRef = useRef(false);
  useEffect(() => {
    if (sensorData.bleConnected && !sensorData.connected && !manuallyStoppedRef.current) {
      sensorData.startMonitoring();
      toast({ 
        title: "📡 All sensors activated", 
        description: "BLE collar connected - all monitoring started" 
      });
    }
  }, [sensorData.bleConnected, sensorData.connected, sensorData.startMonitoring, toast]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const handleToggleAll = () => {
    if (sensorData.connected) {
      manuallyStoppedRef.current = true;
      sensorData.stopMonitoring();
      toast({ title: "⏹️ All monitoring stopped", description: `Monitored for ${formatTime(sensorData.secondsActive)}` });
    } else {
      manuallyStoppedRef.current = false;
      sensorData.startMonitoring();
      toast({ title: "📡 All sensors live", description: "Bark · Air · Motion · Skin — ESP32 collar active" });
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-5 min-h-full">
        {/* Active Dog Profile */}
        <Link to="/dog-profile">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            whileTap={{ scale: 0.97 }}
            className="glass rounded-2xl p-4 flex items-center gap-4 btn-squishy relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-40" style={{ background: "radial-gradient(circle, hsl(170 80% 45% / 0.2), transparent)" }} />

            <div className="w-14 h-14 rounded-xl ring-2 ring-primary/20 overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
              {activeDog?.photo ? (
                <img src={activeDog.photo} alt={activeDog.name} className="w-full h-full object-cover" />
              ) : (
                <PawPrint className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Active Profile</p>
              <h1 className="text-lg font-display font-bold text-foreground truncate tracking-tight">
                {activeDog ? `${activeDog.name}'s Health` : "Pawsitive Diagnosis"}
              </h1>
              <p className="text-xs text-primary font-body font-medium flex items-center gap-1 mt-0.5">
                <Heart className="w-3 h-3" fill="currentColor" />
                {activeDog ? `${activeDog.age} • ${activeDog.breed}` : "Set up profile"}
                <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </motion.div>
        </Link>

        {/* Daily Insight */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
          className="glass rounded-2xl p-4 relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent)" }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow-sm shrink-0">
                  {insightLoading ? (
                    <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" strokeWidth={2} />
                  ) : (
                    <span className="text-sm">{insight?.emoji || "🐾"}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" strokeWidth={2.5} />
                  <p className="text-[10px] text-primary font-body font-semibold uppercase tracking-widest">Daily Insight</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.85, rotate: 180 }}
                onClick={refreshInsight}
                disabled={insightLoading}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${insightLoading ? "animate-spin" : ""}`} strokeWidth={2} />
              </motion.button>
            </div>

            {insightLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-2/3 rounded-lg bg-muted animate-pulse" />
                <div className="h-3 w-full rounded-lg bg-muted animate-pulse" />
                <div className="h-3 w-3/4 rounded-lg bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <h3 className="font-body font-semibold text-foreground text-base tracking-tight leading-tight mb-1.5">
                  {insight?.title || "Stay Active!"}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-body text-sm">
                  {insight?.fact || "Regular walks and a balanced diet keep your pup healthy."}
                </p>
              </>
            )}
          </div>
        </motion.div>

        {/* Collar Control Hub */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, type: "spring", stiffness: 300, damping: 24 }}
        >
          <Link to="/collar">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className={`glass rounded-2xl p-4 relative overflow-hidden btn-squishy ${
                sensorData.connected ? "ring-2 ring-primary/30" : sensorData.bleConnected ? "ring-2 ring-blue-500/30" : ""
              }`}
            >
              {(sensorData.connected || sensorData.bleConnected) && (
                <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at center, hsl(var(--primary) / 0.4), transparent 70%)" }} />
              )}
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${
                  sensorData.connected ? "gradient-primary" : sensorData.bleConnected ? "bg-blue-500" : "bg-secondary"
                } flex items-center justify-center shrink-0 shadow-glow-sm transition-all`}>
                  {sensorData.connected ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <Radio className="w-6 h-6 text-white" strokeWidth={2} />
                    </motion.div>
                  ) : (
                    <Bluetooth className="w-6 h-6 text-white" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground tracking-tight">
                    {sensorData.connected ? "Live Monitoring Active" : sensorData.bleConnected ? "Collar Connected" : "Collar Control Hub"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {sensorData.connected
                      ? `Active for ${formatTime(sensorData.secondsActive)} · Tap to manage`
                      : sensorData.bleConnected
                      ? "Ready to monitor · Tap to start"
                      : "Connect Smart Collar via Bluetooth"}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${
                    sensorData.connected ? "bg-primary animate-pulse" : sensorData.bleConnected ? "bg-blue-500 animate-pulse" : "bg-muted-foreground/30"
                  }`} />
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Live Sensor Summary */}
        {sensorData.connected && sensorData.latest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-4 space-y-3 ring-1 ring-primary/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-display font-semibold text-primary uppercase tracking-widest">Live Readings</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <AudioLines className="w-4 h-4 text-amber-500 mx-auto mb-1" strokeWidth={2} />
                <p className="text-lg font-display font-bold text-foreground">{sensorData.latest.bark_spike ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground font-body">Bark Spike</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <FlaskConical className="w-4 h-4 text-blue-500 mx-auto mb-1" strokeWidth={2} />
                <p className="text-lg font-display font-bold text-foreground">{sensorData.latest.methane_ppm?.toFixed(1) ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground font-body">Methane ppm</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <ScanEye className="w-4 h-4 text-pink-500 mx-auto mb-1" strokeWidth={2} />
                <p className="text-lg font-display font-bold text-foreground">{sensorData.latest.scratch_intensity?.toFixed(1) ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground font-body">Scratch</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div>
                  <p className="text-xs font-display font-semibold text-foreground">{sensorData.latest.ammonia_ppm?.toFixed(1) ?? "—"} ppm</p>
                  <p className="text-[10px] text-muted-foreground font-body">Ammonia</p>
                </div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-xs font-display font-semibold text-foreground">{sensorData.latest.co2_ppm?.toFixed(1) ?? "—"} ppm</p>
                  <p className="text-[10px] text-muted-foreground font-body">CO₂</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sensor Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {sensors.map((s) => (
            <motion.div key={s.type} variants={item}>
              <Link to={s.to}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="glass rounded-2xl p-4 flex items-center gap-4 btn-squishy relative overflow-hidden group"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: `radial-gradient(ellipse at 30% 50%, ${s.glowColor}, transparent 70%)` }}
                  />
                  <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center shrink-0 shadow-glow-sm relative z-10`}>
                    <s.icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <h3 className="font-display font-semibold text-foreground tracking-tight">{s.title}</h3>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{s.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground relative z-10 group-hover:text-primary transition-colors" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Breed Encyclopedia */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 24 }}
        >
          <Link to="/breed-encyclopedia">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="glass rounded-2xl p-4 flex items-center gap-4 btn-squishy relative overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: "radial-gradient(ellipse at 30% 50%, hsl(170 80% 45% / 0.12), transparent 70%)" }} />
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm shrink-0 relative z-10">
                <BookOpen className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
              </div>
              <div className="flex-1 relative z-10">
                <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Breed Encyclopedia</h3>
                <p className="text-xs text-muted-foreground font-body">Diet, behavior, habits & more</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground relative z-10 group-hover:text-primary transition-colors" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Scan History Link */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, type: "spring", stiffness: 300, damping: 24 }}
        >
          <Link to="/scan-history">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="glass rounded-2xl p-4 flex items-center gap-4 btn-squishy"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-glow-sm shrink-0">
                <History className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Scan History</h3>
                <p className="text-xs text-muted-foreground font-body">Health trends & past results</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Veterinary Services */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, type: "spring", stiffness: 300, damping: 24 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-display font-semibold text-foreground px-1">Veterinary Services</h3>
          
          <div className="grid grid-cols-3 gap-3">
            <Link to="/vet-services?tab=book">
              <motion.div whileTap={{ scale: 0.97 }} className="glass rounded-2xl p-4 text-center btn-squishy space-y-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm mx-auto">
                  <Calendar className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
                </div>
                <p className="font-display font-semibold text-foreground text-xs tracking-tight">Book</p>
                <p className="text-[10px] text-muted-foreground font-body">Appointment</p>
              </motion.div>
            </Link>
            
            <Link to="/vet-services?tab=clinics">
              <motion.div whileTap={{ scale: 0.97 }} className="glass rounded-2xl p-4 text-center btn-squishy space-y-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-glow-sm mx-auto">
                  <MapPin className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <p className="font-display font-semibold text-foreground text-xs tracking-tight">Find</p>
                <p className="text-[10px] text-muted-foreground font-body">Clinics</p>
              </motion.div>
            </Link>
            
            <Link to="/vet-services?tab=video">
              <motion.div whileTap={{ scale: 0.97 }} className="glass rounded-2xl p-4 text-center btn-squishy space-y-2">
                <div className="w-10 h-10 rounded-xl gradient-bark flex items-center justify-center shadow-glow-sm mx-auto">
                  <Video className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
                </div>
                <p className="font-display font-semibold text-foreground text-xs tracking-tight">Video</p>
                <p className="text-[10px] text-muted-foreground font-body">Consult</p>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Share Reports */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, type: "spring", stiffness: 300, damping: 24 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-display font-semibold text-foreground px-1">Share Reports</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to="/vet-services?tab=send">
              <motion.div whileTap={{ scale: 0.97 }} className="glass rounded-2xl p-4 text-center btn-squishy space-y-2">
                <div className="w-10 h-10 rounded-xl gradient-motion flex items-center justify-center shadow-glow-sm mx-auto">
                  <Send className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
                </div>
                <p className="font-display font-semibold text-foreground text-xs tracking-tight">Send Report</p>
                <p className="text-[10px] text-muted-foreground font-body">Email or WhatsApp</p>
              </motion.div>
            </Link>
            
            <Link to="/install">
              <motion.div whileTap={{ scale: 0.97 }} className="glass rounded-2xl p-4 text-center btn-squishy space-y-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-glow-sm mx-auto">
                  <QrCode className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <p className="font-display font-semibold text-foreground text-xs tracking-tight">QR Report</p>
                <p className="text-[10px] text-muted-foreground font-body">Scan & share</p>
              </motion.div>
            </Link>
          </div>
        </motion.div>



      </div>
    </AppLayout>
  );
};

export default Dashboard;
