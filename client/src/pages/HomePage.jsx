import React, { useState, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  getUserRecommendatedUsers,
  getUserFriends,
  getOutGoingFriendReqs,
  sendFriendRequest,
} from "../lib/api.js";
import { Link } from "react-router-dom";
import { UserIcon, MapPinIcon, UsersIcon, SparklesIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import FriendCard, { getLanguageFlag } from "../components/FriendCard.jsx";
import NoFriendsFound from "../components/NoFriends.jsx";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outGoingRequestsIds, setOutGoingRequestsIds] = useState(new Set());

  const { data, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });
  const friends = data?.friends || [];

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["Users"],
    queryFn: getUserRecommendatedUsers,
  });
  const recomendedUsers = usersData?.users || [];

  const { data: outGoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutGoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
  });

  useEffect(() => {
    const outgoingIds = new Set();
    if (outGoingFriendReqs && outGoingFriendReqs.outgoingRequests?.length > 0) {
      outGoingFriendReqs.outgoingRequests.forEach((req) => {
        outgoingIds.add(req.receiver._id);
      });
      setOutGoingRequestsIds(outgoingIds);
    }
  }, [outGoingFriendReqs]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-12 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent p-8 md:p-12 border border-primary/10"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <SparklesIcon size={120} className="text-primary" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            Welcome back, <span className="text-primary">Learner</span>.
          </h1>
          <p className="text-lg opacity-70 leading-relaxed max-w-lg">
            Connect with peers, practice languages, and grow your global network in 
            real-time. Your journey to fluency continues here.
          </p>
          <div className="flex gap-4 pt-4">
             <Link to="/search" className="btn btn-primary rounded-2xl shadow-xl shadow-primary/20 gap-2">
                <UsersIcon size={20} /> Explore Community
             </Link>
          </div>
        </div>
      </motion.section>

      {/* Friends Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <UsersIcon size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Your Network</h2>
          </div>
          <Link to="/notification" className="btn btn-ghost btn-sm rounded-xl">
            Notifications {outGoingRequestsIds.size > 0 && <span className="badge badge-primary badge-sm ml-2">{outGoingRequestsIds.size}</span>}
          </Link>
        </div>

        {loadingFriends ? (
          <div className="flex justify-center py-20 opacity-20">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {friends.map((friend, idx) => (
              <motion.div 
                key={friend._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <FriendCard friend={friend} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Recommendations */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
              <SparklesIcon size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Meet New Learners</h2>
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-20 opacity-20">
            <span className="loading loading-spinner loading-lg text-secondary" />
          </div>
        ) : recomendedUsers.length === 0 ? (
          <div className="glass p-12 text-center rounded-3xl border-base-300 opacity-50">
            <h3 className="font-semibold text-lg">Everyone is connected! Check back later.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recomendedUsers.map((user, idx) => {
              const hasRequestBeenSent = outGoingRequestsIds.has(user._id);

              return (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass group rounded-3xl p-5 space-y-5 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 border border-base-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-lg">
                        <img 
                          src={user.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} 
                          alt={user.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{user.name}</h3>
                      {user.location && (
                        <p className="flex items-center text-xs opacity-50 mt-1">
                          <MapPinIcon className="w-3 h-3 mr-1" />
                          {user.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                     <span className="px-2 py-1 rounded-lg bg-secondary/10 text-secondary border border-secondary/10">
                        {getLanguageFlag(user.nativeLanguage)} {user.nativeLanguage}
                     </span>
                     <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/10">
                        {getLanguageFlag(user.learningLanguage)} {user.learningLanguage}
                     </span>
                  </div>

                  <button
                    onClick={() => sendRequestMutation(user._id)}
                    disabled={hasRequestBeenSent || isPending}
                    className={`btn btn-sm w-full rounded-xl transition-all ${
                      hasRequestBeenSent 
                      ? "btn-ghost border-success text-success cursor-default" 
                      : "btn-primary shadow-lg shadow-primary/20"
                    }`}
                  >
                    {hasRequestBeenSent ? "Request Sent" : "Connect Now"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;

const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
