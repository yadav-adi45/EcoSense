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
  Shield,
  ShieldCheck,
  Building2,
  Stethoscope,
  Search,
  CheckCircle2,
  User,
  Filter,
  CheckCircle,
  Clock,
  FileText,
  Eye,
} from "lucide-react";

const monthlyReport = {
  month: "November 2026",
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

const MOCK_ENVIRONMENT_REPORTS = [
  {
    id: "REP-2026-0881",
    title: "Connaught Place Traffic Smog & PM2.5 Crisis",
    category: "Air Quality",
    location: "Central Delhi",
    aqi: 380,
    status: "Escalated",
    date: "2026-08-08",
    roles: ["admin", "authority", "investigator", "user"],
    hospitalImpact: "High respiratory admission warning issued for pediatric wards.",
    authorityAction: "Odd-Even vehicle restriction recommendation filed.",
    investigatorLog: "Heavy diesel truck idling detected near Ring Road bypass.",
    reporter: "Municipal Sensor Network #D-14"
  },
  {
    id: "REP-2026-0882",
    title: "LHMC Emergency Ward Pediatric Asthma Cluster",
    category: "Hospital Exposure",
    location: "LHMC Hospital Zone, Delhi",
    aqi: 295,
    status: "Under Investigation",
    date: "2026-08-08",
    roles: ["admin", "hospital", "reviewer"],
    hospitalImpact: "+42% surge in acute bronchitis outpatient visits over 24 hours.",
    authorityAction: "Awaiting clinical toxicology breakdown.",
    investigatorLog: "Cross-analyzing hospital admission timestamps with localized sensor data.",
    reporter: "Dr. A. Sharma (Chief Pulmonologist)"
  },
  {
    id: "REP-2026-0883",
    title: "Adarsh Nagar Electroplating Chemical Runoff",
    category: "Industrial Runoff",
    location: "Adarsh Nagar Industrial Area",
    aqi: 420,
    status: "Under Investigation",
    date: "2026-08-07",
    roles: ["admin", "investigator", "reviewer", "authority"],
    hospitalImpact: "Dermatological contact warning broadcasted for local groundwater wells.",
    authorityAction: "Environmental Protection Agency notice dispatched to Factory #88.",
    investigatorLog: "Water sample pH 3.2 recorded near drainage canal outfall.",
    reporter: "Site Investigator Patrol #04"
  },
  {
    id: "REP-2026-0884",
    title: "Gharuan Active Bicycle Commute Footprint Audit",
    category: "User Footprint",
    location: "Gharuan Village, Punjab",
    aqi: 45,
    status: "Verified",
    date: "2026-08-06",
    roles: ["admin", "user", "reviewer"],
    hospitalImpact: "Zero environmental health risks reported.",
    authorityAction: "Green Citizen Reward points credited to community accounts.",
    investigatorLog: "Verified 120 kg CO2 reduction through active commute tracking.",
    reporter: "Community Eco-Club"
  },
  {
    id: "REP-2026-0885",
    title: "Patiala Methane Dump Vent Flaring Audit",
    category: "Landfill Safety",
    location: "Dakha Dump, Patiala",
    aqi: 310,
    status: "Resolved",
    date: "2026-08-05",
    roles: ["admin", "authority", "investigator"],
    hospitalImpact: "Low odor nuisance warning cleared.",
    authorityAction: "Flaring unit valve replaced and sealed under municipal oversight.",
    investigatorLog: "Post-repair infrared imaging confirms 0% fugitive gas leakage.",
    reporter: "Patiala Municipal Corp"
  },
  {
    id: "REP-2026-0886",
    title: "Wazirabad Reservoir Ammonia Inflow Warning",
    category: "Water Quality",
    location: "Wazirabad Intake, Delhi",
    aqi: 185,
    status: "Escalated",
    date: "2026-08-07",
    roles: ["admin", "authority", "reviewer", "hospital"],
    hospitalImpact: "Water treatment advisory issued for domestic consumption.",
    authorityAction: "Water treatment plant diversion protocol activated.",
    investigatorLog: "Upstream dye unit audit requested from Haryana Pollution Board.",
    reporter: "Delhi Jal Board Sensor"
  },
  {
    id: "REP-2026-0887",
    title: "Rohini Sector 16 Solar Streetlight Transition",
    category: "Transit Safety",
    location: "Rohini, Delhi",
    aqi: 82,
    status: "Verified",
    date: "2026-08-04",
    roles: ["admin", "user", "authority"],
    hospitalImpact: "Enhanced night safety & zero local emissions.",
    authorityAction: "Phase 2 solar installation budget approved.",
    investigatorLog: "Installed 45 solar LED units powered by 100% renewable grid storage.",
    reporter: "Urban Development Dept"
  }
];

const ROLES_CONFIG = [
  { id: "all", label: "All Roles", icon: Shield, bg: "bg-gray-100", text: "text-gray-700" },
  { id: "user", label: "User", icon: User, bg: "bg-cyan-100", text: "text-cyan-700" },
  { id: "admin", label: "Admin", icon: ShieldCheck, bg: "bg-purple-100", text: "text-purple-700" },
  { id: "authority", label: "Authority", icon: Building2, bg: "bg-blue-100", text: "text-blue-700" },
  { id: "hospital", label: "Hospital", icon: Stethoscope, bg: "bg-rose-100", text: "text-rose-700" },
  { id: "investigator", label: "Investigator", icon: Search, bg: "bg-amber-100", text: "text-amber-700" },
  { id: "reviewer", label: "Reviewer", icon: CheckCircle2, bg: "bg-emerald-100", text: "text-emerald-700" },
];

const getAQILabel = (aqi) => {
  if (aqi <= 50) return { label: "Good", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
  if (aqi <= 150) return { label: "Unhealthy (Sensitive)", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
  return { label: "Hazardous", color: "text-rose-900", bg: "bg-rose-100", border: "border-rose-300" };
};

const TABS = ["Monthly Report", "Smart Alerts", "Route Heatmap", "Role Registry"];

const Insights = () => {
  const [activeTab, setActiveTab] = useState(3);
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredReports = MOCK_ENVIRONMENT_REPORTS.filter((report) => {
    const matchesRole = selectedRole === "all" || report.roles.includes(selectedRole);
    const matchesStatus = selectedStatus === "all" || report.status === selectedStatus;
    return matchesRole && matchesStatus;
  });

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
                className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 ${activeTab === i
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
                            <span className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${cat.change < 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
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
              <div className="bg-white overflow-x-auto">
                <div className="min-w-[500px]">
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
            </div>
          )}

          {/* ══════════════════════════════════════ */}
          {/* TAB 3 — Role-Aware Environment Registry */}
          {/* ══════════════════════════════════════ */}
          {activeTab === 3 && (
            <div className="space-y-8">
              {/* Header Banner */}
              <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <ShieldCheck size={180} className="text-emerald-500" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <span className="font-bold text-emerald-600 uppercase tracking-widest text-[10px] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    Bounty Task Feature: Advance Scoped Access
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase mt-3">
                    Role-Aware Environmental Registry
                  </h2>
                  <p className="text-gray-500 font-medium text-sm mt-2 leading-relaxed">
                    Access scoped environment reports filtered by organizational roles. Select a role below to simulate persona-based report visibility.
                  </p>
                </div>
              </div>

              {/* Role Selection Tabs / Pills */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-500" /> Filter By Role (Simulate Persona):
                  </p>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    Active Persona: <strong className="uppercase">{selectedRole}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {ROLES_CONFIG.map((role) => {
                    const RoleIcon = role.icon;
                    const isSelected = selectedRole === role.id;
                    const roleCount = role.id === "all"
                      ? MOCK_ENVIRONMENT_REPORTS.length
                      : MOCK_ENVIRONMENT_REPORTS.filter(r => r.roles.includes(role.id)).length;

                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${isSelected
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-200 scale-105"
                            : "bg-gray-50/60 hover:bg-emerald-50/50 text-gray-700 border-gray-100 hover:border-emerald-200"
                          }`}
                      >
                        <RoleIcon className={`w-6 h-6 mb-2 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                        <span className="text-xs font-extrabold uppercase tracking-wider">{role.label}</span>
                        <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-gray-200/60 text-gray-600"
                          }`}>
                          {roleCount} {roleCount === 1 ? "report" : "reports"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter & Visible Count Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status:</span>
                  <div className="flex flex-wrap gap-2">
                    {["all", "Verified", "Under Investigation", "Escalated", "Resolved"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setSelectedStatus(st)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${selectedStatus === st
                            ? "bg-gray-900 text-white shadow-sm"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        {st === "all" ? "All Statuses" : st}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-extrabold rounded-xl text-xs uppercase tracking-wider border border-emerald-200 shadow-sm shrink-0">
                  Visible Reports: {filteredReports.length} of {MOCK_ENVIRONMENT_REPORTS.length}
                </span>
              </div>

              {/* Scoped Report Results List */}
              {filteredReports.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-gray-700">No Environment Reports Found</h3>
                  <p className="text-gray-400 text-sm mt-1">Try switching roles or clearing the status filter.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredReports.map((report) => {
                    const { label: aqiLabel, color: aqiColor, bg: aqiBg, border: aqiBorder } = getAQILabel(report.aqi);

                    const statusStyle =
                      report.status === "Escalated"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : report.status === "Under Investigation"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : report.status === "Resolved"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200";

                    return (
                      <div
                        key={report.id}
                        className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                              {report.id}
                            </span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-xl">
                              {report.category}
                            </span>
                            <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl border ${statusStyle}`}>
                              {report.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {report.date}
                            </span>
                            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl border ${aqiBg} ${aqiColor} ${aqiBorder}`}>
                              AQI {report.aqi} — {aqiLabel}
                            </span>
                          </div>
                        </div>

                        {/* Title & Reporter */}
                        <div className="mb-6">
                          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                            {report.title}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {report.location} • Reported by <strong className="text-gray-700">{report.reporter}</strong>
                          </p>
                        </div>

                        {/* Role-Specific Operational Insights */}
                        <div className="grid md:grid-cols-3 gap-4 mb-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
                          <div className="p-3 bg-white rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                              <Stethoscope className="w-3.5 h-3.5" /> Medical & Health Impact
                            </p>
                            <p className="text-xs font-semibold text-gray-700 leading-relaxed">{report.hospitalImpact}</p>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                              <Building2 className="w-3.5 h-3.5" /> Municipal Action
                            </p>
                            <p className="text-xs font-semibold text-gray-700 leading-relaxed">{report.authorityAction}</p>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                              <Search className="w-3.5 h-3.5" /> Inspector Audit Log
                            </p>
                            <p className="text-xs font-semibold text-gray-700 leading-relaxed">{report.investigatorLog}</p>
                          </div>
                        </div>

                        {/* Authorized Roles Footer Badges */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Authorized Scopes:</span>
                            {report.roles.map((r) => (
                              <span
                                key={r}
                                className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg ${selectedRole === r
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-gray-200/70 text-gray-700"
                                  }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>

                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <Eye className="w-4 h-4" /> Role Access Verified
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Insights;