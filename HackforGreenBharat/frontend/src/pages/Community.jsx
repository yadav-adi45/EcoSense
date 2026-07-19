import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../components/context/context";
import { serverUrl } from "../config";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import {
  Heart, MessageCircle, Trash2, Send, Plus, X,
  Car, Lightbulb, ChevronDown, ChevronUp, MapPin, Calendar, Users, Globe, Sparkles
} from "lucide-react";
import Footer from "./Footer";

const API = `${serverUrl}/api/v11`;
const getToken = () => { const u = JSON.parse(localStorage.getItem("user")); return u?.token || u?.accessToken || null; };
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });
const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
const avatarLetter = (name) => (name ? name.charAt(0).toUpperCase() : "?");

const Avatar = ({ src, name, size = 40 }) =>
  src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4, color: "#fff", flexShrink: 0, border: "2px solid white" }}>
      {avatarLetter(name)}
    </div>
  );

const RideBadge = () => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.1)", color:"#3b82f6", padding:"4px 12px", borderRadius:12, fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>
    <Car size={12} /> Ride Share
  </span>
);

// ─── CreatePostModal ─────────────────────────────────────────────────────────

const CreatePostModal = ({ user, onCreated, onClose }) => {
  const [text, setText] = useState("");
  const [postType, setPostType] = useState("thought");
  const [rideFrom, setRideFrom] = useState("");
  const [rideTo, setRideTo] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const textRef = useRef(null);
  useEffect(() => textRef.current?.focus(), []);

  const handleSubmit = async () => {
    if (!text.trim()) return toast.error("Please write something!");
    setLoading(true);
    try {
      const payload = { text, postType, ...(postType === "rideshare" && { rideDetails: { from: rideFrom, to: rideTo, date: rideDate, seats } }) };
      const res = await axios.post(`${API}/post`, payload, { headers: authHeaders() });
      onCreated(res.data.post);
      toast.success("Post shared! 🌿");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally { setLoading(false); }
  };

  return (
    <div style={S.overlay}>
      <div style={S.modalBox}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ margin:0, color:"#111827", fontSize:24, fontWeight:900, trackingTight:"-0.02em" }}>Create Post</h2>
          <button onClick={onClose} style={S.iconBtn}><X size={20} /></button>
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:24 }}>
          {[{ val:"thought", label:"💬 Thought" }, { val:"rideshare", label:"🚗 Ride Share" }].map(({ val, label }) => (
            <button key={val} onClick={() => setPostType(val)} style={{ ...S.typeBtn, background: postType===val ? "rgba(16,185,129,0.1)" : "#f9fafb", border: postType===val ? "2px solid #10b981" : "2px solid transparent", color: postType===val ? "#059669" : "#9ca3af" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:20 }}>
          <Avatar src={user?.profile?.profilePhoto} name={user?.name} size={44} />
          <div>
            <span style={{ color:"#111827", fontWeight:700, fontSize:15, display:"block" }}>{user?.name}</span>
            <span style={{ color:"#9ca3af", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Sharing as Champion</span>
          </div>
        </div>
        <textarea ref={textRef} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={postType==="rideshare" ? "Where are you heading? Mention routes…" : "What's on your eco-mind today?"} maxLength={1000} style={S.textArea} />
        <div style={{ textAlign:"right", fontSize:11, fontWeight:700, color:"#d1d5db", marginBottom:12, marginTop:4 }}>{text.length}/1000</div>
        {postType === "rideshare" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {[{ icon:<MapPin size={14} color="#10b981" />, ph:"Starting Point", val:rideFrom, set:setRideFrom }, { icon:<MapPin size={14} color="#14b8a6" />, ph:"Destination", val:rideTo, set:setRideTo }].map(({ icon, ph, val, set }, i) => (
              <div key={i} style={S.fieldWrap}>{icon}<input placeholder={ph} value={val} onChange={(e) => set(e.target.value)} style={S.fieldInput} /></div>
            ))}
            <div style={S.fieldWrap}><Calendar size={14} color="#10b981" /><input type="date" value={rideDate} onChange={(e) => setRideDate(e.target.value)} style={S.fieldInput} /></div>
            <div style={S.fieldWrap}><Users size={14} color="#14b8a6" /><input type="number" min={1} max={10} placeholder="Available Seats" value={seats} onChange={(e) => setSeats(e.target.value)} style={S.fieldInput} /></div>
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading} style={{ ...S.primaryBtn, width:"100%", height:56, fontSize:16, borderRadius:16, opacity: loading ? 0.7:1, cursor: loading ? "not-allowed":"pointer" }}>
          {loading ? "Processing..." : "Publish Post 🌿"}
        </button>
      </div>
    </div>
  );
};

// ─── CommentSection ──────────────────────────────────────────────────────────

const CommentSection = ({ postId, initialComments, user }) => {
  const [comments, setComments] = useState(initialComments || []);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/comment/${postId}`, { text }, { headers: authHeaders() });
      setComments(res.data.comments);
      setText("");
    } catch { toast.error("Login to comment"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ borderTop:"1px solid #f3f4f6", paddingTop:16, marginTop:16 }}>
      {comments.map((c, i) => (
        <div key={i} style={{ display:"flex", gap:12, marginBottom:14, alignItems:"flex-start" }}>
          <Avatar src={c.author?.profile?.profilePhoto} name={c.author?.name} size={32} />
          <div style={{ background:"#f9fafb", borderRadius:16, padding:"10px 16px", flex:1, border:"1px solid #f3f4f6" }}>
            <span style={{ color:"#059669", fontSize:12, fontWeight:800, display:"block", marginBottom:2 }}>{c.author?.name}</span>
            <span style={{ color:"#4b5563", fontSize:14, fontWeight:500 }}>{c.text}</span>
          </div>
        </div>
      ))}
      {user && (
        <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:12 }}>
          <Avatar src={user?.profile?.profilePhoto} name={user?.name} size={32} />
          <div style={{ flex:1, position:"relative" }}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key==="Enter" && submit()}
                placeholder="Share your thoughts..." style={{ width:"100%", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:24, padding:"10px 48px 10px 20px", color:"#111827", fontSize:14, outline:"none", transition:"border-color 0.2s" }} 
            />
            <button onClick={submit} disabled={loading}
                style={{ position:"absolute", right:6, top:6, background:"#10b981", border:"none", borderRadius:20, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, shadow:"0 4px 12px rgba(16,185,129,0.2)" }}>
                <Send size={14} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PostCard ────────────────────────────────────────────────────────────────

const PostCard = ({ post, user, onDelete }) => {
  const [liked, setLiked] = useState(post.likes?.some((id) => id===user?._id || id?.toString()===user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = user && post.author?._id === user._id;

  const toggleLike = async () => {
    if (!user) return toast.error("Login to like posts");
    try {
      const res = await axios.put(`${API}/like/${post._id}`, {}, { headers: authHeaders() });
      setLiked(res.data.liked); setLikeCount(res.data.likes);
    } catch { toast.error("Failed to like"); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try { await axios.delete(`${API}/post/${post._id}`, { headers: authHeaders() }); onDelete(post._id); toast.success("Post deleted"); }
    catch { toast.error("Failed to delete"); setDeleting(false); }
  };

  return (
    <div style={S.card}>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
        <Avatar src={post.author?.profile?.profilePhoto} name={post.author?.name} size={48} />
        <div style={{ flex:1 }}>
          <div style={{ color:"#111827", fontWeight:800, fontSize:15, trackingTight:"-0.01em" }}>{post.author?.name}</div>
          <div style={{ color:"#9ca3af", fontSize:12, fontWeight:600 }}>{timeAgo(post.createdAt)}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {post.postType==="rideshare" ? <div style={{ background:"#eff6ff", padding:6, borderRadius:10 }}><Car size={18} color="#3b82f6" /></div> : <div style={{ background:"#ecfdf5", padding:6, borderRadius:10 }}><Globe size={18} color="#10b981" /></div>}
          {isOwner && <button onClick={handleDelete} disabled={deleting} style={{ ...S.iconBtn, color:"#ef4444", background:"#fee2e2" }}><Trash2 size={16} /></button>}
        </div>
      </div>
      {post.postType === "rideshare" && <RideBadge />}
      <p style={{ color:"#374151", fontSize:16, fontWeight:500, lineHeight:1.7, margin:"0 0 16px" }}>{post.text}</p>
      {post.postType==="rideshare" && post.rideDetails?.from && (
        <div style={{ background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:20, padding:"16px 20px", marginBottom:16, display:"flex", flexDirection:"column", gap:10 }}>
          {[{ icon:<MapPin size={14} color="#10b981" />, label:"Starting", val:post.rideDetails.from }, { icon:<MapPin size={14} color="#14b8a6" />, label:"Destination", val:post.rideDetails.to }].map(({ icon, label, val }, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>{icon}<span style={{ color:"#1e293b", fontSize:14, fontWeight:600 }}><b style={{ color:"#94a3b8", fontSize:11, textTransform:"uppercase", marginRight:6 }}>{label}:</b> {val}</span></div>
          ))}
          <div style={{ display:"flex", flexWrap:"wrap", gap:14, marginTop:4, pt:10, borderTop:"1px solid #f1f5f9", paddingTop:10 }}>
            {post.rideDetails.date && <div style={{ display:"flex", alignItems:"center", gap:6 }}><Calendar size={14} color="#8b5cf6" /><span style={{ color:"#475569", fontSize:12, fontWeight:700 }}>{post.rideDetails.date}</span></div>}
            {post.rideDetails.seats && <div style={{ display:"flex", alignItems:"center", gap:6 }}><Users size={14} color="#f59e0b" /><span style={{ color:"#475569", fontSize:12, fontWeight:700 }}>{post.rideDetails.seats} Seats Available</span></div>}
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:20, alignItems:"center" }}>
        <button onClick={toggleLike} style={{ ...S.actionBtn, background: liked ? "#fee2e2":"#f9fafb", color: liked ? "#ef4444" : "#64748b" }}>
          <Heart size={18} fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "#64748b"} />
          <span style={{ fontWeight:800 }}>{likeCount}</span>
        </button>
        <button onClick={() => setShowComments((s) => !s)} style={{ ...S.actionBtn, background:"#f9fafb", color:"#64748b" }}>
          <MessageCircle size={18} />
          <span style={{ fontWeight:800 }}>{post.comments?.length || 0}</span>
          {showComments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {showComments && <CommentSection postId={post._id} initialComments={post.comments || []} user={user} />}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const Community = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const fetchPosts = async (type = "all") => {
    setLoading(true);
    try { const res = await axios.get(`${API}/posts`, { params: { type } }); setPosts(res.data.posts || []); }
    catch { toast.error("Failed to load posts"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(filter); }, [filter]);
  const handleCreated = (newPost) => setPosts((prev) => [newPost, ...prev]);
  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  return (
    <div style={S.pageWrap}>
      <Navbar />
      <div style={S.pageInner}>
        <div style={S.hero}>
          <div style={S.heroBadge}><Sparkles size={14} style={{ marginRight:6 }} /> EcoSense Community</div>
          <h1 style={S.heroTitle}>Earth’s <span style={{ color:"#10b981" }}>Social Network</span></h1>
          <p style={S.heroSub}>Share your sustainable journey, swap green tips, and find ride partners to slash emissions together.</p>
        </div>

        <div style={S.toolbar}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[{ val:"all", label:"🌎 Global" }, { val:"thought", label:"💬 Thoughts" }, { val:"rideshare", label:"🚗 Rides" }].map(({ val, label }) => (
              <button key={val} onClick={() => setFilter(val)} style={{ ...S.filterChip, background: filter===val ? "#fff":"transparent", border: filter===val ? "2px solid #10b981":"2px solid transparent", color: filter===val ? "#059669":"#94a3b8", fontWeight:800, shadow: filter===val ? "0 4px 12px rgba(16,185,129,0.1)":"none" }}>
                {label}
              </button>
            ))}
          </div>
          {user && <button onClick={() => setShowModal(true)} style={S.primaryBtn}><Plus size={18} /> New Post</button>}
        </div>

        {loading ? (
          <div style={S.centerMsg}>
              <div style={{ width:48, height:48, borderRadius:"50%", border:"4px solid #f0faf5", borderTopColor:"#10b981", animation:"spin 1s linear infinite" }} />
              <p style={{ color:"#94a3b8", marginTop:20, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", fontSize:11 }}>Loading Feed</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={S.centerMsg}>
            <div style={{ fontSize:64, marginBottom:20 }}>🌱</div>
            <p style={{ color:"#1f2937", fontSize:20, fontWeight:900 }}>The feed is freshly planted.</p>
            <p style={{ color:"#94a3b8", marginTop:8, fontSize:15, fontWeight:500 }}>Be the first to share an eco-thought with the world!</p>
            {user && <button onClick={() => setShowModal(true)} style={{ ...S.primaryBtn, marginTop:24, height:54, borderRadius:16 }}><Plus size={18} /> Create First Post</button>}
          </div>
        ) : (
          <div style={S.feed}>{posts.map((p) => <PostCard key={p._id} post={p} user={user} onDelete={handleDelete} />)}</div>
        )}
      </div>
      
      <div style={{ marginTop:80 }}>
        <Footer />
      </div>
      
      {showModal && <CreatePostModal user={user} onCreated={handleCreated} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Community;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  pageWrap: { minHeight:"100vh", background:"#f0faf5", fontFamily:"'Inter','Segoe UI',sans-serif", color:"#1f2937" },
  pageInner: { maxWidth:720, margin:"0 auto", padding:"140px 16px 80px" },
  hero: { textAlign:"center", marginBottom:56, position:"relative" },
  heroBadge: { display:"inline-flex", alignItems:"center", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:20, padding:"6px 16px", fontSize:11, color:"#059669", fontWeight:800, marginBottom:20, textTransform:"uppercase", letterSpacing:"0.05em" },
  heroTitle: { margin:"0 0 16px", fontSize:"clamp(32px,7vw,52px)", fontWeight:900, color:"#111827", trackingTight:"-0.03em", leadingTight:"1.1" },
  heroSub: { margin:0, color:"#6b7280", fontSize:18, fontWeight:500, lineHeight:1.6, maxWidth:500, marginInline:"auto" },
  toolbar: { display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:40, background:"rgba(255,255,255,0.4)", backdropFilter:"blur(10px)", padding:"12px 20px", borderRadius:24, border:"1px solid rgba(16,185,129,0.1)" },
  filterChip: { borderRadius:16, padding:"10px 20px", fontSize:13, cursor:"pointer", transition:"all 0.3s" , display:"flex", alignItems:"center" },
  primaryBtn: { display:"inline-flex", alignItems:"center", gap:8, background:"#10b981", border:"none", borderRadius:14, padding:"0 24px", height:48, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", whiteSpace:"nowrap", shadow:"0 10px 20px rgba(16,185,129,0.25)", transition:"transform 0.2s" },
  feed: { display:"flex", flexDirection:"column", gap:24 },
  card: { background:"#fff", border:"1px solid #f1f5f9", borderRadius:32, padding:"32px", shadow:"0 10px 30px rgba(0,0,0,0.02)", transition:"all 0.3s" },
  actionBtn: { display:"inline-flex", alignItems:"center", gap:8, border:"none", cursor:"pointer", fontSize:14, padding:"10px 18px", borderRadius:16, transition:"all 0.2s" },
  iconBtn: { background:"none", border:"none", cursor:"pointer", color:"#9ca3af", display:"flex", alignItems:"center", padding:8, borderRadius:12, transition:"all 0.2s" },
  overlay: { position:"fixed", inset:0, background:"rgba(5,10,8,0.4)", backdropFilter:"blur(12px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modalBox: { background:"#fff", borderRadius:40, padding:40, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", shadow:"0 30px 100px rgba(0,0,0,0.2)", position:"relative" },
  textArea: { width:"100%", minHeight:160, background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:24, padding:"20px", color:"#1e293b", fontSize:16, fontWeight:500, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" },
  typeBtn: { flex:1, borderRadius:16, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", transition:"all 0.2s" , border:"2px solid transparent" },
  fieldWrap: { display:"flex", alignItems:"center", gap:10, background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:16, padding:"12px 16px" },
  fieldInput: { background:"none", border:"none", outline:"none", color:"#1e293b", fontSize:14, fontWeight:600, width:"100%" },
  centerMsg: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 20px", textAlign:"center" },
};
