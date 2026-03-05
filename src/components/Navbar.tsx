import { Link } from "react-router-dom";
import { PawPrint, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <PawPrint className="w-7 h-7 text-primary" />
          <span className="text-xl font-display font-bold text-foreground">Pawsitive</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</a>
          <a href="#solution" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Solution</a>
          <Link to="/auth" className="px-5 py-2 rounded-xl gradient-teal text-primary-foreground text-sm font-semibold hover:scale-105 transition-transform">
            Get Started
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          <a href="#features" className="block text-muted-foreground hover:text-foreground text-sm font-medium py-2">Features</a>
          <a href="#solution" className="block text-muted-foreground hover:text-foreground text-sm font-medium py-2">Solution</a>
          <Link to="/auth" className="block px-5 py-2 rounded-xl gradient-teal text-primary-foreground text-sm font-semibold text-center">Get Started</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
