import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Lock, Mail, Upload, User, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "@/components/context/context";
import { serverUrl } from "@/main";

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", profilePhoto: null });
  const [confirm, setConfirm] = useState("");
  const [preview, setPreview] = useState("");
  const [success, setSuccess] = useState(false);
  const { setUser } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePhoto") {
      setForm({ ...form, profilePhoto: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else if (name === "confirm") {
      setConfirm(value);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !confirm) return toast.error("All fields are required");
    if (form.name.length < 3) return toast.error("Name must be at least 3 characters");
    if (!emailRegex.test(form.email)) return toast.error("Please enter a valid email address");
    if (!passwordRegex.test(form.password)) return toast.error("Password must be 8+ chars with uppercase, lowercase & number");
    if (form.password !== confirm) return toast.error("Passwords do not match");
    try {
      setIsLoading(true);
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("password", form.password);
      if (form.profilePhoto) fd.append("profilePhoto", form.profilePhoto);
      const res = await axios.post(`${serverUrl}/api/v1/register`, fd, { withCredentials: true });
      toast.success(res.data.message);
      setSuccess(true);
      setUser(res.data.user);
      setTimeout(() => { navigate("/login"); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "pl-10 h-11 bg-gray-50 border-gray-200 text-gray-800 rounded-lg";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f7f9f7]">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Leaf color="white" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Start your journey to a greener lifestyle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <label className="cursor-pointer">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${preview ? 'border-emerald-300' : 'border-dashed border-gray-300 bg-gray-50'} overflow-hidden`}>
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" />
                ) : (
                  <Upload size={22} className="text-gray-300" />
                )}
              </div>
              <span className="block text-center text-xs text-gray-400 mt-1.5">Upload photo</span>
              <input type="file" name="profilePhoto" className="hidden" onChange={handleChange} />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input type="password" name="confirm" placeholder="••••••••" value={confirm} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={isLoading || success}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-sm disabled:opacity-60 mt-2">
            {isLoading && !success && "Creating account..."}
            {success && "✓ Account created!"}
            {!isLoading && !success && (<><span>Create Account</span><ArrowRight size={16} /></>)}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
