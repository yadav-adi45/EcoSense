import Navbar from "@/components/Navbar";
import { ChevronRight, Leaf } from "lucide-react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "./Footer"
import LiveAQISection from "@/components/LiveAQISection";

const Home = () => {
  const navigation = useNavigate('')
  const keyframes = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 30px rgba(29, 185, 84, 0.3); }
      50% { box-shadow: 0 0 60px rgba(29, 185, 84, 0.5); }
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;

  // 🔹 Feature cards
  const features = [
    {
      title: "Real-Time AQI Mapping",
      desc: "Visualize pollution exposure across different routes in real time.",
    },
    {
      title: "Smart Route Suggestions",
      desc: "Choose routes that balance speed and air quality.",
    },
    {
      title: "Personal Pollution Score",
      desc: "Track how daily travel and habits impact your health.",
    },
    {
      title: "Eco-Friendly Alternatives",
      desc: "Get recommendations for greener transport and lifestyle.",
    },
    {
      title: "Predictive AQI Alerts",
      desc: "Know high-pollution zones before you reach them.",
    },
    {
      title: "Gamification & Rewards",
      desc: "Challenges, leaderboards, and rewards for greener choices.",
    },
  ];

  // 🔹 ADDED: Review data
  const reviews = [
    {
      name: "Priya Sharma",
      role: "Daily Office Commuter",
      text: "EcoSense completely changed how I travel. I now avoid high-pollution routes without adding much time.",
    },
    {
      name: "Rahul Mehta",
      role: "Fitness Enthusiast",
      text: "The pollution score made me aware of my habits. Small changes are making a big difference.",
    },
    {
      name: "Ananya Verma",
      role: "College Student",
      text: "The challenges and leaderboard keep me motivated. Going green finally feels fun!",
    },
  ];

  const [statesList, setStatesList] = React.useState([]);
  const [loadingStates, setLoadingStates] = React.useState(true);
  const [stateSearch, setStateSearch] = React.useState("");
  const [statesRefreshing, setStatesRefreshing] = React.useState(false);

  const fetchStatesAQI = () => {
    setStatesRefreshing(true);
    fetch("/api/v5/states-aqi")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.states)) {
          setStatesList(data.states);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch states AQI:", err);
      })
      .finally(() => {
        setLoadingStates(false);
        setStatesRefreshing(false);
      });
  };

  React.useEffect(() => {
    fetchStatesAQI();
  }, []);

  const filteredStates = statesList.filter(
    (item) =>
      item.state.toLowerCase().includes(stateSearch.toLowerCase()) ||
      item.city?.toLowerCase().includes(stateSearch.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen bg-[#f0faf5] text-gray-900 font-sans">
        <style>{keyframes}</style>

        <Navbar />

        {/* 🔹 NEW HERO SECTION */}
        <section className="relative flex items-center justify-center text-center px-6 py-32 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_65%)]"></div>

          <div
            className="relative z-10 max-w-4xl"
            style={{ animation: "fadeInUp 1.1s ease-out" }}
          >
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Track Your Impact. <br />
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Breathe Cleaner Air.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              EcoSense calculates your personal Pollution Credit Score,
              recommends low-AQI routes, and helps you switch to sustainable
              alternatives — all in one app.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 font-semibold flex items-center justify-center gap-2 hover:scale-105 transition"
                style={{ animation: "pulseGlow 2.5s infinite" }}

                onClick={() => navigation('/dashboard')}
              >
                Get Your Score →
              </button>

              <button className="px-8 py-4 rounded-xl border border-emerald-100 text-gray-600 bg-white shadow-sm hover:border-emerald-300 transition"
                onClick={() => navigation('/pitch')}
              >
                View Demo
              </button>
            </div>
          </div>
        </section>

        {/* 🔹 LIVE STATE AQI SECTION */}
        <LiveAQISection />
        <section className="py-24 px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Ground Telemetry
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                Live State <span className="text-emerald-500">AQI Overview</span> 🌍
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Real-time ground station air quality across major Indian states.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search state or city..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 shadow-sm w-48 sm:w-60"
              />
              <button
                onClick={fetchStatesAQI}
                disabled={statesRefreshing}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className={statesRefreshing ? "animate-spin" : ""}>🔄</span>
                {statesRefreshing ? "Updating" : "Refresh"}
              </button>
            </div>
          </div>

          {loadingStates ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-pulse flex flex-col items-center">
                  <div className="w-32 h-4 bg-gray-200 rounded-full mb-6"></div>
                  <div className="w-36 h-36 rounded-full bg-gray-100 mb-6"></div>
                  <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStates.map((item, index) => {
                const percentage = Math.min(100, (item.aqi / item.max) * 100);

                return (
                  <div
                    key={index}
                    className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition text-center flex flex-col justify-between"
                    style={{ animation: "scaleIn 0.5s ease forwards" }}
                  >
                    {/* Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.04),transparent_70%)] rounded-3xl blur-xl"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-400">
                          {item.city}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          LIVE
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-800 mb-4">
                        {item.state}
                      </h3>

                      {/* Circular AQI Ring */}
                      <div className="relative w-36 h-36 mx-auto mb-6">
                        <svg className="w-full h-full rotate-[-90deg]">
                          <circle
                            cx="72"
                            cy="72"
                            r="60"
                            stroke="#f1f5f9"
                            strokeWidth="9"
                            fill="none"
                          />
                          <circle
                            cx="72"
                            cy="72"
                            r="60"
                            stroke="currentColor"
                            strokeWidth="9"
                            fill="none"
                            className={item.color}
                            strokeDasharray="377"
                            strokeDashoffset={377 - (377 * percentage) / 100}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 0.8s ease" }}
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-gray-800">
                            {item.aqi}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            AQI / {item.max}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold ${item.bg} border ${item.border} ${item.color}`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-gray-400 line-clamp-1 max-w-[220px]" title={item.station}>
                          {item.station}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        

        {/* 🌳 TREE STRUCTURE SECTION */}
        <section className="relative py-32 px-6 overflow-hidden">
          {/* Center Trunk */}
          <div className="relative z-10 flex justify-center mb-24">
            <div className="bg-white px-12 py-10 rounded-full border border-emerald-200 shadow-xl shadow-emerald-900/5 text-center">
              <h2 className="text-3xl font-bold text-emerald-600 mb-2">
                EcoSense 🌱
              </h2>
              <p className="text-gray-600 text-sm max-w-xs">
                The core engine that tracks, predicts, and reduces your
                pollution exposure.
              </p>
            </div>
          </div>

          {/* Branch Lines */}
          <div className="absolute inset-0 flex justify-center">
            <div className="w-[2px] h-full bg-gradient-to-b from-emerald-200 to-transparent"></div>
          </div>

          {/* Leaves */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-y-24 gap-x-16 max-w-6xl mx-auto">
            {[
              {
                title: "Real-Time AQI Mapping",
                desc: "Live visualization of pollution exposure across routes.",
                rotate: "-rotate-6",
              },
              {
                title: "Smart Route Suggestions",
                desc: "Balance speed with cleaner air choices.",
                rotate: "rotate-3",
              },
              {
                title: "Personal Pollution Score",
                desc: "Measure how your habits impact your health.",
                rotate: "-rotate-3",
              },
              {
                title: "Eco-Friendly Alternatives",
                desc: "Greener transport and lifestyle options.",
                rotate: "rotate-6",
              },
              {
                title: "Predictive AQI Alerts",
                desc: "Avoid high pollution zones before you reach them.",
                rotate: "-rotate-6",
              },
              {
                title: "Gamification & Rewards",
                desc: "Challenges and rewards that motivate green habits.",
                rotate: "rotate-3",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`relative bg-white p-6 rounded-[3rem] border border-emerald-100 cursor-pointer shadow-lg shadow-emerald-900/5 ${item.rotate} hover:rotate-0 hover:scale-105 transition duration-500`}
              >
                {/* Leaf Tip */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-400 rounded-full shadow-sm"></div>

                <h3 className="text-xl font-semibold text-emerald-600 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 🔹 ADDED: IMPACT STATS SECTION */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            <div>
              <h3 className="text-4xl font-bold text-emerald-600">40%</h3>
              <p className="text-gray-500 mt-2">Less Pollution Exposure</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-emerald-600">25%</h3>
              <p className="text-gray-500 mt-2">Lower Carbon Footprint</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-emerald-600">3×</h3>
              <p className="text-gray-500 mt-2">Higher Engagement</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-emerald-600">85%</h3>
              <p className="text-gray-500 mt-2">Behavior Change</p>
            </div>
          </div>
        </section>

        <section className="w-full relative overflow-hidden py-20">
          {/* Background Gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-r 
    from-[#1db9540d] via-[#1fa8a10d] to-[#199fe60d]"
          />

          <div className="relative z-10 mx-auto max-w-7xl px-4">
            <div
              className="
      rounded-3xl border border-[#1db95433]
      bg-white backdrop-blur-2xl
      p-8 sm:p-12 text-center
      shadow-[0_0_60px_rgba(29,185,84,0.15)]
    "
            >
              {/* Icon */}
              <Leaf
                className="
        mx-auto mb-6 h-16 w-16 text-emerald-500
        animate-float
      "
              />

              {/* Heading */}
              <h2
                className="
        mb-4 font-bold
        text-[clamp(1.5rem,4vw,2.5rem)]
        font-['Space_Grotesk']
      "
              >
                Ready to Make a Difference?
              </h2>

              {/* Description */}
              <p
                className="
        mx-auto mb-8 max-w-xl
        text-gray-500
      "
              >
                Join thousands of eco-conscious citizens tracking their impact
                and breathing cleaner air with EcoSense.
              </p>

              {/* Button */}
              <Link to="/register">
                <button
                  className="
            inline-flex items-center gap-2
            rounded-xl px-8 py-4
            text-base font-semibold
            text-white
            bg-gradient-to-br from-emerald-500 to-teal-500 text-white
            shadow-[0_0_30px_rgba(29,185,84,0.4)]
            transition-all duration-300
            hover:-translate-y-1
            hover:shadow-[0_0_50px_rgba(29,185,84,0.6)]
          "
                >
                  Start Your Journey
                  <ChevronRight className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* 🔹 ADDED: REVIEW / TESTIMONIAL SECTION */}
        <section className="py-24 px-8">
          <h2 className="text-3xl font-bold text-center text-emerald-600 mb-14">
            What Users Say 💬
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-emerald-100 border-emerald-50 hover:border-green-400 transition"
                style={{
                  animation: "fadeInUp 0.8s ease forwards",
                  animationDelay: `${index * 0.15}s`,
                }}
              >
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  “{review.text}”
                </p>
                <div>
                  <h4 className="text-emerald-600 font-semibold">
                    {review.name}
                  </h4>
                  <span className="text-emerald-500 text-xs font-semibold uppercase tracking-widest">{review.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <Footer></Footer>
        
      </div>
    </>
  );
};

export default Home;
