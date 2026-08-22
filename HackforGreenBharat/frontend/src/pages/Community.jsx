import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../components/context/context";
import { serverUrl } from "../config";
import { getAuthHeaders } from "../utils/auth";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import {
  Heart, MessageCircle, Trash2, Send, Plus, X,
  Car, Lightbulb, ChevronDown, ChevronUp, MapPin, Calendar, Users, Globe, Sparkles,
  Camera, Upload, Image as ImageIcon, AlertTriangle, Shield, Eye, Coins, Bot, MessageSquare
} from "lucide-react";
import Footer from "./Footer";
import EcoCoinIcon from "../components/ui/EcoCoinIcon";
import AIWritingAssistant from "../components/ui/AIWritingAssistant";
import ChatInterface from "../components/ChatInterface";

const API = `${serverUrl}/api/v11`;
const authHeaders = () => getAuthHeaders();
const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
const avatarLetter = (name) => (name ? name.charAt(0).toUpperCase() : "?");

const ISSUE_TYPES = [
  { value: "pothole", label: "🕳️ Pothole", color: "#f59e0b" },
  { value: "garbage", label: "🗑️ Garbage Dump", color: "#ef4444" },
  { value: "waterlog", label: "🌊 Waterlogging", color: "#3b82f6" },
  { value: "pollution", label: "🏭 Air/Water Pollution", color: "#8b5cf6" },
  { value: "deforestation", label: "🪓 Tree Cutting", color: "#059669" },
  { value: "other", label: "📋 Other Issue", color: "#6b7280" },
];

const getIssueMeta = (type) => ISSUE_TYPES.find(i => i.value === type) || ISSUE_TYPES[5];

const Avatar = ({ src, name, size = 40 }) =>
  src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4, color: "#fff", flexShrink: 0, border: "2px solid white" }}>
      {avatarLetter(name)}
    </div>
  );

const RideBadge = () => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", color:"#3b82f6", padding:"4px 12px", borderRadius:12, fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>
    <Car size={12} /> Ride Share
  </span>
);

const ProofBadge = ({ issueType }) => {
  const meta = getIssueMeta(issueType);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:`${meta.color}15`, border:`1px solid ${meta.color}30`, color:meta.color, padding:"4px 12px", borderRadius:12, fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>
      <AlertTriangle size={12} /> {meta.label}
    </span>
  );
};

// 🪙 Rewards Visual Notification Chip
const CoinRewardBadge = ({ amount, reason }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.3)", color:"#059669", padding:"4px 12px", borderRadius:12, fontSize:11, fontWeight:800, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.04em" }}>
    <EcoCoinIcon size={14} animated /> +{amount} EcoCoins {reason ? `• ${reason}` : ""}
  </span>
);

// ─── Modal ───────────────────────────────────────────────────────────────────

