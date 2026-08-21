import React, { useMemo, useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Leaf, Recycle, ShoppingCart, Sparkles, Star, Filter, ExternalLink, Heart, Plus, Trash2, Search, Coins, Zap, Check, Gift } from "lucide-react";
import Footer from "./Footer";
import { AuthContext } from "../components/context/context";
import { ecoCoinService } from "../services/ecoCoinService";
import { toast } from "react-toastify";
import EcoCoinIcon from "../components/ui/EcoCoinIcon";

const CATEGORIES = [
  "Home Energy",
  "Travel",
  "Groceries",
  "Personal Care",
  "Electronics",
];

const PRODUCTS = [
  {
    id: "p1",
    name: "LED Bulb (9W)",
    brand: "EcoBright",
    category: "Home Energy",
    aqiImpact: "Low",
    co2SavedKg: 18,
    rating: 4.6,
    price: 199,
    link: "https://www.amazon.in/s?k=9w+led+bulb",
    image: "https://images.unsplash.com/photo-1496307653780-42ee777d4833?q=80&w=1200&auto=format&fit=crop",
    badges: ["Energy Star", "BEE 5★"],
    whyBetter:
      "Uses up to 85% less power than incandescent, lasts 10x longer, reduces peak demand.",
  },
  {
    id: "p2",
    name: "Organic Cotton Tote",
    brand: "GreenWeave",
    category: "Groceries",
    aqiImpact: "Low",
    co2SavedKg: 4,
    rating: 4.4,
    price: 299,
    link: "https://www.amazon.in/s?k=cotton+tote+bag",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    badges: ["Reusable", "Plastic-Free"],
    whyBetter:
      "Avoids single-use plastics, sturdy for daily grocery runs.",
  },
  {
    id: "p3",
    name: "Bamboo Toothbrush",
    brand: "EarthCare",
    category: "Personal Care",
    aqiImpact: "Very Low",
    co2SavedKg: 1.2,
    rating: 4.2,
    price: 149,
    link: "https://www.amazon.in/s?k=bamboo+toothbrush",
    image: "https://img.freepik.com/premium-photo/eco-friendly-bamboo-toothbrushes-with-natural-background_648871-8075.jpg",
    badges: ["Biodegradable", "Plastic-Free"],
    whyBetter:
      "Compostable handle, reduces plastic waste in landfills.",
  },
  {
    id: "p4",
    name: "Metro/Bus Smart Card",
    brand: "DMRC",
    category: "Travel",
    aqiImpact: "Very Low",
    co2SavedKg: 120,
    rating: 4.8,
    price: 150,
    link: "https://www.dmrcsmartcard.com/",
    image: "/images/metro_card.png",
    badges: ["Public Transit", "Low AQI Exposure"],
    whyBetter:
      "Shifts trips from private vehicles to transit, slashes per‑km emissions and exposure.",
  },
  {
    id: "p5",
    name: "Solar Power Bank",
    brand: "SunVolt",
    category: "Electronics",
    aqiImpact: "Low",
    co2SavedKg: 9,
    rating: 4.1,
    price: 1899,
    link: "https://www.amazon.in/s?k=solar+power+bank",
    image: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1200&auto=format&fit=crop",
    badges: ["Recharge via Sun", "Reusable"],
    whyBetter:
      "Charges on solar, reduces grid draw during peak fossil periods.",
  },
  {
    id: "p6",
    name: "HEPA Room Air Purifier",
    brand: "PureAir",
    category: "Home Energy",
    aqiImpact: "Exposure Guard",
    co2SavedKg: 0,
    rating: 4.5,
    price: 6999,
    link: "https://www.amazon.in/s?k=hepa+air+purifier",
    image: "https://m.media-amazon.com/images/I/71ipnrfS-1L._AC_SX208_CB1169409_QL70_.jpg",
    badges: ["HEPA 13", "PM2.5 Removal"],
    whyBetter:
      "Reduces indoor PM2.5 exposure during high-AQI days; pair with sealed rooms.",
  },
  {
    id: "p7",
    name: "Reusable Water Bottle",
    brand: "HydroFlask",
    category: "Personal Care",
    aqiImpact: "Low",
    co2SavedKg: 35,
    rating: 4.9,
    price: 899,
    link: "https://www.amazon.in/s?k=metal+water+bottle",
    image: "https://images.pexels.com/photos/4000090/pexels-photo-4000090.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
    badges: ["Plastic-Free", "Durable"],
    whyBetter: "Replaces hundreds of single-use plastic bottles every year.",
  },
  {
    id: "p8",
    name: "Solar Garden Lights",
    brand: "SolarGlow",
    category: "Home Energy",
    aqiImpact: "Low",
    co2SavedKg: 12,
    rating: 4.3,
    price: 1299,
    link: "https://www.amazon.in/s?k=solar+garden+lights",
    image: "https://images.pexels.com/photos/16632420/pexels-photo-16632420/free-photo-of-solar-lamp-in-garden.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    badges: ["Zero Energy", "Auto-Sensor"],
    whyBetter: "Lights up your garden using free solar energy, zero electricity cost.",
  },
  {
    id: "p9",
    name: "Beeswax Food Wraps",
    brand: "Apiary",
    category: "Groceries",
    aqiImpact: "Low",
    co2SavedKg: 2,
    rating: 4.5,
    price: 599,
    link: "https://www.amazon.in/s?k=beeswax+food+wraps",
    image: "https://images.pexels.com/photos/8250916/pexels-photo-8250916.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    badges: ["Biodegradable", "Washable"],
    whyBetter: "Natural alternative to plastic cling wrap, keeps food fresh effectively.",
  },
  {
    id: "p10",
    name: "Rechargeable Batteries",
    brand: "PowerLoop",
    category: "Electronics",
    aqiImpact: "Medium",
    co2SavedKg: 5,
    rating: 4.4,
    price: 899,
    link: "https://www.amazon.in/s?k=rechargeable+batteries",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1200&auto=format&fit=crop",
    badges: ["Less E-Waste", "Long Life"],
    whyBetter: "One rechargeable battery replaces up to 1000 single-use alkaline batteries.",
  },
  {
    id: "p11",
    name: "Compost Bin",
    brand: "EarthCycle",
    category: "Home Energy",
    aqiImpact: "Medium",
    co2SavedKg: 45,
    rating: 4.7,
    price: 1499,
    link: "https://www.amazon.in/s?k=compost+bin",
    image: "https://images.pexels.com/photos/6508357/pexels-photo-6508357.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    badges: ["Waste Reduction", "Fertilizer"],
    whyBetter: "Turns kitchen scraps into nutrient-rich soil, reducing landfill methane emissions.",
  },
  {
    id: "p12",
    name: "Bamboo Cutlery Set",
    brand: "EcoTravel",
    category: "Travel",
    aqiImpact: "Low",
    co2SavedKg: 1.5,
    rating: 4.3,
    price: 349,
    link: "https://www.amazon.in/s?k=bamboo+cutlery+set",
    image: "https://images.pexels.com/photos/4202392/pexels-photo-4202392.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    badges: ["Lightweight", "Reusable"],
    whyBetter: "Perfect for travel and office lunches, avoiding disposable plastic cutlery.",
  }
];

