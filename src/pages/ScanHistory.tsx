import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AudioLines, ScanEye, FlaskConical, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import AppLayout from "@/components/AppLayout";
import { getScanHistory, ScanRecord } from "@/lib/scanHistory";

const sensorMeta: Record<string, { label: string; gradient: string; icon: typeof AudioLines }> = {
  bark: { label: "BarkSense", gradient: "gradient-bark", icon: AudioLines },
  skin: { label: "SkinSense", gradient: "gradient-skin", icon: ScanEye },
  poop: { label: "GutSense", gradient: "gradient-poop", icon: FlaskConical },
};

const severityColor: Record<string, string> = {
  normal: "gradient-primary text-white",
  mild: "bg-glow-amber/20 text-glow-amber border border-glow-amber/30",
  moderate: "bg-glow-rose/20 text-glow-rose border border-glow-rose/30",
  severe: "bg-destructive/20 text-destructive border border-destructive/30",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const ScanHistory = () => {
  const [records, setRecords] = useState<ScanRecord[]>(getScanHistory);
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (filter === "all" ? records : records.filter((r) => r.sensor_type === filter)),
    [records, filter]
  );

  const chartData = useMemo(() => {
    const withScores = filtered.filter((r) => r.health_score != null).reverse();
    return withScores.map((r) => ({
      date: new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: r.health_score,
    }));
  }, [filtered]);


  return (
    <AppLayout title="Scan History" showBack>
      <div className="px-4 py-6 space-y-5 min-h-full max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl gradient-electric flex items-center justify-center mx-auto shadow-glow-sm">
            <History className="w-6 h-6 text-primary-foreground" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-display font-bold text-foreground tracking-tight">Health Timeline</h2>
          <p className="text-sm text-muted-foreground font-body">{records.length} scans recorded</p>
        </motion.div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: "All" },
            { key: "bark", label: "Bark" },
            { key: "skin", label: "Skin" },
            { key: "poop", label: "Poop" },
          ].map((f) => (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-body font-medium whitespace-nowrap btn-squishy transition-all ${
                filter === f.key
                  ? "gradient-primary text-primary-foreground shadow-glow-sm"
                  : "glass text-muted-foreground"
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {/* Trend Chart */}
        {chartData.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="font-display font-semibold text-foreground text-sm mb-3 tracking-tight">Health Score Trend</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(210 10% 50%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(210 10% 50%)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(220 12% 20%)",
                    background: "hsl(220 18% 10%)",
                    color: "hsl(210 20% 95%)",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(170 80% 45%)" strokeWidth={2.5} dot={{ fill: "hsl(170 80% 45%)", r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Records list */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <History className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-display font-semibold text-foreground text-sm">No scans yet</p>
            <p className="text-xs text-muted-foreground font-body mt-1">Run a diagnostic to see results here.</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
            {filtered.map((r) => {
              const meta = sensorMeta[r.sensor_type];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={r.id}
                  variants={item}
                  className="glass rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${meta.gradient} flex items-center justify-center shrink-0 shadow-glow-sm`}>
                    <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-semibold text-foreground text-sm tracking-tight">{meta.label}</span>
                      {r.severity && (
                        <Badge className={`${severityColor[r.severity] || "bg-secondary"} rounded-md text-[10px] px-1.5 py-0 font-body`}>
                          {r.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-body truncate">
                      {r.emotional_state || r.summary || "Scan completed"}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-body mt-0.5">
                      {new Date(r.timestamp).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {r.health_score != null && (
                    <div className="text-right shrink-0">
                      <span className="text-lg font-display font-bold text-gradient">{r.health_score}</span>
                      <p className="text-[10px] text-muted-foreground font-body">/100</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

      </div>
    </AppLayout>
  );
};

export default ScanHistory;
