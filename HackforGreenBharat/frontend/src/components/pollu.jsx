import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { ArrowRight, BatteryCharging, Bike, Building2, Car, CheckCircle2, Droplets, Factory, HardHat, Leaf, Lightbulb, MapPin, Recycle, Sun, Target, Train, TrendingDown, Users, Wind, Zap, Loader2, Navigation } from "lucide-react";
import { getCityPollution } from "@/services/pollutionApi";
import { getCurrentCity } from "@/utils/getCurrentCity";
import { getAQIColorClass } from "@/utils/aqiColor";
import { sectorColorMap } from "@/utils/sectorColors";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { validateCity } from "@/utils/validateCity";
import React from "react";

const pollutionSectors = [
  {
    key: "transport",
    label: "Transport & Vehicles",
    icon: <Car style={{ width: 32, height: 32 }} />,
    color: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.15)",
    description: "Emissions from cars, trucks, buses, and two-wheelers burning fossil fuels.",
    detailedSolutions: [
      {
        title: "Switch to Electric Vehicles",
        icon: <BatteryCharging style={{ width: 24, height: 24 }} />,
        points: [
          "Government subsidies up to ₹1.5 lakh on EVs under FAME-II scheme",
          "Lower running cost: ₹1/km vs ₹5/km for petrol vehicles",
          "Zero tailpipe emissions reducing PM2.5 by up to 90%",
          "Growing charging infrastructure with 10,000+ stations across India",
          "Tax benefits: Road tax exemption in many states",
        ],
      },
      {
        title: "Use Public Transport",
        icon: <Train style={{ width: 24, height: 24 }} />,
        points: [
          "Metro reduces per-person emissions by 80% compared to cars",
          "Delhi Metro saves 5.7 lakh tonnes of CO2 annually",
          "Monthly metro pass: ₹2,250 vs ₹15,000 for car fuel",
          "Dedicated bus lanes reduce travel time by 30%",
          "App-based tracking for better trip planning",
        ],
      },
      {
        title: "Adopt Active Mobility",
        icon: <Bike style={{ width: 24, height: 24 }} />,
        points: [
          "Cycling for trips under 5km reduces emissions to zero",
          "Public bike-sharing systems in 50+ Indian cities",
          "Health benefits: 30 mins cycling burns 300 calories",
          "Dedicated cycling tracks being built in major cities",
          "E-bikes available for longer commutes",
        ],
      },
    ],
  },
  {
    key: "industry",
    label: "Industrial Emissions",
    icon: <Factory style={{ width: 32, height: 32 }} />,
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.15)",
    description: "Pollution from manufacturing, refineries, and industrial processes.",
    detailedSolutions: [
      {
        title: "Clean Production Technologies",
        icon: <Recycle style={{ width: 24, height: 24 }} />,
        points: [
          "Install electrostatic precipitators (99% dust removal)",
          "Switch to natural gas from coal (50% less emissions)",
          "Implement closed-loop water systems",
          "Use bag filters for particulate matter control",
          "Regular maintenance reduces emissions by 30%",
        ],
      },
      {
        title: "Green Certifications",
        icon: <Leaf style={{ width: 24, height: 24 }} />,
        points: [
          "IGBC Green Factory certification reduces energy by 40%",
          "ISO 14001 environmental management standards",
          "Zero liquid discharge (ZLD) systems mandatory",
          "Carbon footprint reporting and offsetting",
          "Green building materials in factory construction",
        ],
      },
      {
        title: "Renewable Energy Adoption",
        icon: <Sun style={{ width: 24, height: 24 }} />,
        points: [
          "Rooftop solar can meet 30-50% of factory power needs",
          "Power purchase agreements for wind energy",
          "Green hydrogen for high-heat industrial processes",
          "Battery storage for consistent renewable power",
          "Net metering allows selling excess power",
        ],
      },
    ],
  },
  {
    key: "power",
    label: "Power Generation",
    icon: <Zap style={{ width: 32, height: 32 }} />,
    color: "#EAB308",
    bgColor: "rgba(234, 179, 8, 0.15)",
    description: "Emissions from coal-fired power plants and electricity generation.",
    detailedSolutions: [
      {
        title: "Solar Power Revolution",
        icon: <Sun style={{ width: 24, height: 24 }} />,
        points: [
          "Rooftop solar: ₹3-4/unit vs ₹8/unit from grid",
          "PM-KUSUM scheme: 60% subsidy for solar pumps",
          "Net metering: Earn from excess power generation",
          "25-year lifespan with minimal maintenance",
          "Payback period: 4-5 years for residential",
        ],
      },
      {
        title: "Wind Energy",
        icon: <Wind style={{ width: 24, height: 24 }} />,
        points: [
          "India's wind capacity: 42 GW and growing",
          "Offshore wind potential of 70 GW",
          "Community wind projects for rural areas",
          "Hybrid wind-solar parks for consistent power",
          "Green bonds available for project financing",
        ],
      },
      {
        title: "Energy Efficiency",
        icon: <Lightbulb style={{ width: 24, height: 24 }} />,
        points: [
          "LED bulbs: 80% less energy than incandescent",
          "5-star appliances save ₹2,000-5,000/year",
          "Smart meters enable real-time monitoring",
          "AC at 24°C vs 18°C saves 25% energy",
          "Perform appliance energy audits",
        ],
      },
    ],
  },
  {
    key: "construction",
    label: "Construction & Dust",
    icon: <HardHat style={{ width: 32, height: 32 }} />,
    color: "#14B8A6",
    bgColor: "rgba(20, 184, 166, 0.15)",
    description: "Dust from construction sites, road building, and demolition activities.",
    detailedSolutions: [
      {
        title: "Dust Suppression Systems",
        icon: <Droplets style={{ width: 24, height: 24 }} />,
        points: [
          "Anti-smog guns reduce dust by 80%",
          "Water sprinklers mandatory at all sites",
          "Covered trucks for material transport",
          "Wheel washing at site entry/exit points",
          "Wind barriers around construction perimeter",
        ],
      },
      {
        title: "Green Building Practices",
        icon: <Building2 style={{ width: 24, height: 24 }} />,
        points: [
          "Pre-fabricated construction reduces on-site dust",
          "Recycled materials: Fly ash bricks, recycled steel",
          "Green cement alternatives with 30% less emissions",
          "Modular construction reduces waste by 50%",
          "GRIHA/LEED certification for new buildings",
        ],
      },
      {
        title: "Site Management",
        icon: <Target style={{ width: 24, height: 24 }} />,
        points: [
          "Covered storage for sand and cement",
          "Scheduled work hours to reduce peak-time dust",
          "Real-time air quality monitoring at sites",
          "Worker training on dust control measures",
          "Penalties for non-compliance strictly enforced",
        ],
      },
    ],
  },
];

