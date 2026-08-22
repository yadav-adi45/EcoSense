import { useEffect, useState, useRef, useContext } from "react";
import Navbar from "@/components/Navbar";
import Footer from "./Footer";
import AIWritingAssistant from "@/components/ui/AIWritingAssistant";
import {
  User,
  Trophy,
  Leaf,
  Zap,
  Car,
  ShoppingBag,
  Award,
  Target,
  Calendar,
  MapPin,
  Edit3,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Wand2,
  RefreshCw,
  Save,
  Phone,
  Mail,
  Camera,
  Coins,
  Route as RouteIcon,
  ShieldCheck,
  TrendingUp,
  Lock,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { getAuthHeaders, getToken } from "@/utils/auth";
import { serverUrl } from "@/main";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/components/context/context";

/* ─── Available Eco Interests Tags ─── */
const ECO_INTEREST_OPTIONS = [
  { id: "clean_air", label: "🌿 Clean Air", desc: "Low-AQI commuting" },
  { id: "ev_routes", label: "⚡ EV Routes", desc: "Charging network access" },
  { id: "zero_waste", label: "♻️ Zero Waste", desc: "Plastic-free living" },
  { id: "green_commute", label: "🚲 Green Commute", desc: "Cycling & walking" },
  { id: "tree_planting", label: "🌱 Tree Planting", desc: "Urban afforestation" },
  { id: "solar_energy", label: "☀️ Solar Energy", desc: "Renewable power" },
  { id: "water_conservation", label: "💧 Water Conservation", desc: "Rainwater & saving" },
  { id: "wildlife_safety", label: "🐾 Wildlife Safety", desc: "Animal collision safety" },
  { id: "plant_diet", label: "🥗 Plant-Based Diet", desc: "Lower carbon footprint" },
  { id: "eco_shopping", label: "📦 Eco Products", desc: "Sustainable shopping" },
];

/* ─── Achievement Badges ─── */
const BADGES = [
  { id: "warrior", name: "Eco Warrior", description: "Completed green route navigation", icon: Trophy, earned: true },
  { id: "streak", name: "Green Streak", description: "Active on EcoSense platform", icon: Zap, earned: true },
  { id: "carbon", name: "Carbon Crusher", description: "Saved >100kg CO₂ emissions", icon: Leaf, earned: true },
  { id: "transit", name: "Clean Commuter", description: "Navigated with low-AQI routes", icon: RouteIcon, earned: true },
  { id: "coins", name: "Eco Collector", description: "Earned 50+ EcoCoins", icon: Coins, earned: false },
  { id: "guardian", name: "Air Guardian", description: "Monitored AQI hotspots", icon: ShieldCheck, earned: false },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, setUser: setAuthUser } = useContext(AuthContext);

  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);

  // States for actions
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [generatingAIBio, setGeneratingAIBio] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Route history from localStorage
  const [routeHistory, setRouteHistory] = useState([]);

  const fileInputRef = useRef(null);

  // Fetch full profile from backend
  const fetchProfile = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${serverUrl}/api/v1/profile/me`, {
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json();

      if (data.success && data.user) {
        setProfileData(data.user);
        setStats(data.stats || {});

        // Pre-fill editable state
        setName(data.user.name || "");
        setBio(data.user.profile?.bio || "");
        setLocation(data.user.profile?.location || "");
        setPhone(data.user.profile?.phone || "");
        setSelectedInterests(data.user.profile?.interests || []);
      }
    } catch (err) {
      console.error("Profile load error:", err);
      toast.error("Could not load latest profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Load route history
    try {
      const saved = localStorage.getItem("ecosense_route_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRouteHistory(parsed.slice(-6).reverse());
        }
      }
    } catch (e) {
      console.warn("Route history parse error:", e);
    }
  }, []);

  // Handle Save Personal Details
  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch(`${serverUrl}/api/v1/profile/update`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          phone: phone.trim(),
          interests: selectedInterests,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Profile details updated successfully! 🌿");
        setProfileData((prev) => ({
          ...prev,
          name: data.user.name,
          profile: { ...prev?.profile, ...data.user.profile },
        }));

        // Update auth context if present
        if (authContextAvailable(authUser)) {
          setAuthUser((prev) => ({
            ...prev,
            name: data.user.name,
            profile: data.user.profile,
          }));
        }
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Error saving profile details");
    } finally {
      setSavingProfile(false);
    }
  };

  // Helper function to check context
  const authContextAvailable = (user) => Boolean(user && typeof user === "object");

  // Handle Save Bio
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const res = await fetch(`${serverUrl}/api/v1/profile/update`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: bio.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Bio saved successfully! ✨");
        setProfileData((prev) => ({
          ...prev,
          profile: { ...prev?.profile, bio: data.user.profile?.bio },
        }));
      } else {
        toast.error(data.message || "Failed to save bio");
      }
    } catch (err) {
      toast.error("Error saving bio");
    } finally {
      setSavingBio(false);
    }
  };

  // Auto-Generate Bio with AI
  const handleAutoGenerateBio = async () => {
    setGeneratingAIBio(true);
    try {
      const res = await fetch(`${serverUrl}/api/v1/profile/ai-bio`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentBio: bio,
          interests: selectedInterests,
          promptTone: "Inspiring & Eco-Focused",
        }),
      });

      const data = await res.json();
      if (data.success && data.generatedBio) {
        setBio(data.generatedBio);
        toast.success("🤖 AI crafted a new personalized eco bio!");
      } else {
        toast.error(data.message || "Could not generate bio");
      }
    } catch (err) {
      toast.error("AI Bio generator unavailable");
    } finally {
      setGeneratingAIBio(false);
    }
  };

  // Toggle Interest Tag
  const handleToggleInterest = async (tagLabel) => {
    const updated = selectedInterests.includes(tagLabel)
      ? selectedInterests.filter((t) => t !== tagLabel)
      : [...selectedInterests, tagLabel];

    setSelectedInterests(updated);

    // Auto-save interests on toggle
    try {
      await fetch(`${serverUrl}/api/v1/profile/update`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interests: updated }),
      });
    } catch (e) {
      console.warn("Auto-save interest tag error:", e);
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${serverUrl}/api/v1/profile/update`, {
        method: "PUT",
        headers: { ...getAuthHeaders() },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.user.profile?.profilePhoto) {
        toast.success("Profile photo updated! 📸");
        setProfileData((prev) => ({
          ...prev,
          profile: { ...prev?.profile, profilePhoto: data.user.profile.profilePhoto },
        }));
      } else {
        toast.error(data.message || "Failed to upload photo");
      }
    } catch (err) {
      toast.error("Error uploading profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0faf5] flex flex-col pt-20">
        <Navbar />
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-6 animate-pulse">
          <div className="h-44 bg-white/70 rounded-3xl border border-emerald-100/80 shadow-sm" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-white/70 rounded-3xl border border-emerald-100/80 shadow-sm" />
            <div className="h-64 bg-white/70 rounded-3xl border border-emerald-100/80 shadow-sm" />
            <div className="h-64 bg-white/70 rounded-3xl border border-emerald-100/80 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Not Logged In Screen ── */
  if (!getToken() || !profileData) {
    return (
      <div className="min-h-screen bg-[#f0faf5] flex flex-col pt-20">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-xl p-8 sm:p-10 max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">EcoSense Profile</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sign in to view your real-time eco impact, personal sustainability bio, EcoCoins rewards wallet, and clean-air route history.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="w-full py-3 px-6 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition-colors text-center"
              >
                Create New EcoSense Account
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Derived user details
  const userName = profileData.name || "Eco Warrior";
  const userEmail = profileData.email || "user@ecosense.ai";
  const userPhoto = profileData.profile?.profilePhoto || "";
  const userBio = bio || profileData.profile?.bio || "";
  const userLocation = location || profileData.profile?.location || "India";
  const userCoins = profileData.ecoCoins || 0;
  const ecoScore = stats?.ecoScore || 0;
  const carbonSaved = stats?.carbonSaved || "45 kg";
  const treesPlanted = stats?.treesPlanted || 2;
  const joinedDate = profileData.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Member";

  // Tier calculation
  const ecoTier =
    ecoScore >= 600
      ? { label: "Sustainability Champion", color: "from-emerald-600 to-teal-700", icon: Trophy, badge: "Master" }
      : ecoScore >= 300
      ? { label: "Green Guardian", color: "from-teal-600 to-cyan-700", icon: ShieldCheck, badge: "Intermediate" }
      : { label: "Eco Explorer", color: "from-emerald-500 to-green-600", icon: Leaf, badge: "Beginner" };

  // SVG Score calculation
  const RADIUS = 64;
  const CIRC = 2 * Math.PI * RADIUS;
  const scorePercent = Math.min(100, Math.max(0, (ecoScore / 900) * 100));
  const scoreOffset = CIRC - (scorePercent / 100) * CIRC;

  return (
    <div className="min-h-screen bg-[#f0faf5] flex flex-col pt-20 font-sans text-gray-900 select-none">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1">

        {/* ══════════════════════════════════════════════════
            1. HERO PROFILE BANNER CARD
        ══════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-xl overflow-hidden relative transition-all">
          
          {/* Top Decorative Gradient Banner */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>Verified Eco Member</span>
              </span>
            </div>
          </div>

          {/* Profile Header Info */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-16 sm:-mt-20">
              
              {/* Avatar + Basic Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                
                {/* Avatar with Camera Overlay */}
                <div className="relative group shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-emerald-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                    {userPhoto ? (
                      <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-3xl font-black">
                        {userName[0]?.toUpperCase() || "E"}
                      </div>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Upload overlay button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-1 right-1 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-white shadow-md transition-all duration-200 active:scale-95 cursor-pointer group-hover:scale-105"
                    title="Change profile photo"
                  >
                    {uploadingPhoto ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>

                {/* Name, Email, Meta */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{userName}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${ecoTier.color} uppercase tracking-wider shadow-xs`}>
                      {ecoTier.label}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-gray-500 flex items-center justify-center sm:justify-start gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{userEmail}</span>
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-bold text-gray-500 pt-1">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{userLocation || "India"}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Joined {joinedDate}</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* Quick Stat Pill Chips */}
              <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap pt-2 md:pt-0">
                
                {/* EcoCoins Wallet */}
                <Link
                  to="/eco-store"
                  className="bg-amber-50/90 hover:bg-amber-100 border border-amber-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 transition-all shadow-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs group-hover:rotate-12 transition-transform">
                    🪙
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-amber-700 block leading-none">EcoCoins</span>
                    <span className="text-lg font-black text-amber-900 leading-tight">{userCoins}</span>
                  </div>
                </Link>

                {/* Eco Impact Score */}
                <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-700 block leading-none">Eco Score</span>
                    <span className="text-lg font-black text-emerald-900 leading-tight">{ecoScore} / 900</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            2. AI-ENHANCED BIO SECTION (THE BOUNTY FEATURE ⭐)
        ══════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-lg p-6 sm:p-8 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-100/40 to-teal-100/20 rounded-full blur-2xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-gray-900">Personal Bio &amp; Eco Mission</h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    AI Enabled ⭐
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Share your environmental passion, green commuting journey, and sustainability vision.
                </p>
              </div>
            </div>

            {/* Quick Auto-Generate with AI Button */}
            <button
              type="button"
              onClick={handleAutoGenerateBio}
              disabled={generatingAIBio}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              title="Automatically generate a personalized eco bio using AI"
            >
              {generatingAIBio ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Generating Bio...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Auto-Generate Bio</span>
                </>
              )}
            </button>
          </div>

          {/* Bio Textarea */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={350}
                rows={3}
                placeholder="Write your eco-journey statement (e.g. 'Daily green commuter choosing zero-smog routes. Advocating for cleaner air and sustainable transit in NCR.')..."
                className="w-full p-4 rounded-2xl border border-gray-200/90 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm font-medium text-gray-800 transition-all placeholder:text-gray-400 leading-relaxed shadow-xs"
              />
              <span className="absolute bottom-3 right-3 text-[10px] font-black text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-md border border-gray-100">
                {bio.length} / 350
              </span>
            </div>

            {/* AI Writing Assistant Bar Component (Integrated for Bio) */}
            <AIWritingAssistant
              text={bio}
              onEnhance={(enhanced) => setBio(enhanced)}
              context="profile_bio"
            />

            {/* Save Bio Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveBio}
                disabled={savingBio}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {savingBio ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Bio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            3. ECO INTERESTS & PASSION TAGS
        ══════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-gray-900">Sustainability Interests</h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {selectedInterests.length} Selected
            </span>
          </div>

          <p className="text-xs text-gray-500 font-medium">
            Select the environmental domains you care most about. These will customize your route recommendations and community feed.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {ECO_INTEREST_OPTIONS.map((opt) => {
              const isSelected = selectedInterests.includes(opt.label);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleToggleInterest(opt.label)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all duration-200 border flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-102"
                      : "bg-gray-50/80 text-gray-700 border-gray-200 hover:bg-emerald-50/70 hover:border-emerald-200"
                  }`}
                  title={opt.desc}
                >
                  <span>{opt.label}</span>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            4. TWO COLUMN SECTION: IMPACT DASHBOARD & EDIT DETAILS
        ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          {/* LEFT: EDITABLE PERSONAL DETAILS FORM */}
          <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
              <Edit3 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-gray-900">Personal Details</h2>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs sm:text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Email Address</label>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Read-only
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-gray-50/80 text-xs sm:text-sm font-semibold text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* City / Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Location / City</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Delhi, NCR, India"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs sm:text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs sm:text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT: ECO IMPACT & PERFORMANCE METRICS */}
          <div className="space-y-6">
            
            {/* Impact Mastery Ring Card */}
            <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-lg p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-full flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black uppercase text-gray-700 tracking-wider">Eco Mastery Score</span>
                </div>
                <Link to="/questionnaire" className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1">
                  <span>Take Assessment</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Progress Circle */}
              <div className="relative flex items-center justify-center my-2">
                <svg width="150" height="150" className="transform -rotate-90">
                  <circle cx="75" cy="75" r={RADIUS} stroke="#f3f4f6" strokeWidth="12" fill="none" />
                  <circle
                    cx="75"
                    cy="75"
                    r={RADIUS}
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={CIRC}
                    strokeDashoffset={scoreOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-emerald-700 tracking-tight">{ecoScore}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase">of 900 PTS</span>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="w-full bg-emerald-50 border border-emerald-200/70 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>Rank: #{stats?.rank || 4} in District</span>
                <span className="px-2 py-0.5 bg-emerald-200/60 rounded-md text-[10px] font-black uppercase">
                  {stats?.ecoLevel || "Moderate"}
                </span>
              </div>
            </div>

            {/* Carbon & Trees Counter Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-md p-4 space-y-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <p className="text-[10px] uppercase font-black text-gray-400">Carbon Offset</p>
                <p className="text-xl font-black text-emerald-800">{carbonSaved}</p>
                <p className="text-[10px] text-gray-500 font-medium">Estimated emissions saved</p>
              </div>

              <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-md p-4 space-y-1">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                  <TreesIcon className="w-4 h-4" />
                </div>
                <p className="text-[10px] uppercase font-black text-gray-400">Trees Equivalent</p>
                <p className="text-xl font-black text-teal-800">{treesPlanted} Trees</p>
                <p className="text-[10px] text-gray-500 font-medium">Equiv. absorption rate</p>
              </div>
            </div>

          </div>

        </div>

        {/* ══════════════════════════════════════════════════
            5. RECENT CLEAN-AIR ROUTE HISTORY
        ══════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-gray-900">Recent Clean-Air Journeys</h2>
            </div>
            <Link
              to="/routes"
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Plan New Route</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {routeHistory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {routeHistory.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-gray-50/80 hover:bg-emerald-50/50 border border-gray-200/80 hover:border-emerald-200 transition-all space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <RouteIcon className="w-3 h-3" />
                      <span>{item.distance || "Route"}</span>
                    </span>
                    <span>{item.duration || "Journey"}</span>
                  </div>

                  <p className="text-xs font-extrabold text-gray-800 truncate">
                    {item.origin} ➔ {item.destination}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/40 text-[10px]">
                    <span className="font-bold text-gray-500">
                      Avg AQI: <strong className="text-gray-800">{item.avgAQI || 95}</strong>
                    </span>
                    {item.isEco && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-md uppercase">
                        🌿 Eco Route
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50/80 border border-emerald-100 rounded-2xl border-dashed space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <RouteIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-black text-gray-700">No route journeys recorded yet</p>
              <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                Calculate your first smog-avoiding route using the AI Clean-Air Planner to view and save your green transit routes.
              </p>
              <Link
                to="/routes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Open Clean-Air Route Planner</span>
              </Link>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            6. BADGES & ACHIEVEMENTS
        ══════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-gray-900">Badges &amp; Achievements</h2>
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase">
              {BADGES.filter((b) => b.earned).length} / {BADGES.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            {BADGES.map((b) => (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border flex flex-col items-center text-center space-y-1.5 transition-all ${
                  b.earned
                    ? "bg-emerald-50/70 border-emerald-200/80 shadow-xs scale-102"
                    : "bg-gray-50/60 border-gray-200 opacity-60"
                }`}
                title={b.description}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                    b.earned ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <b.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-gray-800 leading-tight">{b.name}</span>
                <span className="text-[9px] text-gray-500 line-clamp-2 leading-tight">{b.description}</span>
                {b.earned ? (
                  <span className="text-[9px] font-black text-emerald-700 uppercase bg-emerald-100/80 px-2 py-0.5 rounded-full mt-1">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-200 px-2 py-0.5 rounded-full mt-1">
                    Locked
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

// Simple Tree Icon Helper
const TreesIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
    <path d="M7 16v6" />
    <path d="M13 19v3" />
    <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-4 4.3a1 1 0 0 0 .8 1.7H10l-3 3.3a1 1 0 0 0 .7 1.7H8l-3 3.3A1 1 0 0 0 5.7 19H12Z" />
  </svg>
);

export default Profile;
