import React from "react";
import { MapPinIcon, MessageSquareIcon, UserIcon, MoreHorizontalIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const getLanguageFlag = (lang) => {
  const flags = {
    English: "🇺🇸",
    Spanish: "🇪🇸",
    French: "🇫🇷",
    German: "🇩🇪",
    Chinese: "🇨🇳",
    Japanese: "🇯🇵",
    Nepali: "🇳🇵",
  };
  return flags[lang] || "🌐";
};

const FriendCard = ({ friend }) => {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass group rounded-[2.5rem] p-6 space-y-6 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 border border-base-300 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-2 h-0 group-hover:h-full bg-primary transition-all duration-500" />
      
      <div className="flex items-start justify-between">
        <Link to={`/profile/${friend._id}`} className="relative block">
          <div className="w-20 h-20 rounded-[2rem] overflow-hidden ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all shadow-xl">
            <img 
              src={friend.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} 
              alt={friend.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-success border-4 border-base-100 shadow-md" />
        </Link>
        <button className="btn btn-ghost btn-circle btn-sm opacity-20 group-hover:opacity-100 transition-opacity">
            <MoreHorizontalIcon size={18} />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="font-black text-xl tracking-tight leading-tight">{friend.name}</h3>
        {friend.location && (
          <p className="flex items-center text-xs font-bold opacity-40 uppercase tracking-widest">
            <MapPinIcon className="w-3 h-3 mr-1.5 text-primary" />
            {friend.location}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <span className="px-3 py-1.5 rounded-xl bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-wider border border-secondary/10">
          {getLanguageFlag(friend.nativeLanguage)} {friend.nativeLanguage}
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/10">
          {getLanguageFlag(friend.learningLanguage)} {friend.learningLanguage}
        </span>
      </div>

      <div className="flex gap-3 pt-4">
        <Link 
          to={`/chat/${friend._id}`}
          className="btn btn-primary flex-1 rounded-2xl shadow-lg shadow-primary/20 h-14 min-h-[3.5rem] group/btn"
        >
          <MessageSquareIcon size={18} className="group-hover/btn:rotate-12 transition-transform" />
          <span className="font-bold">Chat</span>
        </Link>
        <Link 
          to={`/profile/${friend._id}`} 
          className="btn btn-ghost bg-base-200/50 rounded-2xl h-14 min-h-[3.5rem] px-4"
        >
          <UserIcon size={18} />
        </Link>
      </div>
    </motion.div>
  );
};

export default FriendCard;