const CreatePostModal = ({ user, setUser, onCreated, onClose }) => {
  const [text, setText] = useState("");
  const [postType, setPostType] = useState("thought");
  const [loading, setLoading] = useState(false);
  const textRef = useRef(null);

  // Rideshare state
  const [rideFrom, setRideFrom] = useState("");
  const [rideTo, setRideTo] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [seats, setSeats] = useState(2);

  // Proof state
  const [issueType, setIssueType] = useState("pothole");
  const [proofLocation, setProofLocation] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const compressImage = (base64Str, callback) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", 0.75);
      callback(compressed);
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      return toast.error("Image too large (Max 8MB)");
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      compressImage(reader.result, (compressed) => {
        setProofImage(compressed);
        setProofPreview(compressed);
      });
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    compressImage(dataUrl, (compressed) => {
      setProofImage(compressed);
      setProofPreview(compressed);
      stopCamera();
    });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const removeImage = () => {
    setProofImage(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!text.trim()) return toast.error("Please write something first!");
    if (postType === "proof" && !proofImage) return toast.error("Please upload or capture a proof image!");
    setLoading(true);
    
    const payload = { 
      text: postType === "proof" && proofLocation ? `[${issueType.toUpperCase()} @ ${proofLocation}] ${text}` : text, 
      postType,
      image: proofImage || "",
      ...(postType === "rideshare" && { rideDetails: { from: rideFrom, to: rideTo, date: rideDate, seats } }),
      ...(postType === "proof" && { 
        proofDetails: { issueType, location: proofLocation } 
      })
    };

    try {
      const res = await axios.post(`${API}/post`, payload, {
        headers: authHeaders(),
        withCredentials: true,
      });

      if (res.data?.success && res.data?.post) {
        onCreated(res.data.post);
        const earned = res.data.earnedCoins || 0;
        if (earned > 0) {
          toast.success(`🎉 +${earned} EcoCoins earned for your ${postType === "proof" ? "issue report" : "rideshare"}! 🪙`);
          if (setUser) {
            setUser((prev) => prev ? { ...prev, ecoCoins: (prev.ecoCoins || 0) + earned } : prev);
          }
        } else {
          toast.success("Post published to community! 🌿");
        }
        onClose();
      } else {
        throw new Error(res.data?.message || "Failed to create post");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to post";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay}>
      <div style={{...S.modalBox, maxWidth: postType === "proof" ? 640 : 580 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ margin:0, color:"#111827", fontSize:24, fontWeight:900 }}>Create Post</h2>
          <button onClick={() => { stopCamera(); onClose(); }} style={S.iconBtn}><X size={20} /></button>
        </div>

        {/* Post Type Selector */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap: "wrap" }}>
          {[
            { val:"thought", label:"💬 Thought" }, 
            { val:"rideshare", label:"🚗 Ride Share (+10 Coins)" }, 
            { val:"proof", label:"📸 Report Proof (+15 Coins)" }
          ].map(({ val, label }) => (
            <button key={val} onClick={() => { setPostType(val); if (val !== "proof") stopCamera(); }} style={{ ...S.typeBtn, background: postType===val ? (val==="proof" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.1)") : "#f9fafb", border: postType===val ? (val==="proof" ? "2px solid #ef4444" : "2px solid #10b981") : "2px solid transparent", color: postType===val ? (val==="proof" ? "#dc2626" : "#059669") : "#9ca3af" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16 }}>
          <Avatar src={user?.profile?.profilePhoto} name={user?.name} size={44} />
          <div>
            <span style={{ color:"#111827", fontWeight:700, fontSize:15, display:"block" }}>{user?.name}</span>
            <span style={{ color:"#9ca3af", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>
              {postType === "proof" ? "Reporting an Issue" : "Sharing with Community"}
            </span>
          </div>
        </div>

        {/* 🤖 AI Writing Assistant Bar */}
        <AIWritingAssistant
          text={text}
          onEnhance={(enhanced) => setText(enhanced)}
          context={postType}
        />
        
        <textarea ref={textRef} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={
            postType==="rideshare" ? "Where are you heading? Mention routes, timings or preferences…" : 
            postType==="proof" ? "Describe the environmental issue found (e.g. huge pothole on main road, overflowing garbage bin)…" :
            "Share your green thoughts, daily habits or sustainable tips…"
          } maxLength={1000} style={S.textArea} />
        <div style={{ textAlign:"right", fontSize:11, fontWeight:700, color:"#d1d5db", marginBottom:12, marginTop:4 }}>{text.length}/1000</div>
        
        {/* Ride Share Fields */}
        {postType === "rideshare" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {[{ icon:<MapPin size={14} color="#10b981" />, ph:"Starting Point", val:rideFrom, set:setRideFrom }, { icon:<MapPin size={14} color="#14b8a6" />, ph:"Destination", val:rideTo, set:setRideTo }].map(({ icon, ph, val, set }, i) => (
              <div key={i} style={S.fieldWrap}>{icon}<input placeholder={ph} value={val} onChange={(e) => set(e.target.value)} style={S.fieldInput} /></div>
            ))}
            <div style={S.fieldWrap}><Calendar size={14} color="#10b981" /><input type="date" value={rideDate} onChange={(e) => setRideDate(e.target.value)} style={S.fieldInput} /></div>
            <div style={S.fieldWrap}><Users size={14} color="#14b8a6" /><input type="number" min={1} max={10} placeholder="Available Seats" value={seats} onChange={(e) => setSeats(e.target.value)} style={S.fieldInput} /></div>
          </div>
        )}

        {/* Proof Upload Fields */}
        {postType === "proof" && (
          <div style={{ marginBottom:20 }}>
            {/* Issue Type + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div style={S.fieldWrap}>
                <AlertTriangle size={14} color="#ef4444" />
                <select value={issueType} onChange={(e) => setIssueType(e.target.value)} style={{ ...S.fieldInput, cursor:"pointer", appearance:"none" }}>
                  {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={S.fieldWrap}>
                <MapPin size={14} color="#ef4444" />
                <input placeholder="Location (e.g. MG Road, Sector 5)" value={proofLocation} onChange={(e) => setProofLocation(e.target.value)} style={S.fieldInput} />
              </div>
            </div>

            {/* Upload Actions */}
            {!proofPreview && !showCamera && (
              <div style={{ display:"flex", gap:12, marginBottom:16 }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display:"none" }} id="proof-file-input" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:"28px 16px", background:"#fef2f2", border:"2px dashed #fca5a5", borderRadius:20, cursor:"pointer", transition:"all 0.2s", color:"#dc2626" }}
                >
                  <Upload size={28} />
                  <span style={{ fontSize:13, fontWeight:800 }}>Upload Photo</span>
                  <span style={{ fontSize:10, fontWeight:600, color:"#f87171" }}>Max 5MB • JPG, PNG</span>
                </button>
                <button 
                  onClick={startCamera}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:"28px 16px", background:"#eff6ff", border:"2px dashed #93c5fd", borderRadius:20, cursor:"pointer", transition:"all 0.2s", color:"#2563eb" }}
                >
                  <Camera size={28} />
                  <span style={{ fontSize:13, fontWeight:800 }}>Open Camera</span>
                  <span style={{ fontSize:10, fontWeight:600, color:"#60a5fa" }}>Take a live photo</span>
                </button>
              </div>
            )}

            {/* Camera View */}
            {showCamera && (
              <div style={{ marginBottom:16, borderRadius:20, overflow:"hidden", border:"2px solid #93c5fd", position:"relative" }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width:"100%", display:"block", borderRadius:18 }} />
                <div style={{ position:"absolute", bottom:16, left:0, right:0, display:"flex", justifyContent:"center", gap:12, zIndex:10 }}>
                  <button onClick={capturePhoto} style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:24, padding:"10px 24px", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 12px rgba(37,99,235,0.4)" }}>
                    <Camera size={16} /> Snap Photo
                  </button>
                  <button onClick={stopCamera} style={{ background:"rgba(0,0,0,0.6)", color:"#fff", border:"none", borderRadius:24, padding:"10px 16px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    Cancel
                  </button>
                </div>
                <canvas ref={canvasRef} style={{ display:"none" }} />
              </div>
            )}

            {/* Preview View */}
            {proofPreview && (
              <div style={{ position:"relative", marginBottom:16, borderRadius:20, overflow:"hidden", border:"2px solid #e2e8f0" }}>
                <img src={proofPreview} alt="Preview" style={{ width:"100%", maxHeight:260, objectFit:"cover", display:"block" }} />
                <button onClick={removeImage} style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.6)", color:"#fff", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <X size={16} />
                </button>
                <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(16,185,129,0.9)", backdropFilter:"blur(4px)", color:"#fff", fontSize:11, fontWeight:800, padding:"4px 10px", borderRadius:10 }}>
                  ✓ Proof Attached (+15 EcoCoins on submit)
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{ ...S.primaryBtn, width:"100%", height:52, borderRadius:18, justifyContent:"center" }}>
          {loading ? "Publishing..." : postType === "proof" ? "Submit Issue Proof (+15 Coins) 🚀" : postType === "rideshare" ? "Post Ride Offer (+10 Coins) 🚗" : "Post to Community 🌱"}
        </button>
      </div>
    </div>
  );
};

// ─── CommentSection ──────────────────────────────────────────────────────────

const CommentSection = ({ postId, initialComments, user }) => {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/comment/${postId}`,
        { text },
        { headers: authHeaders(), withCredentials: true }
      );
      setComments(res.data.comments);
      setText("");
    } catch {
      toast.error("Login to comment");
    } finally {
      setLoading(false);
    }
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
        <div style={{ marginTop:12 }}>
          <div className="mb-2">
            <AIWritingAssistant
              text={text}
              onEnhance={(enhanced) => setText(enhanced)}
              compact={true}
              context="comment"
            />
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <Avatar src={user?.profile?.profilePhoto} name={user?.name} size={32} />
            <div style={{ flex:1, position:"relative" }}>
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key==="Enter" && submit()}
                  placeholder="Share your thoughts or reply..." style={{ width:"100%", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:24, padding:"10px 48px 10px 20px", color:"#111827", fontSize:14, outline:"none", transition:"border-color 0.2s" }} 
              />
              <button onClick={submit} disabled={loading}
                  style={{ position:"absolute", right:6, top:6, background:"#10b981", border:"none", borderRadius:20, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, shadow:"0 4px 12px rgba(16,185,129,0.2)" }}>
                  <Send size={14} color="#fff" />
              </button>
            </div>
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
  const [showFullImage, setShowFullImage] = useState(false);
  const isOwner = user && post.author?._id === user._id;

  const toggleLike = async () => {
    if (!user) return toast.error("Login to like posts");
    try {
      const res = await axios.put(`${API}/like/${post._id}`, {}, { headers: authHeaders(), withCredentials: true });
      setLiked(res.data.liked);
      setLikeCount(res.data.likes);
      if (res.data.liked) {
        if (res.data.authorRewarded) {
          toast.info("❤️ Post appreciated! Author earned +2 EcoCoins 🪙");
        } else {
          toast.success("Liked post! 💚");
        }
      }
    } catch {
      toast.error("Failed to like");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/post/${post._id}`, { headers: authHeaders(), withCredentials: true });
      onDelete(post._id);
      toast.success("Post removed");
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  const isRideShare = post.postType === "rideshare" || !!post.rideDetails;
  const isProof = post.postType === "proof" || !!post.proofDetails;

  return (
    <div style={S.card}>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
        <Avatar src={post.author?.profile?.profilePhoto} name={post.author?.name} size={48} />
        <div style={{ flex:1 }}>
          <div style={{ color:"#111827", fontWeight:800, fontSize:15 }}>{post.author?.name}</div>
          <div style={{ color:"#9ca3af", fontSize:12, fontWeight:600 }}>{timeAgo(post.createdAt)}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {isProof ? (
            <div style={{ background:"#fef2f2", padding:6, borderRadius:10 }}><AlertTriangle size={18} color="#ef4444" /></div>
          ) : isRideShare ? (
            <div style={{ background:"#eff6ff", padding:6, borderRadius:10 }}><Car size={18} color="#3b82f6" /></div>
          ) : (
            <div style={{ background:"#ecfdf5", padding:6, borderRadius:10 }}><Globe size={18} color="#10b981" /></div>
          )}
          {isOwner && <button onClick={handleDelete} disabled={deleting} style={{ ...S.iconBtn, color:"#ef4444", background:"#fee2e2" }}><Trash2 size={16} /></button>}
        </div>
      </div>
      
      <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:4 }}>
        {isRideShare && <RideBadge />}
        {isProof && <ProofBadge issueType={post.proofDetails?.issueType} />}
        {isProof && <CoinRewardBadge amount={15} reason="Proof Reward" />}
        {isRideShare && <CoinRewardBadge amount={10} reason="Ride Share" />}
      </div>
      
      <p style={{ color:"#374151", fontSize:16, fontWeight:500, lineHeight:1.7, margin:"0 0 16px" }}>{post.text}</p>
      
      {/* Image Display */}
      {post.image && (
        <div style={{ marginBottom:16, position:"relative", borderRadius:20, overflow:"hidden", cursor:"pointer" }} onClick={() => setShowFullImage(true)}>
          <img src={post.image} alt="Proof" style={{ width:"100%", maxHeight:400, objectFit:"cover", display:"block", borderRadius:20, border:"1px solid #f1f5f9" }} />
          <div style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", padding:"6px 12px", borderRadius:12, display:"flex", alignItems:"center", gap:6 }}>
            <Eye size={14} color="white" />
            <span style={{ color:"white", fontSize:11, fontWeight:700 }}>View Full</span>
          </div>
          {post.proofDetails?.location && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent, rgba(0,0,0,0.75))", padding:"24px 16px 12px", display:"flex", alignItems:"center", gap:6 }}>
              <MapPin size={14} color="#fbbf24" />
              <span style={{ color:"white", fontSize:12, fontWeight:700 }}>{post.proofDetails.location}</span>
            </div>
          )}
        </div>
      )}

      {/* Full Image Lightbox */}
      {showFullImage && post.image && (
        <div onClick={() => setShowFullImage(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out", padding:20 }}>
          <img src={post.image} alt="Proof Full" style={{ maxWidth:"90vw", maxHeight:"90vh", objectFit:"contain", borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }} />
          <button onClick={(e) => { e.stopPropagation(); setShowFullImage(false); }} style={{ position:"absolute", top:20, right:20, width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={20} color="white" />
          </button>
        </div>
      )}

      {/* Proof Location + Issue Info */}
      {isProof && post.proofDetails?.location && !post.image && (
        <div style={{ background:"#fef2f2", border:"1px solid #fee2e2", borderRadius:16, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <MapPin size={16} color="#ef4444" />
          <span style={{ color:"#991b1b", fontSize:13, fontWeight:700 }}>{post.proofDetails.location}</span>
        </div>
      )}

      {/* Ride Details */}
      {isRideShare && post.rideDetails?.from && (
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
  const { user, setUser } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showEcoBotWidget, setShowEcoBotWidget] = useState(false);

  const fetchPosts = async (type = "all") => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/posts`, {
        params: { type },
        withCredentials: true,
      });
      setPosts(res.data.posts || []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(filter);
  }, [filter]);

  const handleCreated = (newPost) => setPosts((prev) => [newPost, ...prev]);
  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  return (
    <div style={S.pageWrap}>
      <Navbar />
      <div style={S.pageInner}>
        <div style={S.hero}>
          <div style={S.heroBadge}><Sparkles size={14} style={{ marginRight:6 }} /> EcoSense Community</div>
          <h1 style={S.heroTitle}>Earth's <span style={{ color:"#10b981" }}>Social Network</span></h1>
          <p style={S.heroSub}>Share your sustainable journey, report environmental issues with proof to earn EcoCoins, and find ride partners to slash emissions together.</p>
        </div>

        <div style={S.toolbar}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[
              { val:"all", label:"🌎 Global" }, 
              { val:"thought", label:"💬 Thoughts" }, 
              { val:"proof", label:"📸 Proofs" },
              { val:"rideshare", label:"🚗 Rides" }
            ].map(({ val, label }) => (
              <button key={val} onClick={() => setFilter(val)} style={{ ...S.filterChip, background: filter===val ? "#fff":"transparent", border: filter===val ? (val==="proof" ? "2px solid #ef4444" : "2px solid #10b981") :"2px solid transparent", color: filter===val ? (val==="proof" ? "#dc2626" : "#059669") :"#94a3b8", fontWeight:800, shadow: filter===val ? "0 4px 12px rgba(16,185,129,0.1)":"none" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <button 
              onClick={() => setShowEcoBotWidget((prev) => !prev)} 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs shadow-xs transition-all active:scale-95"
            >
              <Bot size={16} className="text-[#10b981]" />
              <span>{showEcoBotWidget ? "Hide EcoBot" : "Open EcoBot"}</span>
            </button>
            {user && <button onClick={() => setShowModal(true)} style={S.primaryBtn}><Plus size={18} /> New Post</button>}
          </div>
        </div>

        {/* 🌿 Main Community Feed & Side EcoBot Assistant Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Feed Column */}
          <div className={`${showEcoBotWidget ? "lg:col-span-7" : "lg:col-span-12"} transition-all duration-300`}>
            {loading ? (
              <div style={S.centerMsg}>
                  <div style={{ width:48, height:48, borderRadius:"50%", border:"4px solid #f0faf5", borderTopColor:"#10b981", animation:"spin 1s linear infinite" }} />
                  <p style={{ color:"#94a3b8", marginTop:20, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", fontSize:11 }}>Loading Feed</p>
              </div>
            ) : posts.length === 0 ? (
              <div style={S.centerMsg}>
                <div style={{ fontSize:64, marginBottom:20 }}>🌱</div>
                <p style={{ color:"#1f2937", fontSize:20, fontWeight:900 }}>The feed is freshly planted.</p>
                <p style={{ color:"#94a3b8", marginTop:8, fontSize:15, fontWeight:500 }}>Be the first to share an eco-thought or report an issue!</p>
                {user && <button onClick={() => setShowModal(true)} style={{ ...S.primaryBtn, marginTop:24, height:54, borderRadius:16 }}><Plus size={18} /> Create First Post</button>}
              </div>
            ) : (
              <div style={S.feed}>{posts.map((p) => <PostCard key={p._id} post={p} user={user} onDelete={handleDelete} />)}</div>
            )}
          </div>

          {/* 🤖 Side EcoBot Assistant Column */}
          {showEcoBotWidget && (
            <div className="lg:col-span-5 sticky top-28 space-y-4">
              <div className="bg-white rounded-3xl p-1 shadow-md border border-emerald-100/90">
                <ChatInterface embedded={true} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop:80 }}>
        <Footer />
      </div>
      
      {showModal && <CreatePostModal user={user} setUser={setUser} onCreated={handleCreated} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Community;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  pageWrap: { minHeight:"100vh", background:"#f0faf5", fontFamily:"'Inter','Segoe UI',sans-serif", color:"#1f2937" },
  pageInner: { maxWidth:1180, margin:"0 auto", padding:"140px 16px 80px" },
  hero: { textAlign:"center", marginBottom:56, position:"relative" },
  heroBadge: { display:"inline-flex", alignItems:"center", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:20, padding:"6px 16px", fontSize:11, color:"#059669", fontWeight:800, marginBottom:20, textTransform:"uppercase", letterSpacing:"0.05em" },
  heroTitle: { margin:"0 0 16px", fontSize:"clamp(32px,7vw,52px)", fontWeight:900, color:"#111827" },
  heroSub: { margin:0, color:"#6b7280", fontSize:18, fontWeight:500, lineHeight:1.6, maxWidth:580, marginInline:"auto" },
  toolbar: { display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:40, background:"rgba(255,255,255,0.7)", backdropFilter:"blur(10px)", padding:"12px 20px", borderRadius:24, border:"1px solid rgba(16,185,129,0.15)" },
  filterChip: { borderRadius:16, padding:"10px 20px", fontSize:13, cursor:"pointer", transition:"all 0.3s" , display:"flex", alignItems:"center" },
  primaryBtn: { display:"inline-flex", alignItems:"center", gap:8, background:"#10b981", border:"none", borderRadius:14, padding:"0 24px", height:48, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", whiteSpace:"nowrap", transition:"transform 0.2s" },
  feed: { display:"flex", flexDirection:"column", gap:24 },
  card: { background:"#fff", border:"1px solid #f1f5f9", borderRadius:32, padding:"32px", transition:"all 0.3s" },
  actionBtn: { display:"inline-flex", alignItems:"center", gap:8, border:"none", cursor:"pointer", fontSize:14, padding:"10px 18px", borderRadius:16, transition:"all 0.2s" },
  iconBtn: { background:"none", border:"none", cursor:"pointer", color:"#9ca3af", display:"flex", alignItems:"center", padding:8, borderRadius:12, transition:"all 0.2s" },
  overlay: { position:"fixed", inset:0, background:"rgba(5,10,8,0.4)", backdropFilter:"blur(12px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modalBox: { background:"#fff", borderRadius:40, padding:36, width:"100%", maxWidth:600, maxHeight:"90vh", overflowY:"auto", position:"relative" },
  textArea: { width:"100%", minHeight:130, background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:24, padding:"20px", color:"#1e293b", fontSize:16, fontWeight:500, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" },
  typeBtn: { flex:1, borderRadius:16, padding:"12px 14px", fontSize:13, fontWeight:800, cursor:"pointer", transition:"all 0.2s" , border:"2px solid transparent" },
  fieldWrap: { display:"flex", alignItems:"center", gap:10, background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:16, padding:"12px 16px" },
  fieldInput: { background:"none", border:"none", outline:"none", color:"#1e293b", fontSize:14, fontWeight:600, width:"100%" },
  centerMsg: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 20px", textAlign:"center" },
};
