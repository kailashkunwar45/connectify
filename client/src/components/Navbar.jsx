import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { logout, getFriendRequests } from "../lib/api";
import { GlobeIcon, BellIcon, LogOutIcon, SearchIcon, SettingsIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import ThemeSelector from "./ThemeSelector.jsx";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isChatPage = location.pathname.startsWith("/chat");

  // Fetch incoming friend requests for notification badge
  const { data: friendReqData } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 30000, // refresh every 30s
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
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center px-4">
      <div className="flex justify-between w-full">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">

          {/* Show logo only on chat page */}
          {isChatPage && (
            <Link to="/" className="flex items-center gap-2.5">
              <GlobeIcon className="w-9 h-9 text-primary" />
              <span className="text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Connectify
              </span>
            </Link>
          )}

          {/* Page titles for other pages */}
          {!isChatPage && (
            <span className="text-lg font-semibold">
              {location.pathname === "/" && "Home"}
              {location.pathname === "/notification" && "Notifications"}
              {location.pathname === "/friends" && "Friends"}
              {location.pathname === "/call" && "Call"}
            </span>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Search */}
          <Link to="/search">
            <button className="btn btn-ghost btn-circle">
              <SearchIcon className="w-6 h-6 text-base-content opacity-70" />
            </button>
          </Link>

          {/* Notifications with badge */}
          <Link to="/notification" className="relative">
            <button className="btn btn-ghost btn-circle">
              <BellIcon className="w-6 h-6 text-base-content opacity-70" />
            </button>
            {incomingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-error/40 animate-bounce">
                {incomingCount > 9 ? "9+" : incomingCount}
              </span>
            )}
          </Link>

          {/* Theme selector */}
          <ThemeSelector />

          {/* Settings / Edit Profile */}
          <Link to="/profile/edit">
            <button className="btn btn-ghost btn-circle">
              <SettingsIcon className="w-6 h-6 text-base-content opacity-70" />
            </button>
          </Link>

          {/* User avatar */}
          <div className="avatar">
            <div className="w-9 rounded-full">
              <img
                src={authUser?.profilePic}
                alt="User Profile"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Logout button */}
          <button className="btn btn-ghost btn-circle"
          
            onClick = {logoutMutation}> 

            <LogOutIcon className="w-6 h-6 text-base-content opacity-70" />

          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
