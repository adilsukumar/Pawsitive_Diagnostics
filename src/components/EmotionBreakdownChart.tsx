import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import type { EmotionKey, EmotionLog } from "@/hooks/useContinuousListening";

const EMOTION_CONFIG: Record<EmotionKey, { emoji: string; label: string; color: string }> = {
  normal: { emoji: "🐕", label: "Normal", color: "hsl(215, 15%, 55%)" },
  happy: { emoji: "😊", label: "Happy", color: "hsl(38, 92%, 50%)" },
  pain: { emoji: "🩹", label: "Pain", color: "hsl(347, 77%, 50%)" },
  sad: { emoji: "😢", label: "Sad", color: "hsl(217, 91%, 60%)" },
  afraid: { emoji: "😨", label: "Afraid", color: "hsl(271, 91%, 65%)" },
  angry: { emoji: "😤", label: "Angry", color: "hsl(0, 72%, 51%)" },
};

const ALL_EMOTIONS: EmotionKey[] = ["normal", "happy", "pain", "sad", "afraid", "angry"];

interface Props {
  logs: EmotionLog[];
  listening?: boolean;
  analyzing?: boolean;
}

const EmotionBreakdownChart = ({ logs, listening, analyzing }: Props) => {
  const data = useMemo(() => {
    const counts: Record<EmotionKey, number> = { normal: 0, happy: 0, pain: 0, sad: 0, afraid: 0, angry: 0 };
    logs.forEach((l) => {
      if (counts[l.emotion] !== undefined) counts[l.emotion]++;
    });
    const total = logs.length || 1;
    return ALL_EMOTIONS.map((key) => ({
      name: EMOTION_CONFIG[key].label,
      emoji: EMOTION_CONFIG[key].emoji,
      value: counts[key],
      pct: Math.round((counts[key] / total) * 100),
      color: EMOTION_CONFIG[key].color,
    })).filter((d) => d.value > 0);
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="glass rounded-2xl p-5 text-center">
        {listening ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground font-body font-medium">
              {analyzing ? "🔍 Analyzing audio chunk…" : "🎙️ Recording — first analysis in ~8 seconds…"}
            </p>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-body">No bark data yet — start listening to see the breakdown</p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <h3 className="font-display font-semibold text-foreground text-sm tracking-tight mb-3">
        🎯 Live Emotion Breakdown
      </h3>

      <div className="flex items-center gap-4">
        {/* Pie Chart */}
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={24}
                outerRadius={48}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} detections`, name]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with percentages */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {ALL_EMOTIONS.map((key) => {
            const cfg = EMOTION_CONFIG[key];
            const item = data.find((d) => d.name === cfg.label);
            const pct = item?.pct || 0;
            const count = item?.value || 0;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-xs shrink-0">{cfg.emoji}</span>
                <span className="text-[10px] font-body text-muted-foreground w-11 shrink-0">{cfg.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                </div>
                <span className="text-[10px] font-bold font-body w-8 text-right shrink-0" style={{ color: cfg.color }}>
                  {pct}%
                </span>
                <span className="text-[9px] text-muted-foreground w-4 text-right shrink-0">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground font-body mt-3 text-center uppercase tracking-widest">
        Based on {logs.length} detection{logs.length !== 1 ? "s" : ""} · Updates live every 8s
      </p>
    </motion.div>
  );
};

export default EmotionBreakdownChart;