const Tag = ({ children }) => (
  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-gray-1000/20 uppercase tracking-tight">
    {children}
  </span>
);

const Rating = ({ value }) => {
  const full = Math.floor(value);
  return (
    <div className="flex items-center gap-0.5 text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < full ? "fill-yellow-400" : "text-gray-200"}`} />
      ))}
      <span className="ml-1 text-[11px] font-bold text-gray-400">{value.toFixed(1)}</span>
    </div>
  );
};

const ProductCard = ({ p, onAdd, onDelete, userCoins, onRedeemDiscount }) => {
  const [applyCoins, setApplyCoins] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Max 30% discount allowed or user's coin balance (1 coin = ₹1)
  const maxDiscountAllowed = Math.floor(p.price * 0.3);
  const discountAmount = Math.min(maxDiscountAllowed, userCoins);
  const finalPrice = applyCoins ? Math.max(0, p.price - discountAmount) : p.price;

  const handleBuyWithDiscount = async () => {
    if (applyCoins && discountAmount > 0) {
      setPurchasing(true);
      try {
        const res = await onRedeemDiscount(discountAmount, p);
        if (res?.success) {
          toast.success(`🎉 You saved ₹${discountAmount} using ${discountAmount} EcoCoins!`);
          if (p.link) {
            window.open(p.link, "_blank");
          }
        }
      } catch (err) {
        toast.error(err.message || "Failed to redeem EcoCoins");
      } finally {
        setPurchasing(false);
      }
    } else {
      if (p.link) window.open(p.link, "_blank");
    }
  };

  return (
    <Card className="bg-white border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative group rounded-3xl flex flex-col justify-between">
      <div>
        <div className="relative h-44 w-full overflow-hidden">
          <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute top-4 left-4 flex flex-wrap gap-1">
            {p.badges.map((b) => (
              <Tag key={b}>{b}</Tag>
            ))}
          </div>
          <button 
            onClick={() => onDelete(p.id)}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-white/80 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.brand} • {p.category}</p>
            </div>
            <Rating value={p.rating} />
          </div>
          <p className="text-xs font-medium text-gray-500 leading-relaxed line-clamp-2">{p.whyBetter}</p>
          
          {/* Price and CO2 Impact */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div>
              {applyCoins && discountAmount > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-600 tracking-tight">₹{finalPrice}</span>
                  <span className="text-sm font-bold text-gray-400 line-through">₹{p.price}</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">
                    -₹{discountAmount}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-black text-emerald-600 tracking-tight">₹{p.price}</span>
              )}
            </div>
            <div className="text-right">
               <span className="text-[9px] font-bold text-gray-400 uppercase block">Impact</span>
               <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
                 <Leaf className="w-3 h-3"/> {p.co2SavedKg}kg CO₂/yr
               </span>
            </div>
          </div>

          {/* EcoCoins Discount Toggle */}
          {userCoins > 0 && maxDiscountAllowed > 0 && (
            <div
              onClick={() => setApplyCoins(!applyCoins)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                applyCoins
                  ? "bg-amber-500/10 border-amber-300 text-amber-900 shadow-xs"
                  : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-amber-50/50"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${applyCoins ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {applyCoins ? <Check size={12} strokeWidth={3} /> : <EcoCoinIcon size={14} />}
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-black truncate">
                    {applyCoins ? `EcoCoins Applied (-₹${discountAmount})` : `Apply EcoCoins (Save ₹${discountAmount})`}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 shrink-0">
                {applyCoins ? "Active" : "Use"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => onAdd(p)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl h-11 text-xs shadow-none transition-all active:scale-95">
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Save
          </Button>
          <button
            onClick={handleBuyWithDiscount}
            disabled={purchasing}
            className={`h-11 inline-flex items-center justify-center gap-1.5 rounded-2xl font-bold text-xs shadow-sm transition-all active:scale-95 ${
              applyCoins
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {purchasing ? (
              "Redeeming..."
            ) : applyCoins ? (
              <>
                <EcoCoinIcon size={16} /> Buy for ₹{finalPrice}
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" /> Buy Item
              </>
            )}
          </button>
        </div>

        <div className="flex justify-center">
          <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest flex items-center gap-1 bg-emerald-50/60 px-3 py-0.5 rounded-full">
            <Recycle className="w-3 h-3"/> AQI Guard: {p.aqiImpact}
          </span>
        </div>
      </div>
    </Card>
  );
};

const EcoProducts = () => {
  const { user } = useContext(AuthContext);
  const [userCoins, setUserCoins] = useState(user?.ecoCoins || 0);

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("eco_products_v12");
    return saved ? JSON.parse(saved) : PRODUCTS;
  });

  // Fetch updated coin balance on mount
  const refreshCoins = async () => {
    if (!user) return;
    try {
      const data = await ecoCoinService.getBalance();
      if (data?.success) {
        setUserCoins(data.balance);
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshCoins();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("eco_products_v12", JSON.stringify(products));
  }, [products]);

  const handleDeleteProduct = (id) => {
    if (confirm("Remove this eco-alternative from the catalog?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("impact");
  const [wishlist, setWishlist] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    category: "Home Energy",
    price: "",
    co2SavedKg: "",
    image: "",
    whyBetter: "",
    link: ""
  });

  const handleRedeemDiscount = async (amount, product) => {
    if (!user) {
      toast.info("Please sign in to redeem your EcoCoins discount!");
      throw new Error("Authentication required");
    }
    const res = await ecoCoinService.spendCoins(amount, product.id, product.name, product.price);
    if (res.success) {
      setUserCoins(res.balance);
    }
    return res;
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    const p = {
      ...newProduct,
      id: "p" + (products.length + 1) + Date.now(),
      rating: 4.0,
      aqiImpact: "Low",
      badges: ["Community Pick"],
      co2SavedKg: Number(newProduct.co2SavedKg) || 0,
      price: Number(newProduct.price)
    };
    setProducts([p, ...products]);
    setIsAddOpen(false);
    setNewProduct({
      name: "",
      brand: "",
      category: "Home Energy",
      price: "",
      co2SavedKg: "",
      image: "",
      whyBetter: "",
      link: ""
    });
  };

  const list = useMemo(() => {
    let items = products.filter(
      (x) => (cat === "All" || x.category === cat) && x.name.toLowerCase().includes(query.toLowerCase())
    );

    if (sort === "impact") items = items.sort((a, b) => b.co2SavedKg - a.co2SavedKg);
    if (sort === "price") items = items.sort((a, b) => a.price - b.price);
    if (sort === "rating") items = items.sort((a, b) => b.rating - a.rating);

    return items;
  }, [query, cat, sort, products]);

  const addWishlist = (p) => {
    if (!wishlist.find((w) => w.id === p.id)) {
      setWishlist([...wishlist, p]);
      toast.success(`Saved "${p.name}" to favorites!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f9f6] pb-24 font-sans">
      <Navbar />

      <section className="pt-32 pb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Premium Eco Marketplace</span>
          </div>

          <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-black text-gray-900 tracking-tight leading-tight">
            Sustainable <span className="text-emerald-600">Living</span> & Rewards.
          </h1>
          <p className="mt-4 text-gray-500 text-base md:text-lg font-medium max-w-2xl mx-auto">
            Discover vetted products that reduce carbon emissions. Redeem your hard-earned <strong className="text-amber-600">EcoCoins</strong> for instant price discounts!
          </p>

          {/* 🪙 User EcoCoins Balance Banner in Store */}
          <div className="mt-8 max-w-xl mx-auto p-4 rounded-3xl bg-gradient-to-r from-[#0c2e22] via-[#103d2d] to-[#082017] text-white shadow-lg border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center shrink-0 shadow-md border border-emerald-400/30 p-1">
                <EcoCoinIcon size={36} animated />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                  Your Redeemable EcoCoins
                </span>
                <span className="text-2xl font-black text-white">
                  {userCoins} <span className="text-xs font-bold text-emerald-200">Coins (≈ ₹{userCoins}.00 Off)</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold block">
                Up to 30% Off
              </span>
            </div>
          </div>

        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-6">
        {/* FILTERS & SEARCH */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-6 shadow-sm mb-12">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search eco-friendly products..." 
                className="pl-14 pr-6 h-14 rounded-2xl bg-gray-50/50 border-gray-100 text-base font-medium focus:bg-white focus:border-emerald-400 transition-all shadow-inner"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <select 
                  value={cat} 
                  onChange={(e) => setCat(e.target.value)} 
                  className="h-14 px-5 rounded-2xl bg-white border border-gray-100 text-gray-700 font-bold text-xs shadow-sm hover:border-emerald-200 outline-none transition-all cursor-pointer"
                >
                  <option>All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>

                <select 
                  value={sort} 
                  onChange={(e) => setSort(e.target.value)} 
                  className="h-14 px-5 rounded-2xl bg-white border border-gray-100 text-gray-700 font-bold text-xs shadow-sm hover:border-emerald-200 outline-none transition-all cursor-pointer"
                >
                  <option value="impact">Sort: CO₂ Impact</option>
                  <option value="price">Sort: Price</option>
                  <option value="rating">Sort: User Rating</option>
                </select>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 px-6 rounded-2xl shadow-sm text-xs">
                      <Plus className="w-4 h-4 mr-1.5"/> Suggest Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-none rounded-3xl p-8 max-w-2xl shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black text-gray-900">Add Eco Alternative</DialogTitle>
                      <DialogDescription className="text-gray-500 font-medium text-sm">Suggest a sustainable green alternative to the community.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-bold text-gray-700 text-xs">Product Name</Label>
                          <Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-gray-100 text-xs"/>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-bold text-gray-700 text-xs">Brand / Maker</Label>
                          <Input value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-gray-100 text-xs"/>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-bold text-gray-700 text-xs">Price (₹)</Label>
                          <Input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-gray-100 text-xs"/>
                        </div>
                        <div className="space-y-1.5">
                           <Label className="font-bold text-gray-700 text-xs">Category</Label>
                           <select 
                              value={newProduct.category} 
                              onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                              className="w-full h-12 rounded-xl bg-gray-50 border-gray-100 px-4 text-xs font-bold text-gray-700 outline-none"
                            >
                             {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                      </div>
                       <div className="space-y-1.5">
                          <Label className="font-bold text-gray-700 text-xs">Product Image (URL)</Label>
                          <Input value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-gray-100 text-xs" placeholder="https://..."/>
                        </div>
                         <div className="space-y-1.5">
                          <Label className="font-bold text-gray-700 text-xs">Marketplace Link</Label>
                          <Input value={newProduct.link} onChange={e => setNewProduct({...newProduct, link: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-gray-100 text-xs" placeholder="https://amazon.in/..."/>
                        </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddProduct} className="h-12 w-full bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-sm">Catalog Product</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{k:"Avg. CO₂ saved/yr",v:"+32 kg"},{k:"Plastic avoided",v:"~180 bags"},{k:"Exposure drop",v:"-15% AQI"},{k:"Discount Power",v:"1 Coin = ₹1"}].map(x=> (
              <div key={x.k} className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100/50">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-0.5">{x.k}</p>
                <p className="text-lg font-black text-gray-900">{x.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((p) => (
            <ProductCard 
              key={p.id} 
              p={p} 
              onAdd={addWishlist} 
              onDelete={handleDeleteProduct}
              userCoins={userCoins}
              onRedeemDiscount={handleRedeemDiscount}
            />
          ))}
        </div>

        {/* WISHLIST */}
        {wishlist.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Heart className="w-5 h-5 text-emerald-500 fill-emerald-500" />
               </div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tight">Saved Favorites</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.map((w) => (
                <Card key={w.id} className="bg-white border border-gray-100 p-4 flex items-center gap-4 rounded-2xl shadow-sm">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 group shrink-0">
                    <img src={w.image} alt={w.name} className="w-full h-full object-cover transition-transform group-hover:scale-110"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{w.name}</p>
                    <p className="text-xs font-black text-emerald-600 mt-0.5">₹{w.price} • {w.co2SavedKg}kg Saved</p>
                  </div>
                  <a href={w.link} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all shrink-0">
                    <ExternalLink className="w-4 h-4"/>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
      
      <div className="mt-24">
        <Footer />
      </div>
    </div>
  );
};

export default EcoProducts;