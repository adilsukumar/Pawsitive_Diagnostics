import { motion, useScroll, useTransform } from "framer-motion";

const items = [
  // === BIG elements (deep, slow) ===
  { emoji: "🐾", x: "2%", y: "6%", size: 56, duration: 28, delay: 0, layer: 0.08 },
  { emoji: "🦴", x: "78%", y: "3%", size: 52, duration: 30, delay: 1.5, layer: 0.09 },
  { emoji: "🐕", x: "58%", y: "10%", size: 54, duration: 32, delay: 3, layer: 0.07 },
  { emoji: "🐶", x: "4%", y: "45%", size: 50, duration: 34, delay: 5, layer: 0.08 },
  { emoji: "🦴", x: "10%", y: "72%", size: 48, duration: 26, delay: 2, layer: 0.1 },
  { emoji: "🐾", x: "72%", y: "80%", size: 46, duration: 29, delay: 4, layer: 0.09 },
  { emoji: "🐕", x: "88%", y: "55%", size: 44, duration: 27, delay: 6, layer: 0.1 },

  // === MEDIUM elements ===
  { emoji: "🐾", x: "45%", y: "55%", size: 28, duration: 20, delay: 1, layer: 0.25 },
  { emoji: "🦴", x: "35%", y: "22%", size: 26, duration: 19, delay: 2.5, layer: 0.28 },
  { emoji: "🐶", x: "82%", y: "32%", size: 24, duration: 18, delay: 0.5, layer: 0.3 },
  { emoji: "🎾", x: "20%", y: "58%", size: 26, duration: 21, delay: 3, layer: 0.22 },
  { emoji: "🧸", x: "68%", y: "68%", size: 28, duration: 22, delay: 1.5, layer: 0.24 },
  { emoji: "🦮", x: "52%", y: "38%", size: 24, duration: 17, delay: 4.5, layer: 0.27 },
  { emoji: "🐾", x: "90%", y: "15%", size: 22, duration: 16, delay: 5.5, layer: 0.3 },
  { emoji: "🦴", x: "62%", y: "92%", size: 24, duration: 20, delay: 2, layer: 0.26 },
  { emoji: "🎾", x: "8%", y: "30%", size: 22, duration: 18, delay: 3.5, layer: 0.28 },

  // === SMALL elements (close, fast) ===
  { emoji: "🐾", x: "30%", y: "40%", size: 14, duration: 13, delay: 2, layer: 0.45 },
  { emoji: "🦴", x: "55%", y: "85%", size: 12, duration: 11, delay: 0, layer: 0.5 },
  { emoji: "🐶", x: "18%", y: "15%", size: 13, duration: 12, delay: 4, layer: 0.48 },
  { emoji: "🎾", x: "92%", y: "48%", size: 11, duration: 10, delay: 1, layer: 0.52 },
  { emoji: "🧸", x: "42%", y: "5%", size: 12, duration: 11, delay: 3, layer: 0.5 },
  { emoji: "🦮", x: "75%", y: "72%", size: 13, duration: 12, delay: 5, layer: 0.47 },
  { emoji: "🐾", x: "65%", y: "28%", size: 10, duration: 10, delay: 6, layer: 0.55 },
  { emoji: "🦴", x: "25%", y: "88%", size: 11, duration: 11, delay: 2.5, layer: 0.5 },
  { emoji: "🎾", x: "48%", y: "48%", size: 10, duration: 9, delay: 1.5, layer: 0.55 },
];

const sparkles = Array.from({ length: 32 }, (_, i) => ({
  x: `${4 + Math.round((i * 31 + 17) % 92)}%`,
  y: `${2 + Math.round((i * 47 + 11) % 94)}%`,
  size: 2 + (i % 5),
  duration: 2.5 + (i % 5) * 1.1,
  delay: (i % 8) * 0.5,
  layer: 0.12 + (i % 4) * 0.12,
  color: i % 3 === 0 ? "--glow-primary" : i % 3 === 1 ? "--glow-blue" : "--glow-amber",
}));

const ParallaxItem = ({ item }: { item: typeof items[0] }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -240 * item.layer]);

  return (
    <motion.div
      className="absolute select-none will-change-transform"
      style={{
        left: item.x,
        top: item.y,
        fontSize: item.size,
        opacity: 0.06 + item.layer * 0.14,
        y,
        filter: `blur(${Math.max(0, (0.25 - item.layer) * 3.5)}px)`,
      }}
      animate={{
        y: [0, -30, 0, 22, 0],
        x: [0, 16, -12, 6, 0],
        rotate: [0, 12, -8, 5, 0],
        scale: [1, 1.1, 0.93, 1.05, 1],
      }}
      transition={{
        duration: item.duration,
        repeat: Infinity,
        delay: item.delay,
        ease: "easeInOut",
      }}
    >
      {item.emoji}
    </motion.div>
  );
};

const Sparkle = ({ spark }: { spark: typeof sparkles[0] }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -160 * spark.layer]);

  return (
    <motion.div
      className="absolute rounded-full will-change-transform"
      style={{
        left: spark.x,
        top: spark.y,
        width: spark.size,
        height: spark.size,
        y,
        background: `hsl(var(${spark.color}))`,
        boxShadow: `0 0 ${spark.size * 3}px hsl(var(${spark.color}) / 0.4)`,
      }}
      animate={{ opacity: [0, 0.7, 0], scale: [0.4, 1.5, 0.4] }}
      transition={{
        duration: spark.duration,
        repeat: Infinity,
        delay: spark.delay,
        ease: "easeInOut",
      }}
    />
  );
};

const AnimatedBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    {/* Ambient glow orbs */}
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full"
      style={{ left: "5%", top: "0%", background: "radial-gradient(circle, hsl(var(--glow-primary) / 0.13), transparent 70%)" }}
      animate={{ scale: [1, 1.4, 1], x: [0, 55, 0], y: [0, 40, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full"
      style={{ right: "0%", bottom: "5%", background: "radial-gradient(circle, hsl(var(--glow-blue) / 0.11), transparent 70%)" }}
      animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, -35, 0] }}
      transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 4 }}
    />
    <motion.div
      className="absolute w-[450px] h-[450px] rounded-full"
      style={{ left: "40%", top: "30%", background: "radial-gradient(circle, hsl(var(--glow-purple) / 0.09), transparent 70%)" }}
      animate={{ scale: [1, 1.35, 1], x: [0, -30, 0], y: [0, 45, 0] }}
      transition={{ duration: 21, repeat: Infinity, ease: "easeInOut", delay: 7 }}
    />

    {sparkles.map((spark, i) => (
      <Sparkle key={`s-${i}`} spark={spark} />
    ))}
    {items.map((item, i) => (
      <ParallaxItem key={`e-${i}`} item={item} />
    ))}
  </div>
);

export default AnimatedBackground;
