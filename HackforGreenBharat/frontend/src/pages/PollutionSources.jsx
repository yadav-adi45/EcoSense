import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  ArrowRight, BatteryCharging, Bike, Building2, Car, CheckCircle2,
  Droplets, Factory, HardHat, Leaf, Lightbulb, MapPin, Recycle,
  Sun, Target, Train, TrendingDown, Users, Wind, Zap,
} from "lucide-react";
import { getCityPollution } from "@/services/pollutionApi";
import { getCurrentCity } from "@/utils/getCurrentCity";
import { getAQIColorClass } from "@/utils/aqiColor";
import { sectorColorMap } from "@/utils/sectorColors";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { validateCity } from "@/utils/validateCity";
import { cityAutocomplete } from "@/utils/cityAutocomplete";

const DEFAULT_POLLUTION_DATA = {
  success: true,
  city: "Delhi",
  coordinates: { lat: 28.6139, lon: 77.2090 },
  aqi: 142,
  contribution: {
    transport: 42,
    industry: 28,
    power: 18,
    construction: 12,
  },
  detectedSources: {
    transport: 124,
    industry: 45,
    power: 12,
    construction: 38,
  }
};

const pollutionSectors = [
  {
    key: "transport", label: "Transport & Vehicles", icon: <Car style={{ width:32, height:32 }} />,
    color: "#F97316", bgColor: "rgba(249,115,22,0.08)",
    description: "Emissions from cars, trucks, buses, and two-wheelers burning fossil fuels.",
    detailedSolutions: [
      { title: "Switch to Electric Vehicles", icon: <BatteryCharging style={{ width:24, height:24 }} />, points: ["Government subsidies up to ₹1.5 lakh on EVs under FAME-II scheme","Lower running cost: ₹1/km vs ₹5/km for petrol vehicles","Zero tailpipe emissions reducing PM2.5 by up to 90%","Growing charging infrastructure with 10,000+ stations across India","Tax benefits: Road tax exemption in many states"] },
      { title: "Use Public Transport", icon: <Train style={{ width:24, height:24 }} />, points: ["Metro reduces per-person emissions by 80% compared to cars","Delhi Metro saves 5.7 lakh tonnes of CO2 annually","Monthly metro pass: ₹2,250 vs ₹15,000 for car fuel","Dedicated bus lanes reduce travel time by 30%","App-based tracking for better trip planning"] },
      { title: "Adopt Active Mobility", icon: <Bike style={{ width:24, height:24 }} />, points: ["Cycling for trips under 5km reduces emissions to zero","Public bike-sharing systems in 50+ Indian cities","Health benefits: 30 mins cycling burns 300 calories","Dedicated cycling tracks being built in major cities","E-bikes available for longer commutes"] },
    ],
  },
  {
    key: "industry", label: "Industrial Emissions", icon: <Factory style={{ width:32, height:32 }} />,
    color: "#8B5CF6", bgColor: "rgba(139,92,246,0.08)",
    description: "Pollution from manufacturing, refineries, and industrial processes.",
    detailedSolutions: [
      { title: "Clean Production Technologies", icon: <Recycle style={{ width:24, height:24 }} />, points: ["Install electrostatic precipitators (99% dust removal)","Switch to natural gas from coal (50% less emissions)","Implement closed-loop water systems","Use bag filters for particulate matter control","Regular maintenance reduces emissions by 30%"] },
      { title: "Green Certifications", icon: <Leaf style={{ width:24, height:24 }} />, points: ["IGBC Green Factory certification reduces energy by 40%","ISO 14001 environmental management standards","Zero liquid discharge (ZLD) systems mandatory","Carbon footprint reporting and offsetting","Green building materials in factory construction"] },
      { title: "Renewable Energy Adoption", icon: <Sun style={{ width:24, height:24 }} />, points: ["Rooftop solar can meet 30-50% of factory power needs","Power purchase agreements for wind energy","Green hydrogen for high-heat industrial processes","Battery storage for consistent renewable power","Net metering allows selling excess power"] },
    ],
  },
  {
    key: "power", label: "Power Generation", icon: <Zap style={{ width:32, height:32 }} />,
    color: "#EAB308", bgColor: "rgba(234,179,8,0.08)",
    description: "Emissions from coal-fired power plants and electricity generation.",
    detailedSolutions: [
      { title: "Solar Power Revolution", icon: <Sun style={{ width:24, height:24 }} />, points: ["Rooftop solar: ₹3-4/unit vs ₹8/unit from grid","PM-KUSUM scheme: 60% subsidy for solar pumps","Net metering: Earn from excess power generation","25-year lifespan with minimal maintenance","Payback period: 4-5 years for residential"] },
      { title: "Wind Energy", icon: <Wind style={{ width:24, height:24 }} />, points: ["India's wind capacity: 42 GW and growing","Offshore wind potential of 70 GW","Community wind projects for rural areas","Hybrid wind-solar parks for consistent power","Green bonds available for project financing"] },
      { title: "Energy Efficiency", icon: <Lightbulb style={{ width:24, height:24 }} />, points: ["LED bulbs: 80% less energy than incandescent","5-star appliances save ₹2,000-5,000/year","Smart meters enable real-time monitoring","AC at 24°C vs 18°C saves 25% energy","Perform appliance energy audits"] },
    ],
  },
  {
    key: "construction", label: "Construction & Dust", icon: <HardHat style={{ width:32, height:32 }} />,
    color: "#14B8A6", bgColor: "rgba(20,184,166,0.08)",
    description: "Dust from construction sites, road building, and demolition activities.",
    detailedSolutions: [
      { title: "Dust Suppression Systems", icon: <Droplets style={{ width:24, height:24 }} />, points: ["Anti-smog guns reduce dust by 80%","Water sprinklers mandatory at all sites","Covered trucks for material transport","Wheel washing at site entry/exit points","Wind barriers around construction perimeter"] },
      { title: "Green Building Practices", icon: <Building2 style={{ width:24, height:24 }} />, points: ["Pre-fabricated construction reduces on-site dust","Recycled materials: Fly ash bricks, recycled steel","Green cement alternatives with 30% less emissions","Modular construction reduces waste by 50%","GRIHA/LEED certification for new buildings"] },
      { title: "Site Management", icon: <Target style={{ width:24, height:24 }} />, points: ["Covered storage for sand and cement","Scheduled work hours to reduce peak-time dust","Real-time air quality monitoring at sites","Worker training on dust control measures","Penalties for non-compliance strictly enforced"] },
    ],
  },
];

