import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { EmotionKey, EmotionLog } from "@/hooks/useContinuousListening";

const emotionColors: Record<EmotionKey, string> = {
  normal: "#94a3b8",
  happy: "#f59e0b",
  pain: "#f43f5e",
  sad: "#3b82f6",
  afraid: "#a855f7",
  angry: "#dc2626",
};

const emotionEmojis: Record<EmotionKey, string> = {
  normal: "🐕", happy: "😊", pain: "🩹", sad: "😢", afraid: "😨", angry: "😤",
};

const EMOTIONS: EmotionKey[] = ["normal", "happy", "pain", "sad", "afraid", "angry"];

interface Props {
  logs: EmotionLog[];
}

const WeeklyEmotionTrends = ({ logs }: Props) => {
  const weekData = useMemo(() => {
    const days: { label: string; date: string; counts: Record<EmotionKey, number>; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = logs.filter((l) => l.created_at.startsWith(dateStr));
      const counts: Record<EmotionKey, number> = { normal: 0, happy: 0, pain: 0, sad: 0, afraid: 0, angry: 0 };
      dayLogs.forEach((l) => { if (counts[l.emotion] !== undefined) counts[l.emotion]++; });
      days.push({
        label: d.toLocaleDateString([], { weekday: "short" }),
        date: dateStr,
        counts,
        total: dayLogs.length,
      });
    }
    return days;
  }, [logs]);

  const maxTotal = Math.max(...weekData.map((d) => d.total), 1);

  // Dominant emotion of the week
  const weekTotals: Record<EmotionKey, number> = { normal: 0, happy: 0, pain: 0, sad: 0, afraid: 0, angry: 0 };
  weekData.forEach((d) => EMOTIONS.forEach((e) => { weekTotals[e] += d.counts[e]; }));
  const dominant = EMOTIONS.reduce((a, b) => (weekTotals[a] >= weekTotals[b] ? a : b));
  const totalWeek = Object.values(weekTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2} />
          <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Weekly Trends</h3>
        </div>
        {totalWeek > 0 && (
          <span className="text-[10px] font-body text-muted-foreground">
            Dominant: {emotionEmojis[dominant]} {dominant}
          </span>
        )}
      </div>

      {totalWeek === 0 ? (
        <p className="text-xs text-muted-foreground font-body">No data this week yet. Keep listening!</p>
      ) : (
        <>
          {/* Stacked bar chart */}
          <div className="flex items-end gap-1.5 h-28">
            {weekData.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col-reverse rounded-md overflow-hidden" style={{ height: `${(day.total / maxTotal) * 100}%`, minHeight: day.total > 0 ? 8 : 2 }}>
                  {EMOTIONS.map((emo) => {
                    const pct = day.total > 0 ? (day.counts[emo] / day.total) * 100 : 0;
                    return pct > 0 ? (
                      <motion.div
                        key={emo}
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        style={{ backgroundColor: emotionColors[emo] }}
                      />
                    ) : null;
                  })}
                  {day.total === 0 && <div className="w-full h-full bg-muted rounded-md" />}
                </div>
                <span className="text-[9px] font-body text-muted-foreground">{day.label}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <div key={e} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: emotionColors[e] }} />
                <span className="text-[9px] font-body text-muted-foreground capitalize">{e}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklyEmotionTrends;
