import { motion } from "framer-motion";
import heroDog from "@/assets/hero-dog.jpg";
import { Mic, Camera, BarChart3 } from "lucide-react";

const Hero = () => {
  return (
    <section className="gradient-hero min-h-screen flex items-center overflow-hidden">
      <div className="container mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
        {/* Left */}
        <motion.div
          className="flex-1 space-y-8"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium tracking-wide">
            One App. Three Sensors. Complete Health Check
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-900 tracking-tight text-foreground leading-[1.05]">
            Pawsitive
            <br />
            <span className="text-gradient-teal">Diagnosis</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-lg">
            When they can't speak.{" "}
            <span className="font-semibold text-foreground">Diseases do.</span>
          </p>

          <div className="space-y-4 pt-2">
            {[
              { icon: Mic, name: "BarkSense ML", desc: "Translating Barks into Insights" },
              { icon: Camera, name: "SkinSense ML", desc: "Uncovering Dangerous Skin Issues" },
              { icon: BarChart3, name: "GutSense ML", desc: "Your In-Home Fecal Lab" },
            ].map((item, i) => (
              <motion.div
                key={item.name}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground">
                  <span className="font-semibold">{item.name}:</span>{" "}
                  <span className="text-muted-foreground">{item.desc}</span>
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <a href="/auth" className="px-8 py-4 rounded-2xl gradient-teal text-primary-foreground font-semibold text-lg shadow-soft hover:scale-105 transition-transform">
              Get Started
            </a>
            <a href="#features" className="px-8 py-4 rounded-2xl border-2 border-primary text-primary font-semibold text-lg hover:bg-secondary transition-colors">
              Learn More
            </a>
          </motion.div>
        </motion.div>

        {/* Right - Hero Image */}
        <motion.div
          className="flex-1 flex justify-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-mint glow-mint scale-110" />
            <img
              src={heroDog}
              alt="Happy golden retriever"
              className="relative w-80 h-80 md:w-[28rem] md:h-[28rem] rounded-full object-cover border-8 border-mint shadow-soft"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