const PollutionSources = () => {
  const [inputCity, setInputCity] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const requestRef = useRef(0);

  const isLoading = loading || locLoading;

  const fetchData = async (cityInput) => {
    if (!cityInput) return;
    const id = ++requestRef.current;

    try {
      setLoading(true);
      const validated = await validateCity(cityInput);

      if (!validated) {
        alert("❌ Invalid city name");
        setData(null);
        return;
      }

      setInputCity(validated.city);
      const res = await getCityPollution(validated.city);
      if (id !== requestRef.current) return;
      setData(res);
    } finally {
      if (id === requestRef.current) setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocLoading(true);
      const city = await getCurrentCity();
      setInputCity(city);
      fetchData(city);
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0faf5] text-gray-800">
      <Navbar />

      {/* HERO */}
      <section className="pt-[130px] pb-[60px] text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <Factory className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-600">
            Pollution Intelligence
          </span>
        </div>

        <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-black mb-4 text-gray-900 tracking-tight">
          Detecting <span className="text-emerald-500">Pollution Drivers</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium px-4">
          Uncovering the specific sources impacting your local atmosphere in real-time.
        </p>
      </section>

      {/* SEARCH */}
      <div className="max-w-[1200px] mx-auto px-6 mb-12">
        <div className="bg-white border border-emerald-100 rounded-[2rem] p-5 flex flex-wrap gap-4 shadow-lg shadow-emerald-900/5 items-center">
          <div className="flex-1 min-w-[280px] relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={inputCity}
              onChange={(e) => setInputCity(e.target.value)}
              placeholder="Search destination or city..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50/50 border border-gray-100 outline-none text-lg font-medium focus:border-emerald-400 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              disabled={isLoading}
              onClick={() => fetchData(inputCity)}
              className="flex-1 sm:flex-none px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Search
            </button>

            <button
              disabled={isLoading}
              onClick={handleUseCurrentLocation}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-200 text-emerald-600 font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Navigation className="w-5 h-5" />
              Local
            </button>
          </div>
        </div>
      </div>

      {/* LOADER */}
      {isLoading && (
        <div className="flex justify-center items-center py-20 px-6">
          <div className="bg-white border border-emerald-100 rounded-[3rem] p-12 shadow-xl flex flex-col items-center max-w-sm w-full">
            <div className="relative w-20 h-20 mb-8">
               <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
               <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
               <div className="absolute inset-4 rounded-full bg-emerald-50 animate-pulse flex items-center justify-center">
                  <Wind className="w-6 h-6 text-emerald-500" />
               </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Analyzing Atmosphere</h3>
            <p className="text-center text-gray-400 font-medium">Synchronizing with global AQI sensors...</p>
          </div>
        </div>
      )}

      {/* RESULT */}
      {!isLoading && data && (
        <>
          <div className="max-w-[1200px] mx-auto px-6 pb-24">
            <div className="bg-white border border-emerald-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-50/50 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                    <MapPin className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">{data.city}</h2>
                    <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest mt-2 bg-gray-50 px-3 py-1 rounded-full w-fit border border-gray-100">
                      LAT {data.coordinates.lat.toFixed(3)} <span className="opacity-30">•</span> LON {data.coordinates.lon.toFixed(3)}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-6 p-6 rounded-[2.5rem] bg-gray-50 border border-gray-100 shadow-inner`}>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Atmosphere Quality</p>
                    <p className="text-xl font-bold text-gray-800">Unhealthy Impact</p>
                  </div>
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg ${getAQIColorClass(data.aqi).replace('text-', 'text-white bg-')}`}>
                    {data.aqi}
                  </div>
                </div>
              </div>

              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 border-b border-gray-50 pb-4">
                Sector Contribution Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {Object.entries(data.contribution).map(([key, value]) => {
                  const colors = sectorColorMap[key];
                  const sectorIcon = pollutionSectors.find(s => s.key === key)?.icon || <Wind />;
                  return (
                    <div
                      key={key}
                      className="rounded-[2rem] p-7 border bg-gray-50 transition-all hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 group"
                      style={{ borderColor: `${colors.hex}15` }}
                    >
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm transition-transform group-hover:scale-110" style={{ color: colors.hex }}>
                            {React.cloneElement(sectorIcon, { size: 24 })}
                         </div>
                         <span className="text-4xl font-black tracking-tighter" style={{ color: colors.hex }}>{value}%</span>
                      </div>

                      <div className="space-y-4">
                         <h4 className="font-bold text-gray-800 capitalize text-lg">{key}</h4>
                         <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-gray-100">
                           <div
                             className="h-full rounded-full transition-all duration-1000"
                             style={{ width: `${value}%`, background: colors.hex, boxShadow: `0 0 10px ${colors.hex}30` }}
                           />
                         </div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                           {data.detectedSources?.[key] ?? 0} Critical Sources
                         </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <section className="py-[40px] pb-[80px]">
            <div className="max-w-[1280px] mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold mb-4 text-gray-800">How to <span className="text-emerald-500">Reduce Pollution</span></h2>
                <p className="text-gray-500 max-w-[600px] mx-auto font-medium">Comprehensive solutions for each pollution source — from individual actions to systemic changes.</p>
              </div>

              {pollutionSectors.map((sector, sectorIndex) => (
                <div key={sector.key} className="mb-12">
                  <div className="flex items-center gap-4 mb-6 p-6 rounded-3xl border bg-white shadow-sm" style={{ borderColor: `${sector.color}20` }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-50" style={{ color: sector.color }}>
                      {sector.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-bold text-gray-800">{sector.label}</h3>
                        <span className="px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider" style={{ background: `${sector.color}15`, color: sector.color }}>
                          {data.contribution?.[sector.key] ?? 0}% Contribution
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-500">{sector.description}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-emerald-500" />
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8">
                    {sector.detailedSolutions.map((solution) => (
                      <div key={solution.title} className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 group-hover:bg-emerald-50 transition-colors" style={{ color: sector.color }}>
                            {solution.icon}
                          </div>
                          <h4 className="text-xl font-bold text-gray-800">{solution.title}</h4>
                        </div>
                        <ul className="space-y-4">
                          {solution.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 group-hover:bg-gray-50 transition-colors">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                              <span className="text-[15px] font-medium text-gray-600 leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="py-[60px] pb-[80px]">
            <div className="max-w-[1280px] mx-auto px-4">
              <div className="p-12 rounded-[3rem] text-center border border-emerald-100 bg-white shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/30 pointer-events-none"></div>
                <Users className="w-12 h-12 text-emerald-500 mx-auto mb-6 relative z-10" />
                <h2 className="text-3xl font-black text-gray-800 mb-4 relative z-10">Every Action Counts</h2>
                <p className="text-gray-500 max-w-[600px] mx-auto mb-8 text-lg font-medium relative z-10">
                  Join thousands of citizens making sustainable choices. Track your impact, earn rewards, and contribute to cleaner air for everyone.
                </p>
                <div className="flex gap-4 justify-center flex-wrap relative z-10">
                  <Link to="/dashboard">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-14 px-10 rounded-2xl shadow-lg shadow-emerald-200">
                      Get Your Score <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" className="h-14 px-10 rounded-2xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-bold">Back to Home</Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      <Footer />
    </div>
  );
};

export default PollutionSources;
