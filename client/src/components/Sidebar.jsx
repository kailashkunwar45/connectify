import { useLocation, Link } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  GlobeIcon,
  HomeIcon,
  UsersIcon,
  BellIcon,
  SearchIcon,
  MessageSquareIcon
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { authUser } = useAuthUser();
  const currentPath = location.pathname;

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`btn btn-ghost justify-start w-full gap-4 px-4 rounded-2xl normal-case transition-all duration-300 group ${
        currentPath === to 
        ? "bg-primary/10 text-primary shadow-sm" 
        : "opacity-70 hover:opacity-100 hover:bg-base-300"
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentPath === to ? "text-primary" : ""}`} />
      <span className="font-bold">{label}</span>
      {currentPath === to && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#6366f1]" />
      )}
    </Link>
  );

  return (
    <aside className="w-72 bg-base-100 border-r border-base-300 hidden md:flex flex-col h-screen sticky top-0 transition-all duration-500 overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 p-8">
        <div className="p-2.5 bg-gradient-to-tr from-primary to-secondary rounded-2xl shadow-lg shadow-primary/20">
            <GlobeIcon className="w-8 h-8 text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-2xl font-black tracking-tighter">Connect</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Fluent P2P</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <NavLink to="/" icon={HomeIcon} label="Home" />
        <NavLink to="/search" icon={SearchIcon} label="Discover" />
        <NavLink to="/friends" icon={UsersIcon} label="Network" />
        <NavLink to="/notification" icon={BellIcon} label="Activity" />
        <NavLink to="/chat" icon={MessageSquareIcon} label="Chat" />
      </nav>

      {/* User Info */}
      <div className="p-6 border-t border-base-300 mt-auto bg-base-200/30">
        <div className="flex items-center gap-4 group"> 
          <div className="relative">
            <div className="avatar">
              <div className="w-12 h-12 rounded-2xl ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-xl overflow-hidden">
                <img src={authUser?.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} alt="User Profile" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-success border-4 border-base-100 shadow-lg" />
          </div>
          <div className="flex-1 min-w-0"> 
            <p className="text-sm font-black truncate">{authUser?.name}</p>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5">
              Online Now
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
