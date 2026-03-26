import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserFriends, unfriendUser } from "../lib/api";
import { MessageCircleIcon, UserMinusIcon, UserIcon, ShieldAlertIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getLanguageFlag } from "../components/FriendCard";

const FriendsPage = () => {
  const queryClient = useQueryClient();

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { mutate: unfriendAction } = useMutation({
    mutationFn: unfriendUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend removed");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Action failed");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const friendList = friends?.friends || friends || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 min-h-[85vh]">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-base-300 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <UserIcon className="text-primary" /> My Network
          </h1>
          <p className="opacity-70 mt-1">Connect and collaborate with your language partners</p>
        </div>
        <div className="badge badge-primary badge-lg p-4 font-mono">
          {friendList.length} Friends
        </div>
      </div>

      {friendList.length === 0 ? (
        <div className="card bg-base-100 border-2 border-dashed border-base-300 py-20 text-center opacity-60">
          <div className="flex flex-col items-center gap-4">
            <UserIcon size={64} className="opacity-20" />
            <div className="space-y-1">
              <p className="text-xl font-bold">Your network is empty</p>
              <p className="text-sm">Start searching for partners to learn together!</p>
            </div>
            <Link to="/search" className="btn btn-primary mt-4">
              Find Partners
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {friendList.map((friend) => (
            <div
              key={friend._id}
              className="group card bg-base-100 border border-base-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="card-body p-5">
                <div className="flex items-center gap-4">
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-2xl ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100 transition-all group-hover:scale-110">
                      <img src={friend.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} alt={friend.name} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                      {friend.name}
                    </h2>
                    <p className="text-xs opacity-60 flex flex-wrap gap-2 mt-1">
                      <span>{getLanguageFlag(friend.nativeLanguage)} Native</span>
                      <span className="opacity-30">|</span>
                      <span>{getLanguageFlag(friend.learningLanguage)} Learning</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6">
                  <Link
                    to={`/chat/${friend._id}`}
                    className="btn btn-primary btn-sm rounded-xl gap-2 shadow-lg shadow-primary/20"
                  >
                    <MessageCircleIcon size={16} />
                    Message
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to unfriend ${friend.name}?`)) {
                        unfriendAction(friend._id);
                      }
                    }}
                    className="btn btn-ghost btn-sm rounded-xl gap-2 hover:bg-error/10 hover:text-error transition-colors"
                  >
                    <UserMinusIcon size={16} />
                    Unfriend
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
