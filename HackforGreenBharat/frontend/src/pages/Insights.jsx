import Navbar from "@/components/Navbar";
import { useState } from "react";
import Footer from "./Footer";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Bell,
  MapPin,
  Download,
  Share2,
  Leaf,
  Wind,
  Activity,
  Sparkles,
  Zap,
} from "lucide-react";

const monthlyReport = {
  month: "November 2024",
  totalCO2: 156,
  previousMonth: 189,
  improvement: 17.5,
  aqiExposure: { good: 45, moderate: 32, unhealthy: 18, hazardous: 5 },
  categories: [
    { name: "Transport", current: 45, previous: 62, change: -27 },
    { name: "Energy", current: 38, previous: 42, change: -9 },
    { name: "Shopping", current: 52, previous: 58, change: -10 },
    { name: "Lifestyle", current: 21, previous: 27, change: -22 },
  ],
  toxinsInhaled: { pm25: 234, pm10: 456, no2: 89, co: 12 },
};

const predictiveAlerts = [
  {
    id: 1,
    type: "warning",
    title: "High AQI Predicted Tomorrow",
    description: "AQI expected to reach 280+ between 8–10 AM in Central Delhi",
    recommendation: "Consider leaving 30 mins early or working from home",
    time: "Tomorrow, 8:00 AM",
  },
  {
    id: 2,
    type: "info",
    title: "Best Travel Window",
    description: "AQI will be lowest between 2–4 PM today",
    recommendation: "Ideal time for outdoor activities or commute",
    time: "Today, 2:00 PM",
  },
  {
    id: 3,
    type: "alert",
    title: "Entering High Pollution Zone",
    description: "Anand Vihar area has AQI 350+ currently",
    recommendation: "Take Ring Road alternate route (−45 min exposure)",
    time: "Real-time",
  },
];

const routeHeatmapData = [
  { area: "Connaught Place", aqi: 185, trend: "up" },
  { area: "Karol Bagh", aqi: 220, trend: "up" },
  { area: "South Extension", aqi: 145, trend: "down" },
  { area: "Dwarka", aqi: 165, trend: "stable" },
  { area: "Noida Sec 18", aqi: 195, trend: "up" },
  { area: "Gurgaon Cyber City", aqi: 175, trend: "down" },
];

