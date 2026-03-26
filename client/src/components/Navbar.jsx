import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { logout, getFriendRequests } from "../lib/api";
import { BrainCircuitIcon, BellIcon, LogOutIcon, SearchIcon, SettingsIcon, MoreVerticalIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import ThemeSelector from "./ThemeSelector.jsx";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [moreOpen, setMoreOpen] = useState(false);

  const isChatPage = location.pathname.startsWith("/chat");

  // Fetch incoming friend requests for notification badge
  const { data: friendReqData } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 30000,
    enabled: !!authUser,
  });

  const incomingCount = friendReqData?.incomingRequests?.length || 0;

  // Logout mutation
   const { mutate: logoutMutation } = useMutation({

    mutationFn: logout,

    onSuccess: () => 
      queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-14 sm:h-16 flex items-center px-3 sm:px-4">
      <div className="flex justify-between w-full items-center">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">

          {/* Show logo only on chat page */}
          {isChatPage && (
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <BrainCircuitIcon className="w-7 h-7 sm:w-9 sm:h-9 text-primary" />
              <span className="text-lg sm:text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                LinkIt
              </span>
            </Link>
          )}

          {/* Page titles for other pages */}
          {!isChatPage && (
            <span className="text-base sm:text-lg font-semibold truncate">
              {location.pathname === "/" && "Home"}
              {location.pathname === "/notification" && "Notifications"}
              {location.pathname === "/friends" && "Friends"}
              {location.pathname === "/call" && "Call"}
              {location.pathname === "/search" && "Search"}
              {location.pathname.startsWith("/profile") && "Profile"}
            </span>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">

          {/* Search - hidden on smallest screens */}
          <Link to="/search" className="hidden sm:block">
            <button className="btn btn-ghost btn-circle btn-sm sm:btn-md">
              <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-base-content opacity-70" />
            </button>
          </Link>

          {/* Notifications with badge */}
          <Link to="/notification" className="relative hidden sm:block">
            <button className="btn btn-ghost btn-circle btn-sm sm:btn-md">
              <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-base-content opacity-70" />
            </button>
            {incomingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-error/40 animate-bounce">
                {incomingCount > 9 ? "9+" : incomingCount}
              </span>
            )}
          </Link>

          {/* Theme selector - hidden on mobile */}
          <div className="hidden md:block">
            <ThemeSelector />
          </div>

          {/* Settings / Edit Profile - hidden on mobile */}
          <Link to="/profile/edit" className="hidden md:block">
            <button className="btn btn-ghost btn-circle btn-sm sm:btn-md">
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-base-content opacity-70" />
            </button>
          </Link>

          {/* User avatar */}
          <div className="avatar">
            <div className="w-8 sm:w-9 rounded-full">
              <img
                src={authUser?.profilePic}
                alt="User Profile"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Logout - hidden on mobile, shown in more menu */}
          <button className="btn btn-ghost btn-circle btn-sm sm:btn-md hidden md:flex"
            onClick={logoutMutation}>
            <LogOutIcon className="w-5 h-5 sm:w-6 sm:h-6 text-base-content opacity-70" />
          </button>

          {/* Mobile More Menu */}
          <div className="md:hidden relative">
            <button 
              className="btn btn-ghost btn-circle btn-sm"
              onClick={() => setMoreOpen(!moreOpen)}
            >
              <MoreVerticalIcon className="w-5 h-5 text-base-content opacity-70" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-3 z-50 min-w-[200px] space-y-1 animate-in fade-in zoom-in-95 duration-200">
                <ThemeSelector />
                <Link to="/profile/edit" onClick={() => setMoreOpen(false)} className="btn btn-ghost btn-sm w-full justify-start gap-3 rounded-xl">
                  <SettingsIcon className="w-4 h-4" /> Settings
                </Link>
                <button onClick={() => { logoutMutation(); setMoreOpen(false); }} className="btn btn-ghost btn-sm w-full justify-start gap-3 rounded-xl text-error">
                  <LogOutIcon className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
