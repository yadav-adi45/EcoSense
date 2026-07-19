import React, { useContext, useState } from 'react'
import { Leaf, Lock, Mail, ArrowRight, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '@/components/context/context';
import { serverUrl } from '@/main';
import Footer from '@/pages/Footer';

const Login = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const { setUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await axios.post(`${serverUrl}/api/v1/login`, loginData, { withCredentials: true });
      toast.success(res.data.message);
      setUser(res.data.user);
      setSuccess(true);
      setTimeout(() => { navigate("/") }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f0faf5] relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/50 blur-[150px] rounded-full -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 blur-[120px] rounded-full -z-10"></div>

        <div className="w-full max-w-xl bg-white border-none rounded-[3.5rem] shadow-2xl shadow-emerald-900/10 p-12 md:p-16 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-emerald-500 rounded-b-full"></div>
            
            {/* Header */}
            <div className="text-center mb-12">
                <div className="mx-auto mb-8 w-16 h-16 rounded-[1.8rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-100 group">
                    <Leaf color="white" size={32} className="group-hover:rotate-12 transition-transform" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full mb-4">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Secure Access Point</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-4">Welcome <span className="text-emerald-500">Back</span></h1>
                <p className="text-gray-400 font-medium text-lg">Continue your journey towards a greener world.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email Field */}
                <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Mail className="w-3 h-3 text-emerald-500" /> EMAIL IDENTITY
                    </label>
                    <div className="relative">
                        <Input 
                            name="email" 
                            placeholder="warrior@ecosense.ai" 
                            value={loginData.email} 
                            onChange={handleChange}
                            className="h-16 bg-gray-50 border-gray-100 text-lg font-bold rounded-2xl focus:bg-white focus:border-emerald-400 transition-all shadow-inner px-6" 
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <Lock className="w-3 h-3 text-emerald-500" /> SECURE CODE
                        </label>
                        <Link to="#" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Recover Key</Link>
                    </div>
                    <div className="relative">
                        <Input 
                            type="password" 
                            name="password" 
                            placeholder="••••••••" 
                            value={loginData.password} 
                            onChange={handleChange}
                            className="h-16 bg-gray-50 border-gray-100 text-lg font-bold rounded-2xl focus:bg-white focus:border-emerald-400 transition-all shadow-inner px-6" 
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={isLoading || success}
                        className="w-full h-20 flex items-center justify-center gap-4 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl uppercase tracking-widest transition-all shadow-2xl shadow-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 group">
                        {isLoading && !success && (
                            <><Loader2 className="w-6 h-6 animate-spin" /> VERIFYING...</>
                        )}
                        {success && "✓ IDENTITY CONFIRMED"}
                        {!isLoading && !success && (
                            <><ShieldCheck className="w-8 h-8 group-hover:scale-110 transition-transform" /> LOGIN PORTAL</>
                        )}
                    </button>
                    
                    <div className="mt-8 pt-8 border-t border-gray-50 text-center">
                        <p className="text-gray-400 font-bold text-sm">
                            NEW GUARDIAN?{" "}
                            <Link to="/register" className="text-emerald-600 font-black hover:underline uppercase tracking-widest">CREATE ACCOUNT</Link>
                        </p>
                    </div>
                </div>
            </form>
        </div>
        
        <div className="mt-20">
            <Footer />
        </div>
    </div>
  );
};

export default Login;