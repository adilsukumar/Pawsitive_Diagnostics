import { motion } from "framer-motion";
import { Mic, Camera, BarChart3, Activity, Shield, TrendingDown } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "BarkSense ML",
    subtitle: "Translating Barks into Insights",
    color: "bg-teal",
    items: ["Emotional state detection", "Playful, anxious & distress barks", "Age, gender & breed patterns", "24-hour vocalization tracking"],
  },
  {
    icon: Camera,
    title: "SkinSense ML",
    subtitle: "Uncovering Skin Issues with Light",
    color: "bg-coral",
    items: ["Multi-spectrum LED analysis", "Parasite & tick detection", "Fungal infection screening", "Bacterial overgrowth alerts"],
  },
  {
    icon: BarChart3,
    title: "GutSense ML",
    subtitle: "Your At-Home Fecal Lab",
    color: "bg-gold",
    items: ["Tapeworm & roundworm detection", "Color & texture analysis", "85% parasite detection accuracy", "Simple 3-step process"],
  },
];

const benefits = [
  { icon: Activity, title: "Proactive Care", desc: "From reactive to proactive monitoring" },
  { icon: Shield, title: "Early Intervention", desc: "Timely detection of health issues" },
  { icon: TrendingDown, title: "Reduced Costs", desc: "Preventative care saves money" },
];

const Features = () => {
  return (
    <section className="py-24 gradient-mint">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Three Sensors, <span className="text-gradient-teal">One App</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive machine learning-powered diagnostics from bark to tail.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="bg-popover rounded-3xl p-8 shadow-soft border border-border hover:-translate-y-2 transition-transform"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className={`w-16 h-16 rounded-2xl ${f.color} flex items-center justify-center mb-6`}>
                <f.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-muted-foreground mb-6">{f.subtitle}</p>
              <ul className="space-y-3">
                {f.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Benefits strip */}
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              className="flex items-center gap-4 bg-popover rounded-2xl p-6 shadow-soft border border-border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <b.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">{b.title}</h4>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
