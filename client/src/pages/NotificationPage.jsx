import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFriendRequests, acceptFriendRequest, declineFriendRequest, cancelFriendRequest } from "../lib/api";
import { toast } from "react-hot-toast";
import { UserCheckIcon, UserPlusIcon, XIcon, CheckIcon, Trash2Icon } from "lucide-react";
import { getLanguageFlag } from "../components/FriendCard";

export default function NotificationPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const incomingRequests = data?.incomingRequests || [];
  const outgoingRequests = data?.outgoingRequests || [];

  const { mutate: acceptMutation } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Action failed");
    },
  });

  const { mutate: declineMutation } = useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      toast.success("Friend request declined");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Action failed");
    },
  });

  const { mutate: cancelMutation } = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      toast.success("Friend request cancelled");
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <UserPlusIcon className="text-primary" /> Notifications
        </h1>
        <p className="opacity-70 mt-1">Manage your friend requests and connections</p>
      </div>

      {/* INCOMING REQUESTS */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Incoming Requests <span className="badge badge-primary">{incomingRequests.length}</span>
        </h2>
        {incomingRequests.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center opacity-60">
            <p>No pending friend requests</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {incomingRequests.map((req) => (
              <div key={req._id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
                <div className="card-body p-4 flex flex-row items-center gap-4">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full">
                      <img src={req.sender.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} alt={req.sender.name} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{req.sender.name}</h3>
                    <p className="text-xs opacity-70">
                      Native: {getLanguageFlag(req.sender.nativeLanguage)} |
                      Learning: {getLanguageFlag(req.sender.learningLanguage)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptMutation(req._id)}
                      className="btn btn-primary btn-sm btn-circle"
                      title="Accept"
                    >
                      <CheckIcon size={18} />
                    </button>
                    <button 
                      onClick={() => declineMutation(req._id)}
                      className="btn btn-ghost btn-sm btn-circle border-base-300" 
                      title="Decline"
                    >
                      <XIcon size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* OUTGOING REQUESTS */}
      <section className="opacity-80">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Sent Requests <span className="badge badge-ghost">{outgoingRequests.length}</span>
        </h2>
        {outgoingRequests.length === 0 ? (
          <p className="text-sm opacity-50 px-2">No outgoing requests sent yet</p>
        ) : (
          <div className="grid gap-3 opacity-90">
            {outgoingRequests.map((req) => (
              <div key={req._id} className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                <img
                  src={req.receiver.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"}
                  alt={req.receiver.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{req.receiver.name}</p>
                  <p className="text-[10px] opacity-60">Waiting for response...</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-sm">Pending</span>
                  <button 
                    onClick={() => cancelMutation(req._id)}
                    className="btn btn-ghost btn-xs btn-circle text-error"
                    title="Cancel Request"
                  >
                    <Trash2Icon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
