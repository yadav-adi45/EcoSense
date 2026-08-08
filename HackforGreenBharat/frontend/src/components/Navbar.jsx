import React, { useContext } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Database,
  Gamepad2,
  LayoutDashboard,
  Leaf,
  Presentation,
  Trophy,
  User,
  LogOut,
  Factory,
  ChartBar,
  Inspect,
  Store,
  Users,
} from "lucide-react";

import { Button } from "./ui/button";
import { AuthContext } from "./context/context";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "@/main";

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const { user, setUser } = useContext(AuthContext);

  const handleLogout = async () => {
    const res = await axios.get(`${serverUrl}/api/v1/logout`, { withCredentials: true });
    setUser(null);
    toast.success(res.data.message);
  };

  const mainNavLinks = [
    { path: "/bill-scanner", label: "Scanner", icon: LayoutDashboard },
    { path: "/dashboard", label: "Dashboard", icon: Database },
    { path: "/environment-reports", label: "Reports", icon: Inspect },
    { path: "/recommendations", label: "Eco Products", icon: Gamepad2 },
    { path: "/routes", label: "Routes", icon: Presentation },
    { path: "/pollution", label: "Pollution", icon: Factory },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#f0faf5]/95 backdrop-blur-md border-b border-emerald-100/50 shadow-sm transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-emerald-600 font-space-grotesk tracking-tight">
              EcoSense
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {mainNavLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <button
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[15px] font-semibold transition-all duration-300
                    ${isActive(link.path)
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-105"
                      : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-100/60"
                    }`}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative hover:scale-105 transition-transform">
                    <Avatar className="w-10 h-10 border-2 border-emerald-100 shadow-sm">
                      {user?.profile?.profilePhoto ? (
                        <AvatarImage src={user.profile.profilePhoto} />
                      ) : (
                        <AvatarFallback className="bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center">
                          {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5 text-white" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-[240px] rounded-2xl border border-gray-100 bg-white shadow-lg p-0 overflow-hidden"
                >
                  {/* Profile Header */}
                  <div className="px-4 pt-4 pb-3 bg-gradient-to-br from-emerald-50 to-teal-50">
                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(((user?.score || 0) / 900) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-emerald-600">{user?.score || 0}/900</span>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Menu Items */}
                  <div className="py-1">
                    {[
                      { to: "/profile", icon: User, label: "My Profile" },
                      { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
                      { to: "/send", icon: ChartBar, label: "Challenge" },
                      { to: "/insights", icon: Inspect, label: "Insights" },
                      { to: "/pitch", icon: Inspect, label: "Presentation" },
                      { to: "/eco-store", icon: Store, label: "EcoStore" },
                      { to: "/community", icon: Users, label: "Community" },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <item.icon size={15} className="text-gray-400" />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <div className="h-px bg-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <button className="px-6 py-2.5 text-[15px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-full shadow-md shadow-emerald-200 transition-all duration-200 hover:scale-105">
                  Get Started
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
