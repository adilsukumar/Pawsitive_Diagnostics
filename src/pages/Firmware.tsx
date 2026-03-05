import { motion } from "framer-motion";
import { Cpu, Mic, Wind, Activity, Battery, Bluetooth, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const components = [
  {
    name: "ESP32-C3 SuperMini",
    role: "Main Microcontroller",
    icon: Cpu,
    color: "gradient-primary",
    specs: "RISC-V 160MHz, WiFi + BLE 5.0, Ultra low-power",
    detail: "The brain of the smart collar. Handles all sensor data processing and transmits readings to the mobile app via Bluetooth Low Energy.",
  },
  {
    name: "Dual Electret Microphones",
    role: "BarkSense — Vocal Analysis",
    icon: Mic,
    color: "gradient-bark",
    specs: "2× MAX4466 amplified mics, analog output",
    detail: "One mic is placed against the throat (contact mic) to capture vocal vibrations. The second captures ambient noise. The difference isolates the dog's vocalizations for AI emotion analysis.",
  },
  {
    name: "MQ-135 Gas Sensor",
    role: "GutSense — Gas Detection",
    icon: Wind,
    color: "gradient-poop",
    specs: "Detects NH₃, CH₄, CO₂, benzene — analog output",
    detail: "Mounted near the tail area of the collar to detect abnormal gas emissions (methane, ammonia). Elevated readings can indicate digestive issues, infections, or dietary problems.",
  },
  {
    name: "MPU6050 IMU",
    role: "SkinSense — Motion & Itch Detection",
    icon: Activity,
    color: "gradient-skin",
    specs: "6-axis accelerometer + gyroscope, I²C",
    detail: "Tracks the dog's movement patterns and detects excessive scratching or restlessness. Sudden repetitive motions suggest skin irritation, allergies, or parasite activity.",
  },
  {
    name: "3.7V LiPo Battery",
    role: "Power Supply",
    icon: Battery,
    color: "gradient-electric",
    specs: "500mAh, rechargeable via USB-C on ESP32",
    detail: "Powers the entire collar assembly. The ESP32-C3's ultra-low power consumption allows continuous monitoring for extended periods on a single charge.",
  },
];

const wiring = [
  { component: "Throat Mic (N+)", pin: "GPIO 0 (ADC)", note: "Analog input — contact mic signal" },
  { component: "Ambient Mic (N+)", pin: "GPIO 1 (ADC)", note: "Analog input — environment noise" },
  { component: "MQ-135 (AO)", pin: "GPIO 2 (ADC)", note: "Analog output — gas concentration" },
  { component: "MPU6050 (SDA)", pin: "GPIO 8", note: "I²C data line" },
  { component: "MPU6050 (SCL)", pin: "GPIO 9", note: "I²C clock line" },
  { component: "All VCC lines", pin: "3.3V / VBUS", note: "MQ-135 needs 5V via VBUS" },
  { component: "All GND lines", pin: "GND", note: "Common ground bus" },
];

const dataFormat = `Bark:123,Smell:456,Activity:7.89`;

const bleCode = `#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

Adafruit_MPU6050 mpu;

const int MIC_THROAT = 0;
const int MIC_AMBIENT = 1;
const int GAS_SENSOR = 2;

#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define CHARACTERISTIC_UUID "12345678-1234-1234-1234-123456789abd"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  };
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(MIC_THROAT, INPUT_PULLUP);
  pinMode(MIC_AMBIENT, INPUT_PULLUP);
  Wire.begin(8, 9);
  mpu.begin();
  BLEDevice::init("Pawsitive");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  BLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
}

void loop() {
  int barkSignal = abs(analogRead(MIC_THROAT) - analogRead(MIC_AMBIENT));
  int gasValue = analogRead(GAS_SENSOR);
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  float motion = sqrt(sq(a.acceleration.x) + sq(a.acceleration.y) + sq(a.acceleration.z));
  String data = "Bark:" + String(barkSignal) + ",Smell:" + String(gasValue) + ",Activity:" + String(motion, 2);
  if (deviceConnected) {
    pCharacteristic->setValue(data.c_str());
    pCharacteristic->notify();
  }
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
  }
  oldDeviceConnected = deviceConnected;
  delay(100);
}`;

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const Firmware = () => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(bleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout title="Hardware & Firmware" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5 min-h-full pb-32">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl gradient-electric flex items-center justify-center mx-auto shadow-glow-sm">
            <Cpu className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground tracking-tight">Smart Collar Hardware</h2>
          <p className="text-muted-foreground text-sm font-body">Components, wiring & architecture</p>
        </motion.div>

        {/* System Architecture */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">System Architecture</h3>
          <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-body text-muted-foreground">
              <span className="bg-primary/15 text-primary px-2 py-1 rounded-lg font-semibold">Sensors</span>
              <span>→</span>
              <span className="bg-primary/15 text-primary px-2 py-1 rounded-lg font-semibold">ESP32-C3</span>
              <span>→</span>
              <span className="bg-primary/15 text-primary px-2 py-1 rounded-lg font-semibold">BLE</span>
              <span>→</span>
              <span className="bg-primary/15 text-primary px-2 py-1 rounded-lg font-semibold">App</span>
              <span>→</span>
              <span className="bg-primary/15 text-primary px-2 py-1 rounded-lg font-semibold">AI</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-body text-center">
              Real-time sensor data streams at 10Hz via BLE to the mobile app for Gemini AI analysis
            </p>
          </div>
        </motion.div>

        {/* BLE Data Protocol */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="glass rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-primary" strokeWidth={2} />
            <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">BLE Data Protocol</h3>
          </div>
          <div className="bg-black/40 rounded-xl px-3 py-2">
            <code className="text-xs text-emerald-400 font-mono">{dataFormat}</code>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-[10px] font-body font-semibold text-foreground">Bark</p>
              <p className="text-[9px] text-muted-foreground font-body">Mic differential</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-[10px] font-body font-semibold text-foreground">Smell</p>
              <p className="text-[9px] text-muted-foreground font-body">Gas ppm (ADC)</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-[10px] font-body font-semibold text-foreground">Activity</p>
              <p className="text-[9px] text-muted-foreground font-body">IMU magnitude</p>
            </div>
          </div>
        </motion.div>

        {/* Components */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          <h3 className="font-display font-semibold text-foreground text-sm tracking-tight px-1">Components Used</h3>
          {components.map((c) => (
            <motion.div key={c.name} variants={item} className="glass rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center shadow-glow-sm shrink-0`}>
                  <c.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-semibold text-foreground text-sm tracking-tight">{c.name}</h4>
                  <p className="text-[10px] text-primary font-body font-medium">{c.role}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/80 font-body font-medium bg-secondary/30 rounded-lg px-2.5 py-1">{c.specs}</p>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">{c.detail}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Wiring Table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Pin Connections</h3>
          <div className="space-y-1.5">
            {wiring.map((w) => (
              <div key={w.component} className="flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body font-medium text-foreground">{w.component}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{w.note}</p>
                </div>
                <span className="text-[11px] font-mono text-primary font-semibold shrink-0">{w.pin}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Firmware Code */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Arduino Firmware</h3>
            <Button onClick={copyCode} variant="outline" size="sm" className="h-7 text-xs rounded-lg font-body">
              {copied ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
            </Button>
          </div>
          <div className="bg-black/40 rounded-xl p-3 overflow-x-auto max-h-72 overflow-y-auto">
            <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre leading-relaxed">
              {bleCode}
            </pre>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Firmware;
