import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Users,
  Target,
  Award,
  Globe,
} from "lucide-react";

const slides = [
  {
    id: 1,
    type: "story",
    title: "The Story Begins...",
    icon: Globe,
    content: {
      heading: "A Journey Through Delhi's Air",
      story: `Meet Rahul, a software engineer living in Delhi. Every morning, his brother Amit leaves for office, navigating through the city's congested streets.\n\nOne smoggy winter morning, Amit checked his usual route — the AQI was 387. Dangerous. His eyes burned, throat scratched. He wondered: "Is there a better way?"\n\nHe tried Google Maps for the fastest route, but it didn't consider air quality. He switched to a bike some days, but wasn't sure if it actually helped. He bought "eco-friendly" products, but had no way to measure their real impact.\n\nAmit wasn't alone. Millions face this daily — wanting to make better choices but lacking the tools to measure, track, and improve.`,
      image: "🌫️",
    },
  },
  {
    id: 2,
    type: "problem",
    title: "The Problem",
    icon: AlertTriangle,
    content: {
      heading: "Why Current Solutions Fail",
      problems: [
        {
          title: "No AQI-Aware Navigation",
          description: "Maps show fastest routes, not healthiest. You might save 5 minutes but inhale 10x more toxins.",
        },
        {
          title: "Invisible Carbon Footprint",
          description: "People don't know how their daily choices — electricity, fuel, shopping — impact pollution.",
        },
        {
          title: "Greenwashing Confusion",
          description: "Products claim to be 'eco-friendly' but there's no standardized way to compare their real environmental impact.",
        },
        {
          title: "No Motivation to Change",
          description: "Without gamification, social comparison, or visible progress, sustainable habits don't stick.",
        },
      ],
    },
  },
  {
    id: 3,
    type: "solution",
    title: "Our Solution",
    icon: Lightbulb,
    content: {
      heading: "Introducing EcoSense",
      tagline: "Your Personal Pollution Intelligence Platform",
      features: [
        {
          icon: "🎯",
          title: "Pollution Credit Score",
          description: "Like a CIBIL score for your environmental impact. Track your 0–900 score based on energy, transport, shopping & lifestyle.",
        },
        {
          icon: "🗺️",
          title: "AQI-Aware Routes",
          description: "Navigate smarter, not just faster. We rank routes by pollution exposure, helping you breathe easier.",
        },
        {
          icon: "📦",
          title: "Product Scanner",
          description: "Scan any product to see its environmental impact and discover sustainable alternatives instantly.",
        },
        {
          icon: "👨‍👩‍👧‍👦",
          title: "Family Competition",
          description: "Challenge your family to reduce pollution together. Track, compare, and celebrate eco-wins.",
        },
      ],
    },
  },
  {
    id: 4,
    type: "impact",
    title: "Environmental Impact",
    icon: TrendingUp,
    content: {
      heading: "What If Everyone Used EcoSense?",
      stats: [
        { value: "30%", label: "Reduction in toxic inhalation", description: "By choosing AQI-optimized routes" },
        { value: "45%", label: "More sustainable purchases", description: "When users see product impact scores" },
        { value: "2.5 Tons", label: "CO₂ saved per user/year", description: "Through behavior change & awareness" },
        { value: "10M+", label: "Trees equivalent", description: "If 1M Delhi residents adopt EcoSense" },
      ],
      beforeAfter: {
        before: "Without EcoSense: Amit inhales 12μg PM2.5 daily, uses single-use plastics, drives polluting routes",
        after: "With EcoSense: 40% less pollution exposure, sustainable product choices, family competing to go green",
      },
    },
  },
  {
    id: 5,
    type: "features",
    title: "Key Features",
    icon: Target,
    content: {
      heading: "Complete Ecosystem for Sustainable Living",
      categories: [
        {
          title: "🎮 Gamification",
          items: ["Weekly pollution challenges", "Leaderboards with friends", "Badges & rewards", "Streak bonuses"],
        },
        {
          title: "🔔 Smart Alerts",
          items: ["Predictive AQI forecasts", "High-pollution zone warnings", "Best travel time suggestions", "Real-time exposure tracking"],
        },
        {
          title: "📊 Insights",
          items: ["Route pollution heatmaps", "Monthly health reports", "Carbon footprint trends", "Improvement suggestions"],
        },
        {
          title: "👪 Family Mode",
          items: ["Household competition", "Combined family score", "Daily routine tracking", "Photo proof uploads"],
        },
      ],
    },
  },
  {
    id: 6,
    type: "demo",
    title: "See It In Action",
    icon: Users,
    content: {
      heading: "User Journey",
      steps: [
        { step: 1, title: "Onboard", description: "Answer lifestyle questionnaire, get initial pollution score" },
        { step: 2, title: "Navigate", description: "Search routes, see AQI comparison, choose healthiest path" },
        { step: 3, title: "Scan", description: "Scan products, see impact, discover eco alternatives" },
        { step: 4, title: "Compete", description: "Join family challenges, climb leaderboards, earn badges" },
        { step: 5, title: "Improve", description: "Track monthly reports, see your impact, celebrate wins" },
      ],
    },
  },
  {
    id: 7,
    type: "closing",
    title: "Join the Movement",
    icon: Award,
    content: {
      heading: "Every Breath Counts",
      message:
        "EcoSense isn't just an app — it's a movement towards conscious living. We're not asking people to change overnight. We're giving them the tools to see their impact, make informed choices, and celebrate every small win.",
      cta: "Be Part of the Solution",
      stats: [
        { icon: "🌱", label: "Start tracking your pollution score today" },
        { icon: "🏆", label: "Challenge your family to go green" },
        { icon: "🌍", label: "Join millions making Delhi breathable again" },
      ],
    },
  },
];

