import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Video, Star, Send, FileText, Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { DogDataManager } from "@/lib/dogDataManager";
import { useNavigate, useSearchParams } from "react-router-dom";

const VetServices = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "book");
  const [reportData, setReportData] = useState({
    vetEmail: "",
    vetPhone: "",
    countryCode: "+91",
    message: "",
    urgency: "normal",
    sendMethod: "email" as "email" | "whatsapp"
  });

  const generateQRReport = () => {
    navigate("/install");
  };

  const sendReport = async () => {
    if (!reportData.vetEmail) {
      toast({ title: "Email required", description: "Please enter veterinarian's email", variant: "destructive" });
      return;
    }

    try {
      const activeDogId = DogDataManager.getActiveDogId();
      const dogs = JSON.parse(localStorage.getItem("dogs_profiles") || "[]");
      const activeDog = dogs.find((d: any) => d.id === activeDogId);
      
      const dogName = activeDog?.name || localStorage.getItem("dog_name") || "Dog";
      const dogBreed = activeDog?.breed || localStorage.getItem("dog_breed") || "Unknown";
      const dogAge = activeDog?.age || localStorage.getItem("dog_age") || "Unknown";
      
      const urgencyText = reportData.urgency === "emergency" ? "🚨 EMERGENCY" : reportData.urgency === "urgent" ? "⚠️ URGENT" : "📋 NORMAL";
      const subject = `${urgencyText} - ${dogName}'s Health Report - Please Review`;
      
      const emailBody = `Dear Veterinarian,\n\n${reportData.message || "Please find attached the complete health report for my dog."}\n\nDog Details:\n- Name: ${dogName}\n- Breed: ${dogBreed}\n- Age: ${dogAge}\n\nThis report contains:\n- Complete health profile\n- Recent sensor readings\n- Diagnostic scan history\n- Emotion & behavior logs\n- Air quality data\n\nPlease review at your earliest convenience.\n\nBest regards`;
      
      const mailtoLink = `mailto:${reportData.vetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoLink;
      
      toast({ title: "📧 Opening email client...", description: `Sending report to ${reportData.vetEmail}` });
      setReportData({ vetEmail: "", vetPhone: "", message: "", urgency: "normal" });
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    }
  };

  const sendWhatsApp = async () => {
    if (!reportData.vetPhone) {
      toast({ title: "Phone required", description: "Please enter veterinarian's phone number", variant: "destructive" });
      return;
    }

    try {
      const activeDogId = DogDataManager.getActiveDogId();
      const dogs = JSON.parse(localStorage.getItem("dogs_profiles") || "[]");
      const activeDog = dogs.find((d: any) => d.id === activeDogId);
      
      const dogName = activeDog?.name || localStorage.getItem("dog_name") || "Dog";
      const dogBreed = activeDog?.breed || localStorage.getItem("dog_breed") || "Unknown";
      const dogAge = activeDog?.age || localStorage.getItem("dog_age") || "Unknown";
      
      const urgencyEmoji = reportData.urgency === "emergency" ? "🚨" : reportData.urgency === "urgent" ? "⚠️" : "📋";
      const urgencyText = reportData.urgency === "emergency" ? "EMERGENCY" : reportData.urgency === "urgent" ? "URGENT" : "NORMAL";
      const subject = `${urgencyEmoji} ${urgencyText} - ${dogName}'s Health Report`;
      
      const whatsappMessage = `${subject}\n\nDear Veterinarian,\n\n${reportData.message || "Please find the complete health report for my dog."}\n\nDog Details:\n- Name: ${dogName}\n- Breed: ${dogBreed}\n- Age: ${dogAge}\n\nReport includes:\n- Complete health profile\n- Recent sensor readings\n- Diagnostic scan history\n- Emotion and behavior logs\n- Air quality data\n\nThank you!`;
      
      const phoneNumber = (reportData.countryCode + reportData.vetPhone).replace(/\D/g, '');
      const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappLink, '_blank');
      
      toast({ title: "💬 Opening WhatsApp...", description: `Message prepared for ${reportData.countryCode}${reportData.vetPhone}` });
      setReportData({ vetEmail: "", vetPhone: "", countryCode: "+91", message: "", urgency: "normal", sendMethod: "email" });
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    }
  };

  const services = [
    { id: "book", title: "Book Appointment", icon: Calendar },
    { id: "clinics", title: "Find Clinics", icon: MapPin },
    { id: "video", title: "Video Consult", icon: Video },
    { id: "send", title: "Send Report", icon: Send }
  ];

  return (
    <AppLayout title="Veterinary Services" showBack>
      <div className="px-4 py-6 min-h-full space-y-4 max-w-2xl mx-auto">
        {/* Service Tabs */}
        <div className="grid grid-cols-2 gap-2">
          {services.map(service => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => setActiveTab(service.id)}
                className={`p-3 rounded-xl text-center transition-all ${
                  activeTab === service.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs font-medium">{service.title}</p>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <Card className="p-6">
          {activeTab === "book" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Book Appointment</h3>
              <Input placeholder="Veterinary clinic name" />
              <Input type="date" />
              <Input type="time" />
              <Textarea placeholder="Reason for visit..." rows={3} />
              <Button className="w-full">Schedule Appointment</Button>
            </div>
          )}

          {activeTab === "clinics" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Find Veterinary Clinics</h3>
              <Input placeholder="Enter your location" />
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">🌟 Top Rated</h4>
                {[1, 2, 3].map(i => (
                  <div key={`top-${i}`} className="p-3 border rounded-lg">
                    <h4 className="font-medium">Dr. Vet {i}</h4>
                    <p className="text-sm">⭐ 4.{8+i}/5 • {20+i*5} reviews</p>
                    <p className="text-sm text-muted-foreground">Specializes in dermatology • 0.{i} miles</p>
                    <Button size="sm" className="mt-2">View Profile</Button>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">📍 Nearby Clinics</h4>
                {[1, 2, 3].map(i => (
                  <div key={`nearby-${i}`} className="p-3 border rounded-lg">
                    <h4 className="font-medium">Pet Clinic {i}</h4>
                    <p className="text-sm text-muted-foreground">0.{i} miles away</p>
                    <p className="text-sm">⭐ 4.{5+i}/5 • Open until 6 PM</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "video" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Video Consultation</h3>
              <p className="text-sm text-muted-foreground">Connect with licensed veterinarians online</p>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Dr. Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">Available now • $45/consultation</p>
                  <Button size="sm" className="mt-2">Start Video Call</Button>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Dr. Mike Chen</h4>
                  <p className="text-sm text-muted-foreground">Available in 15 min • $40/consultation</p>
                  <Button size="sm" className="mt-2" variant="outline">Schedule Call</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "send" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Send Health Report</h3>
              
              {/* Method Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setReportData({...reportData, sendMethod: "email"})}
                  className={`flex-1 p-3 rounded-lg font-medium transition-all ${
                    reportData.sendMethod === "email" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  📧 Email
                </button>
                <button
                  onClick={() => setReportData({...reportData, sendMethod: "whatsapp"})}
                  className={`flex-1 p-3 rounded-lg font-medium transition-all ${
                    reportData.sendMethod === "whatsapp" ? "bg-green-600 text-white" : "bg-secondary"
                  }`}
                >
                  💬 WhatsApp
                </button>
              </div>

              {reportData.sendMethod === "email" ? (
                <Input 
                  placeholder="Veterinarian's email"
                  type="email"
                  value={reportData.vetEmail}
                  onChange={(e) => setReportData({...reportData, vetEmail: e.target.value})}
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Veterinarian's Phone</label>
                  <div className="flex gap-2">
                    <select 
                      className="w-24 p-2 border rounded-lg"
                      value={reportData.countryCode}
                      onChange={(e) => setReportData({...reportData, countryCode: e.target.value})}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+65">🇸🇬 +65</option>
                    </select>
                    <Input 
                      placeholder="Phone number"
                      type="tel"
                      value={reportData.vetPhone}
                      onChange={(e) => setReportData({...reportData, vetPhone: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
              
              <select 
                className="w-full p-2 border rounded-lg"
                value={reportData.urgency}
                onChange={(e) => setReportData({...reportData, urgency: e.target.value})}
              >
                <option value="normal">📋 Normal Priority</option>
                <option value="urgent">⚠️ Urgent</option>
                <option value="emergency">🚨 Emergency</option>
              </select>
              
              <Textarea 
                placeholder="Additional message for the vet..."
                value={reportData.message}
                onChange={(e) => setReportData({...reportData, message: e.target.value})}
                rows={3}
              />
              
              <Button 
                onClick={reportData.sendMethod === "email" ? sendReport : sendWhatsApp} 
                className={`w-full ${reportData.sendMethod === "whatsapp" ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                <Send className="w-4 h-4 mr-2" />
                Send via {reportData.sendMethod === "email" ? "Email" : "WhatsApp"}
              </Button>
            </div>
          )}


        </Card>
      </div>
    </AppLayout>
  );
};

export default VetServices;