const getAQILabel = (aqi) => {
  if (aqi <= 50) return { label: "Good", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
  if (aqi <= 150) return { label: "Unhealthy (Sensitive)", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
  return { label: "Hazardous", color: "text-rose-900", bg: "bg-rose-100", border: "border-rose-300" };
};

const TABS = ["Monthly Report", "Smart Alerts", "Route Heatmap"];

const Insights = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-[#f0faf5] pb-24 font-sans">
      <Navbar />

      <main className="pt-32 pb-12">
        <div className="container mx-auto px-6 max-w-5xl relative">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <p className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-2">
                Environmental Insights
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight uppercase">
                Insights & Reports
              </h1>
              <p className="text-gray-500 font-medium mt-2">
                Your environmental impact for {monthlyReport.month}
              </p>
            </div>

            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-gray-700 border border-emerald-100 hover:border-emerald-300 font-bold text-sm uppercase tracking-wider transition-all shadow-sm hover:shadow-md">
                <Share2 size={16} /> Share
              </button>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-200/50 hover:-translate-y-0.5">
                <Download size={16} /> Export PDF
              </button>
            </div>
          </div>

          {/* Tab Bar Container */}
          <div className="bg-white/60 p-1.5 rounded-[1.25rem] border border-emerald-100/60 shadow-sm inline-flex mb-10 backdrop-blur-md">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                  activeTab === i
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════ */}
          {/* TAB 0 — Monthly Report                */}
          {/* ══════════════════════════════════════ */}
          {activeTab === 0 && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: <Leaf className="w-8 h-8 text-emerald-500" />,
                    value: `${monthlyReport.totalCO2} kg`,
                    label: "Total CO₂ This Month",
                    sub: `↓ ${monthlyReport.improvement}% vs last month`,
                    subColor: "text-emerald-500",
                  },
                  {
                    icon: <Wind className="w-8 h-8 text-emerald-500" />,
                    value: `${monthlyReport.aqiExposure.good}%`,
                    label: "Time in Good AQI",
                    sub: "of total exposure time",
                    subColor: "text-gray-400",
                  },
                  {
                    icon: <Activity className="w-8 h-8 text-orange-500" />,
                    value: `${monthlyReport.toxinsInhaled.pm25} μg`,
                    label: "PM2.5 Inhaled",
                    sub: "monthly average",
                    subColor: "text-gray-400",
                  },
                  {
                    icon: <BarChart3 className="w-8 h-8 text-emerald-500" />,
                    value: "27",
                    label: "Eco Activities",
                    sub: "+6 from last month",
                    subColor: "text-emerald-500",
                  },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-3xl p-8 border border-emerald-50 shadow-sm relative overflow-hidden group hover:border-emerald-100 transition-all">
                    <div className="absolute -top-6 -right-6 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none text-emerald-500">
                      <Sparkles size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center mb-6">
                        {s.icon}
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{s.label}</p>
                      <p className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{s.value}</p>
                      <p className={`text-xs font-bold uppercase tracking-wider ${s.subColor}`}>{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CO₂ and Exposure Section */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* CO₂ by Category */}
                <div className="bg-white rounded-3xl p-8 border border-emerald-50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none -translate-y-4 translate-x-4">
                        <Leaf size={160} className="text-emerald-500" />
                    </div>
                  <div className="mb-8">
                    <span className="font-bold text-emerald-500 uppercase tracking-widest text-[10px] bg-emerald-50 px-3 py-1 rounded-full">
                      Emissions Breakdown
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase mt-4">CO₂ by Category</h2>
                  </div>
                  
                  <div className="space-y-8 relative z-10">
                    {monthlyReport.categories.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">{cat.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-400">{cat.current} kg</span>
                            <span className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                              cat.change < 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            }`}>
                              {cat.change < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                              {Math.abs(cat.change)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          <div 
                            style={{ width: `${cat.current}%` }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] transition-all duration-700" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AQI Exposure Breakdown */}
                <div className="bg-white rounded-3xl p-8 border border-emerald-50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none -translate-y-4 translate-x-4">
                        <Zap size={160} className="text-emerald-500" />
                    </div>
                  <div className="mb-8">
                    <span className="font-bold text-emerald-500 uppercase tracking-widest text-[10px] bg-emerald-50 px-3 py-1 rounded-full">
                      Health Impact
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase mt-4">AQI Exposure Breakdown</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    {[
                      { label: "Good", value: monthlyReport.aqiExposure.good, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                      { label: "Moderate", value: monthlyReport.aqiExposure.moderate, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100" },
                      { label: "Unhealthy", value: monthlyReport.aqiExposure.unhealthy, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
                      { label: "Hazardous", value: monthlyReport.aqiExposure.hazardous, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-2xl p-6 text-center border ${item.bg} ${item.border} hover:scale-[1.02] transition-transform`}>
                        <p className={`text-4xl font-extrabold tracking-tight mb-2 ${item.color}`}>{item.value}%</p>
                        <p className={`text-xs font-bold uppercase tracking-widest ${item.color}`}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════ */}
          {/* TAB 1 — Smart Alerts                  */}
          {/* ══════════════════════════════════════ */}
          {activeTab === 1 && (
            <div className="max-w-3xl space-y-6">
              {predictiveAlerts.map((alert) => {
                const isWarning = alert.type === "warning";
                const isAlert = alert.type === "alert";
                
                const borderColor = isAlert ? "border-red-200" : isWarning ? "border-orange-200" : "border-emerald-200";
                const bgTag = isAlert ? "bg-red-50" : isWarning ? "bg-orange-50" : "bg-emerald-50";
                const textTag = isAlert ? "text-red-600" : isWarning ? "text-orange-600" : "text-emerald-600";
                const iconColor = isAlert ? "text-red-500" : isWarning ? "text-orange-500" : "text-emerald-500";
                
                const tagLabel = isAlert ? "Real-time" : isWarning ? "Warning" : "Info";

                return (
                  <div key={alert.id} className={`bg-white rounded-3xl p-8 border ${borderColor} shadow-sm flex gap-6 hover:shadow-md transition-shadow`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${bgTag}`}>
                      <AlertTriangle className={`w-7 h-7 ${iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight uppercase">{alert.title}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${bgTag} ${textTag}`}>
                          {tagLabel}
                        </span>
                      </div>
                      <p className="text-gray-500 font-medium text-sm mb-4 leading-relaxed">{alert.description}</p>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                        <span className="text-lg leading-none">💡</span>
                        <p className="text-emerald-700 font-bold text-sm uppercase tracking-wide mt-0.5">{alert.recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════ */}
          {/* TAB 2 — Route Heatmap                 */}
          {/* ══════════════════════════════════════ */}
          {activeTab === 2 && (
            <div className="bg-white rounded-3xl border border-emerald-50 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase">Area-wise AQI Status</h2>
                <p className="text-gray-500 font-medium text-sm mt-2">Live pollution levels across your routes</p>
              </div>

              {/* Legend */}
              <div className="px-8 py-5 border-b border-gray-50 flex gap-6 flex-wrap bg-white">
                {[
                  { label: "Good (0–50)", color: "bg-emerald-500" },
                  { label: "Moderate (51–100)", color: "bg-yellow-500" },
                  { label: "Unhealthy (101–200)", color: "bg-red-500" },
                  { label: "Hazardous (201+)", color: "bg-purple-600" },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="bg-white">
                <div className="grid grid-cols-[1fr_auto_auto] px-8 py-4 border-b border-gray-100 bg-gray-50/50">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Area Context</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest w-24 text-center">AQI Profile</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest w-40 text-right">Status Tier</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {routeHeatmapData.map((area) => {
                    const { label, color, bg, border } = getAQILabel(area.aqi);
                    return (
                      <div key={area.area} className="grid grid-cols-[1fr_auto_auto] items-center px-8 py-6 hover:bg-emerald-50/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-gray-400" />
                          </div>
                          <span className="text-[14px] font-bold text-gray-700 uppercase tracking-wide">{area.area}</span>
                        </div>
                        
                        <div className="w-24 flex justify-center">
                            <span className={`text-xl font-extrabold tracking-tighter ${color}`}>
                            {area.aqi}
                            </span>
                        </div>

                        <div className="w-40 flex justify-end">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border ${bg} ${color} ${border}`}>
                            {label}
                            </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Insights;