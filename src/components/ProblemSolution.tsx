import { motion } from "framer-motion";
import { DollarSign, Zap, Clock, Smartphone } from "lucide-react";

const problems = [
  { icon: DollarSign, problem: "Expensive Diagnostics", solution: "Cost-Effective Design", desc: "Uses affordable components, easily accessible and portable" },
  { icon: Zap, problem: "Limited Diagnostics", solution: "Three-in-One Detection", desc: "Combines BarkSense, SkinSense, and GutSense for complete monitoring" },
  { icon: Clock, problem: "Time Delays", solution: "ML-Powered Analysis", desc: "Advanced algorithms analyze in real-time, not days or weeks" },
  { icon: Smartphone, problem: "Limited Access", solution: "Phone-Based Scanner", desc: "Transforms any smartphone into a comprehensive diagnostic tool" },
];

const ProblemSolution = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            The Problem & <span className="text-gradient-teal">Our Solution</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Traditional pet healthcare has gaps. We're filling them with machine learning.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((item, i) => (
            <motion.div
              key={item.problem}
              className="group relative bg-card rounded-2xl p-8 shadow-soft hover:shadow-lg transition-all border border-border"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl gradient-teal flex items-center justify-center shrink-0">
                  <item.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground line-through mb-1">{item.problem}</p>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.solution}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