const PollutionSources = () => {
  const [inputCity, setInputCity] = useState("Delhi");
  const [data, setData] = useState(DEFAULT_POLLUTION_DATA);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const requestRef = useRef(0);
  const [suggestions, setSuggestions] = useState([]);
  const isLoading = loading || locLoading;

  useEffect(() => {
    fetchData("Delhi");
  }, []);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setInputCity(value);
    if (value.length < 1) { setSuggestions([]); return; }
    const results = await cityAutocomplete(value);
    setSuggestions(results);
  };

  const fetchData = async (cityInput) => {
    if (!cityInput) return;
    const id = ++requestRef.current;
    try {
      setLoading(true);
      setInputCity(cityInput);
      const res = await getCityPollution(cityInput);
      if (id !== requestRef.current) return;
      if (res && res.success) {
        setData({
          ...res,
          aqi: res.aqi || 128,
        });
      } else {
        setData({
          ...DEFAULT_POLLUTION_DATA,
          city: cityInput,
        });
      }
    } catch {
      setData({
        ...DEFAULT_POLLUTION_DATA,
        city: cityInput,
      });
    } finally { if (id === requestRef.current) setLoading(false); }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocLoading(true);
      const city = "Chandigarh";
      setInputCity(city);
      await fetchData(city);
    } catch (err) {
      console.error(err);
    } finally { setLocLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-gray-800">
      <Navbar />

      {/* HERO */}
      <section className="pt-[100px] pb-[50px] text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 mb-5">
          <Factory className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-500">Pollution Analysis</span>
        </div>
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold mb-3 text-gray-800">
          Understanding{" "}
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Pollution Sources
          </span>
        </h1>
      </section>

      {/* SEARCH */}
      <div className="max-w-[1280px] mx-auto px-4 mb-10">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3 shadow-sm relative">
          <input value={inputCity} onChange={handleInputChange} placeholder="Enter city"
            className="flex-1 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 outline-none focus:border-emerald-400" />

          {suggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg z-50 max-h-60 overflow-auto shadow-md">
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => { setInputCity(s.city); setSuggestions([]); fetchData(s.city); }}
                  className="px-4 py-2 cursor-pointer hover:bg-emerald-50 text-gray-700 text-sm">{s.label}</div>
              ))}
            </div>
          )}

          <button disabled={isLoading} onClick={() => fetchData(inputCity)}
            className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-60 flex items-center gap-2 transition">
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Search
          </button>

          <button disabled={isLoading} onClick={handleUseCurrentLocation}
            className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-60 flex items-center gap-2 transition">
            {locLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            📍 My Location
          </button>
        </div>
      </div>

      {/* LOADER */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-emerald-600 font-semibold">Fetching pollution data…</p>
            <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* RESULT */}
      {!isLoading && data && (
        <div>
          {/* City AQI Summary */}
          <div className="max-w-[1280px] mx-auto px-4 pb-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{data.city}</h2>
                    <p className="text-sm text-gray-400">Lat {data.coordinates.lat.toFixed(4)} • Lon {data.coordinates.lon.toFixed(4)}</p>
                  </div>
                </div>
                <div className={`px-8 py-5 rounded-2xl text-center font-semibold ${getAQIColorClass(data.aqi)}`}>
                  <p className="text-xs uppercase opacity-80">Current AQI</p>
                  <p className="text-4xl font-bold">{data.aqi}</p>
                  <p className="text-sm">Very Unhealthy</p>
                </div>
              </div>
              <h3 className="text-gray-400 uppercase tracking-wide text-xs font-semibold mb-5">Pollution Contribution by Sector</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {Object.entries(data.contribution).map(([key, value]) => {
                  const colors = sectorColorMap[key];
                  return (
                    <div key={key} className={`rounded-2xl p-5 border border-gray-100 ${colors.bg}`}>
                      <div className="flex justify-between mb-3">
                        <span className={`${colors.text} capitalize text-sm font-medium`}>{key}</span>
                        <span className={`text-2xl font-bold ${colors.text}`}>{value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded mb-3">
                        <div className={`h-2 rounded ${colors.bar}`} style={{ width: `${value}%` }} />
                      </div>
                      <p className="text-xs text-gray-400">{data.detectedSources?.[key] ?? 0} detected sources</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Solutions */}
          <section className="py-10 pb-20">
            <div className="max-w-[1280px] mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-stone-800 mb-3">
                  How to{" "}
                  <span className="text-teal-500">Reduce Pollution</span>
                </h2>
                <p className="text-stone-400 max-w-[600px] mx-auto text-[15px] font-medium">
                  Comprehensive solutions for each pollution source — from individual actions to systemic changes.
                </p>
              </div>

              {pollutionSectors.map((sector, sectorIndex) => (
                <div key={sector.key} className="mb-10">
                  <div className="flex items-center gap-4 mb-6 p-6 border-y bg-opacity-40"
                    style={{ background: sector.bgColor, borderColor: `${sector.color}30` }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: `${sector.color}20`, color: sector.color }}>{sector.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-stone-800">{sector.label}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-bold px-4 py-1.5"
                          style={{ background: `${sector.color}20`, color: sector.color }}>
                          {data.contribution?.[sector.key] ?? 0}% of pollution
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 font-medium">{sector.description}</p>
                    </div>
                    
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
                    {sector.detailedSolutions.map((solution) => (
                      <div key={solution.title} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${sector.color}50`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f3f4f6"; }}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${sector.color}15`, color: sector.color }}>
                            {solution.icon}
                          </div>
                          <h4 className="font-bold text-stone-800 text-[15px]">{solution.title}</h4>
                        </div>
                        <ul className="space-y-2">
                          {solution.points.map((point, i) => (
                            <li key={i} className={`flex items-start gap-3 py-1.5 ${i < solution.points.length-1 ? "border-b border-gray-50" : ""}`}>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span className="text-sm text-stone-600 font-medium leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* CTA */}
              <div className="mt-6 p-10 rounded-2xl text-center border border-emerald-100 bg-emerald-50">
                <Users className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-stone-800 mb-3">Every Action Counts</h2>
                <p className="text-gray-400 max-w-[600px] mx-auto mb-7 text-sm">
                  Join thousands of citizens making sustainable choices. Track your impact, earn rewards, and contribute to cleaner air for everyone.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link to="/dashboard">
                    <button className="flex items-center gap-2 px-8 py-3 font-semibold rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 transition">
                      Get Your Score <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link to="/">
                    <button className="px-8 py-3 font-semibold rounded-xl text-gray-600 bg-white border border-gray-200 hover:border-emerald-300 transition">
                      Back to Home
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PollutionSources;