/* ── shared card style ── */
const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
};

const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => { if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1); };
  const prevSlide = () => { if (currentSlide > 0) setCurrentSlide(currentSlide - 1); };

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  const renderSlideContent = () => {
    switch (slide.type) {

      case "story":
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "64px", marginBottom: "16px" }}>{slide.content.image}</p>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#059669", marginBottom: "20px" }}>
              {slide.content.heading}
            </h2>
            <div style={{ ...card, maxWidth: "680px", margin: "0 auto", textAlign: "left" }}>
              <p style={{ color: "#374151", lineHeight: "1.85", whiteSpace: "pre-line", fontSize: "14px" }}>
                {slide.content.story}
              </p>
            </div>
          </div>
        );

      case "problem":
        return (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#dc2626", textAlign: "center", marginBottom: "24px" }}>
              {slide.content.heading}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
              {slide.content.problems.map((p, i) => (
                <div key={i} style={{ ...card, borderLeft: "3px solid #fca5a5" }}>
                  <h3 style={{ fontWeight: "600", color: "#111827", marginBottom: "6px", fontSize: "14px" }}>{p.title}</h3>
                  <p style={{ color: "#6b7280", fontSize: "13px", lineHeight: "1.6" }}>{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "solution":
        return (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#059669", marginBottom: "6px" }}>
                {slide.content.heading}
              </h2>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>{slide.content.tagline}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              {slide.content.features.map((f, i) => (
                <div key={i} style={{ ...card, textAlign: "center" }}>
                  <p style={{ fontSize: "36px", marginBottom: "10px" }}>{f.icon}</p>
                  <h3 style={{ fontWeight: "600", color: "#059669", marginBottom: "6px", fontSize: "14px" }}>{f.title}</h3>
                  <p style={{ color: "#6b7280", fontSize: "13px", lineHeight: "1.6" }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "impact":
        return (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#059669", textAlign: "center", marginBottom: "24px" }}>
              {slide.content.heading}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              {slide.content.stats.map((s, i) => (
                <div key={i} style={{ ...card, textAlign: "center", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p style={{ fontSize: "28px", fontWeight: "700", color: "#059669", margin: "0 0 4px" }}>{s.value}</p>
                  <p style={{ fontWeight: "600", color: "#111827", fontSize: "13px", marginBottom: "2px" }}>{s.label}</p>
                  <p style={{ color: "#9ca3af", fontSize: "11px" }}>{s.description}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
              <div style={{ ...card, borderLeft: "3px solid #fca5a5", background: "#fff5f5" }}>
                <h3 style={{ fontWeight: "600", color: "#dc2626", marginBottom: "6px", fontSize: "13px" }}>❌ Before EcoSense</h3>
                <p style={{ color: "#6b7280", fontSize: "13px", lineHeight: "1.6" }}>{slide.content.beforeAfter.before}</p>
              </div>
              <div style={{ ...card, borderLeft: "3px solid #6ee7b7", background: "#f0fdf4" }}>
                <h3 style={{ fontWeight: "600", color: "#059669", marginBottom: "6px", fontSize: "13px" }}>✅ After EcoSense</h3>
                <p style={{ color: "#6b7280", fontSize: "13px", lineHeight: "1.6" }}>{slide.content.beforeAfter.after}</p>
              </div>
            </div>
          </div>
        );

      case "features":
        return (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#059669", textAlign: "center", marginBottom: "24px" }}>
              {slide.content.heading}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              {slide.content.categories.map((cat, i) => (
                <div key={i} style={{ ...card }}>
                  <h3 style={{ fontWeight: "600", color: "#111827", marginBottom: "12px", fontSize: "14px" }}>{cat.title}</h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {cat.items.map((item, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#374151" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case "demo":
        return (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#059669", textAlign: "center", marginBottom: "32px" }}>
              {slide.content.heading}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", alignItems: "flex-start" }}>
              {slide.content.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ textAlign: "center", maxWidth: "120px" }}>
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "50%",
                      background: "#10b981", color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 10px", fontSize: "20px", fontWeight: "700"
                    }}>
                      {step.step}
                    </div>
                    <h3 style={{ fontWeight: "600", color: "#111827", marginBottom: "4px", fontSize: "13px" }}>{step.title}</h3>
                    <p style={{ color: "#9ca3af", fontSize: "12px", lineHeight: "1.5" }}>{step.description}</p>
                  </div>
                  {i < slide.content.steps.length - 1 && (
                    <ChevronRight style={{ color: "#d1d5db", marginTop: "14px", flexShrink: 0 }} size={20} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "closing":
        return (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#059669", marginBottom: "20px" }}>
              {slide.content.heading}
            </h2>
            <p style={{ color: "#374151", fontSize: "15px", lineHeight: "1.85", maxWidth: "640px", margin: "0 auto 28px" }}>
              {slide.content.message}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginBottom: "28px" }}>
              {slide.content.stats.map((s, i) => (
                <div key={i} style={{ ...card, display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px" }}>
                  <span style={{ fontSize: "20px" }}>{s.icon}</span>
                  <span style={{ color: "#374151", fontSize: "13px", fontWeight: "500" }}>{s.label}</span>
                </div>
              ))}
            </div>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#10b981", color: "white",
              border: "none", borderRadius: "10px",
              padding: "12px 28px", fontSize: "15px", fontWeight: "600", cursor: "pointer"
            }}>
              <Leaf size={16} />
              {slide.content.cta}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0faf5", fontFamily: "'Inter', sans-serif" }} className="mt-16">
      <Navbar />
      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "32px 20px" }}>

        {/* ── Progress Bar ── */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              style={{
                height: "5px", flex: 1, borderRadius: "99px", border: "none", cursor: "pointer",
                background: i === currentSlide ? "#10b981" : i < currentSlide ? "#a7f3d0" : "#e5e7eb",
                transition: "background 0.3s"
              }}
            />
          ))}
        </div>

        {/* ── Slide Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "28px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "#dcfce7", border: "1px solid #bbf7d0",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <SlideIcon size={18} color="#059669" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: 0 }}>
            {slide.title}
          </h1>
          <span style={{
            fontSize: "12px", color: "#9ca3af", fontWeight: "500",
            background: "white", border: "1px solid #e5e7eb",
            borderRadius: "99px", padding: "3px 10px"
          }}>
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* ── Slide Content ── */}
        <div style={{ minHeight: "380px", marginBottom: "28px" }}>
          {renderSlideContent()}
        </div>

        {/* ── Navigation ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 18px", borderRadius: "9px",
              border: "1px solid #e5e7eb", background: "white",
              fontSize: "13px", fontWeight: "600",
              color: currentSlide === 0 ? "#d1d5db" : "#374151",
              cursor: currentSlide === 0 ? "not-allowed" : "pointer",
              transition: "all 0.15s"
            }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {/* Dot indicators */}
          <div style={{ display: "flex", gap: "6px" }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                style={{
                  width: i === currentSlide ? "20px" : "8px",
                  height: "8px",
                  borderRadius: "99px",
                  border: "none", cursor: "pointer",
                  background: i === currentSlide ? "#10b981" : "#d1d5db",
                  transition: "all 0.25s"
                }}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 18px", borderRadius: "9px", border: "none",
              fontSize: "13px", fontWeight: "600",
              background: currentSlide === slides.length - 1 ? "#e5e7eb" : "#10b981",
              color: currentSlide === slides.length - 1 ? "#9ca3af" : "white",
              cursor: currentSlide === slides.length - 1 ? "not-allowed" : "pointer",
              transition: "all 0.15s"
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Presentation;