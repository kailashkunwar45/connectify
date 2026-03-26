import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "../lib/api";
import { GlobeIcon, LanguagesIcon, MapPinIcon, CheckCircle2Icon, MessageCircleIcon, VideoIcon, ArrowLeftIcon, UserPlusIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendFriendRequest } from "../lib/api";
import toast from "react-hot-toast";

export default function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const isMe = authUser?._id === id;
  const isFriend = authUser?.friends?.some(f => (f._id || f).toString() === id);

  const { mutate: sendRequest, isPending: isSending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      toast.success("Friend request sent!");
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send request");
    },
  });

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: () => getUserProfile(id),
    enabled: !!id,
    retry: false
  });

  const user = response?.user;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <button onClick={() => navigate(-1)} className="btn btn-outline rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-10 no-scrollbar relative animate-in fade-in zoom-in-95 duration-500">
      
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 lg:top-8 lg:left-8 btn btn-circle btn-ghost z-10 w-12 h-12 bg-base-200/50 backdrop-blur-md">
         <ArrowLeftIcon size={24} />
      </button>

      <div className="max-w-4xl mx-auto glass rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5">
         
         {/* Banner & Avatar Head */}
         <div className="h-48 lg:h-64 bg-gradient-to-tr from-primary/80 to-secondary/80 w-full relative">
             <div className="absolute -bottom-20 left-10 lg:left-16 avatar">
                <div className="w-40 h-40 rounded-full ring-8 ring-base-100 ring-offset-0 bg-base-100 shadow-2xl">
                    <img src={user.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} alt={user.name} />
                </div>
             </div>
             
             {/* Action Buttons - Friends Only */}
             {!isMe && isFriend && (
                 <div className="absolute bottom-6 right-6 lg:right-10 flex gap-3">
                     <button onClick={() => navigate(`/chat/${user._id}`)} className="btn btn-circle bg-base-100 hover:bg-base-200 border-none shadow-xl text-primary transform hover:-translate-y-1 transition-all h-14 w-14">
                        <MessageCircleIcon size={24} />
                     </button>
                     <button onClick={() => navigate(`/call?userId=${user._id}`)} className="btn btn-circle bg-base-100 hover:bg-base-200 border-none shadow-xl text-secondary transform hover:-translate-y-1 transition-all h-14 w-14">
                        <VideoIcon size={24} />
                     </button>
                 </div>
             )}
             {/* Add Friend Button - Non-friends Only */}
             {!isMe && !isFriend && (
                 <div className="absolute bottom-6 right-6 lg:right-10 flex gap-3">
                     <button 
                       onClick={() => sendRequest(user._id)} 
                       disabled={isSending}
                       className="btn bg-base-100 hover:bg-base-200 border-none shadow-xl text-primary font-bold rounded-2xl px-6 h-12 gap-2"
                     >
                        <UserPlusIcon size={20} />
                        {isSending ? "Sending..." : "Add Friend"}
                     </button>
                 </div>
             )}
              {isMe && (
                 <div className="absolute bottom-6 right-6 lg:right-10 flex gap-3">
                     <button onClick={() => navigate('/profile/edit')} className="btn bg-base-100 hover:bg-base-200 border-none shadow-xl text-primary font-bold rounded-2xl px-6 h-12">
                        Edit Profile
                     </button>
                 </div>
             )}
         </div>

         <div className="pt-24 px-10 lg:px-16 pb-16 space-y-10">
            {/* Name & Titles */}
            <div>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight">{user.name}</h1>
                <p className="text-lg opacity-60 font-medium tracking-wide mt-2 flex items-center gap-2">
                    <MapPinIcon size={18} /> {user.location || "Earth"}
                </p>
            </div>

            {/* Language Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-base-200/50 rounded-[2rem] p-6 lg:p-8 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3 text-primary opacity-80 mb-2">
                        <LanguagesIcon size={24} />
                        <h3 className="font-bold tracking-widest uppercase text-sm">Native Language</h3>
                    </div>
                    <p className="text-2xl font-black">{user.nativeLanguage || "Not Specified"}</p>
                </div>
                
                <div className="bg-primary/5 rounded-[2rem] border border-primary/20 p-6 lg:p-8 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3 text-primary opacity-80 mb-2">
                        <LanguagesIcon size={24} />
                        <h3 className="font-bold tracking-widest uppercase text-sm">Learning Language</h3>
                    </div>
                    <p className="text-2xl text-primary font-black">{user.learningLanguage || "Not Specified"}</p>
                </div>
            </div>

            {/* Languages Known Badges */}
            {user.languagesKnown && user.languagesKnown.length > 0 && (
                <div className="space-y-4 bg-base-200/30 rounded-[2rem] p-6 lg:p-8">
                     <div className="flex items-center gap-3 opacity-60 mb-4">
                        <CheckCircle2Icon size={20} />
                        <h3 className="font-bold tracking-widest uppercase text-sm">Fluent In</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {user.languagesKnown.map(lang => (
                            <span key={lang} className="badge badge-lg badge-secondary font-bold px-4 py-4 rounded-xl shadow-lg shadow-secondary/20">
                                {lang}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Bio */}
            {user.bio && (
                <div className="space-y-4">
                     <h3 className="font-bold tracking-widest uppercase text-sm opacity-40 ml-2">About Me</h3>
                     <p className="text-xl leading-relaxed opacity-90 font-medium p-6 bg-base-200/20 rounded-[2rem] italic border-l-4 border-primary/40">
                         "{user.bio}"
                     </p>
                </div>
            )}
         </div>

      </div>
    </div>
  );
}
