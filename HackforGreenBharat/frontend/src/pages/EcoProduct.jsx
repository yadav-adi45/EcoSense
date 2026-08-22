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
    image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?q=80&w=1200&auto=format&fit=crop",
    badges: ["Biodegradable", "Zero-Waste"],
    whyBetter:
      "Compostable handle replaces plastic waste that lingers in landfills.",
  },
  {
    id: "p4",
    name: "Smart Power Strip",
    brand: "PowerSaver",
    category: "Electronics",
    aqiImpact: "Moderate",
    co2SavedKg: 35,
    rating: 4.7,
    price: 1299,
    link: "https://www.amazon.in/s?k=smart+power+strip",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop",
    badges: ["Phantom-Load Killer", "App Control"],
    whyBetter:
      "Cuts standby power to devices automatically, reducing hidden energy usage.",
  },
  {
    id: "p5",
    name: "Stainless Steel Bottle",
    brand: "AquaPure",
    category: "Travel",
    aqiImpact: "Low",
    co2SavedKg: 8,
    rating: 4.8,
    price: 599,
    link: "https://www.amazon.in/s?k=stainless+steel+water+bottle",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1200&auto=format&fit=crop",
    badges: ["BPA-Free", "Insulated"],
    whyBetter:
      "Keeps drinks cold/hot for hours, replacing hundreds of single-use bottles.",
  },
  {
    id: "p6",
    name: "Solar Power Bank 10,000mAh",
    brand: "SunVolt",
    category: "Electronics",
    aqiImpact: "Moderate",
    co2SavedKg: 12,
    rating: 4.3,
    price: 1899,
    link: "https://www.amazon.in/s?k=solar+power+bank",
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop",
    badges: ["Solar Charging", "Dual Output"],
    whyBetter:
      "Harnesses sunlight for mobile charging during outdoor travel or emergencies.",
  },
];

const Rating = ({ value }) => (
  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full text-amber-700 font-extrabold text-[11px]">
    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
    <span>{value}</span>
  </div>
);

const Tag = ({ children }) => (
  <span className="bg-emerald-50 text-[#059669] border border-emerald-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
    {children}
  </span>
);

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
    <Card className="bg-white border border-emerald-100/80 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 relative group rounded-3xl flex flex-col justify-between">
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
              <h3 className="text-lg font-extrabold text-gray-900">{p.name}</h3>
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
                  <span className="text-xl font-black text-emerald-600">₹{finalPrice}</span>
                  <span className="text-xs text-gray-400 line-through font-semibold">₹{p.price}</span>
                </div>
              ) : (
                <span className="text-xl font-black text-gray-900">₹{p.price}</span>
              )}
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <Leaf className="w-3 h-3"/> {p.co2SavedKg}kg CO₂/yr
            </span>
          </div>

          {/* EcoCoins Discount Toggle */}
          {userCoins > 0 && maxDiscountAllowed > 0 && (
            <div
              onClick={() => setApplyCoins(!applyCoins)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                applyCoins
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs"
                  : "bg-gray-50/70 border-gray-100 text-gray-600 hover:bg-emerald-50/50"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${applyCoins ? "bg-[#10b981] text-white" : "bg-gray-200 text-gray-500"}`}>
                  {applyCoins ? <Check size={12} strokeWidth={3} /> : <EcoCoinIcon size={14} />}
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-black truncate">
                    {applyCoins ? `EcoCoins Applied (-₹${discountAmount})` : `Apply EcoCoins (Save ₹${discountAmount})`}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-[#10b981] shrink-0">
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
            className={`h-11 inline-flex items-center justify-center gap-1.5 rounded-2xl font-black text-xs shadow-sm transition-all active:scale-95 ${
              applyCoins
                ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white"
                : "bg-[#10b981] hover:bg-emerald-600 text-white"
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
          <span className="text-[9px] font-extrabold text-[#10b981] uppercase tracking-widest flex items-center gap-1 bg-emerald-50/70 border border-emerald-100 px-3 py-0.5 rounded-full">
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

  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("impact");
  const [wishlist, setWishlist] = useState([]);

  // Add Product Modal
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
      return { success: false };
    }
    const res = await ecoCoinService.spendCoins(amount, product.id, product.name, product.price);
    if (res?.success) {
      setUserCoins(res.balance);
    }
    return res;
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success("Product removed from catalog");
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error("Please fill in at least name and price");
      return;
    }
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
    <div className="min-h-screen bg-[#f0faf5] pb-24 font-sans text-gray-800">
      <Navbar />

      <section className="pt-32 pb-8 text-center relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-black text-[#059669] uppercase tracking-wider">Premium Eco Marketplace</span>
          </div>

          <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-black text-gray-900 tracking-tight leading-tight">
            Sustainable <span className="text-[#10b981]">Living</span> & Rewards.
          </h1>
          <p className="mt-4 text-[#6b7280] text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Discover vetted products that reduce carbon emissions. Redeem your hard-earned <strong className="text-amber-600 font-bold">EcoCoins</strong> for instant price discounts!
          </p>

          {/* 🪙 User EcoCoins Balance Banner (Unified Community Theme) */}
          <div className="mt-8 max-w-xl mx-auto p-4 rounded-3xl bg-white/90 backdrop-blur-md text-gray-900 shadow-xs border border-emerald-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 shadow-xs border border-emerald-100 p-1">
                <EcoCoinIcon size={38} animated />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981] block">
                  Your Redeemable EcoCoins
                </span>
                <span className="text-2xl font-black text-gray-900">
                  {userCoins} <span className="text-xs font-bold text-[#059669]">Coins (≈ ₹{userCoins}.00 Off)</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#059669] text-xs font-extrabold block">
                Up to 30% Off
              </span>
            </div>
          </div>

        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-6">
        {/* FILTERS & SEARCH */}
        <div className="bg-white/80 backdrop-blur-xl border border-emerald-500/10 rounded-3xl p-6 shadow-xs mb-12">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search eco-friendly products..." 
                className="pl-14 pr-6 h-14 rounded-2xl bg-gray-50/50 border-gray-100 text-base font-medium focus:bg-white focus:border-[#10b981] transition-all shadow-inner"
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
                    <Button className="bg-[#10b981] hover:bg-emerald-600 text-white font-black h-14 px-6 rounded-2xl shadow-sm text-xs transition-all active:scale-95">
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
                      <Button onClick={handleAddProduct} className="h-12 w-full bg-[#10b981] hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-sm">Catalog Product</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{k:"Avg. CO₂ saved/yr",v:"+32 kg"},{k:"Plastic avoided",v:"~180 bags"},{k:"Exposure drop",v:"-15% AQI"},{k:"Discount Power",v:"1 Coin = ₹1"}].map(x=> (
              <div key={x.k} className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-100/80">
                <p className="text-[9px] font-black text-[#059669] uppercase tracking-widest mb-0.5">{x.k}</p>
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
                  <Heart className="w-5 h-5 text-[#10b981] fill-[#10b981]" />
               </div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tight">Saved Favorites</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((p) => (
                <Card key={p.id} className="p-4 bg-white border border-emerald-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-emerald-600 font-extrabold">₹{p.price}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setWishlist(wishlist.filter(w => w.id !== p.id))}
                    className="text-gray-400 hover:text-red-500 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default EcoProducts;