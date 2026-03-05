import { PawPrint } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Pawsitive Diagnosis</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Sara's Hack Squad · Vellore Institute of Technology - Bhopal
        </p>
      </div>
    </footer>
  );
};

export default Footer;
