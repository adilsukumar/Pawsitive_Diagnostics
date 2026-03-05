import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          className="gradient-teal rounded-3xl p-12 md:p-20 text-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--teal-light)/0.3),transparent_70%)]" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-6">
              Ready to Transform Pet Care?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-10">
              Join thousands of pet owners using machine learning-powered diagnostics for early detection and proactive health monitoring.
            </p>
            <a href="/auth" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-popover text-primary font-bold text-lg hover:scale-105 transition-transform shadow-lg">
              Get Pawsitive Diagnosis
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
