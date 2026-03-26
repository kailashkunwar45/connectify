import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useThemeStore } from "../store/useThemeStore.js";
import { motion, AnimatePresence } from "framer-motion";
import { UsersIcon, BellIcon, HomeIcon, SearchIcon, MessageSquareIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";

const Layout = ({ children, showSidebar = false }) => {
  const { theme } = useThemeStore();
  const location = useLocation();
  const { authUser } = useAuthUser();

  // Fetch notification count for mobile nav badge
  const { data: friendReqData } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 30000,
    enabled: !!authUser,
  });

  const incomingCount = friendReqData?.incomingRequests?.length || 0;

  const MobileNav = () => (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm">
      <div className="glass rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between px-4">
        <MobileNavItem to="/" icon={HomeIcon} active={location.pathname === "/"} />
        <MobileNavItem to="/search" icon={SearchIcon} active={location.pathname === "/search"} />
        <MobileNavItem to="/friends" icon={UsersIcon} active={location.pathname === "/friends"} />
        <MobileNavItem to="/notification" icon={BellIcon} active={location.pathname === "/notification"} badge={incomingCount} />
        <MobileNavItem to="/chat" icon={MessageSquareIcon} active={location.pathname.startsWith("/chat")} />
      </div>
    </div>
  );

  const MobileNavItem = ({ to, icon: Icon, active, badge }) => (
    <Link 
      to={to} 
      className={`relative p-2.5 rounded-xl transition-all duration-300 ${
        active 
        ? "bg-primary text-white shadow-lg shadow-primary/40 scale-110 -translate-y-1.5" 
        : "opacity-60 hover:opacity-100 hover:text-success hover:bg-success/10 hover:shadow-md hover:shadow-success/20 hover:scale-105"
      }`}
    >
      <Icon size={18} />
      {badge > 0 && !active && (
        <span className="absolute -top-1 -right-1 bg-error text-white text-[7px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full animate-pulse">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-base-100 transition-colors duration-500" data-theme={theme}>
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      <div className="flex relative z-10 h-full min-h-screen">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
          <Navbar />
          <motion.main 
            key={location.pathname}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 overflow-y-auto pb-20 md:pb-0"
          >
            {children}
          </motion.main>
        </div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Layout;
