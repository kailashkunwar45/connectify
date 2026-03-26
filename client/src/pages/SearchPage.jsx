import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchUsers, sendFriendRequest } from "../lib/api";
import { SearchIcon, UserPlusIcon, UsersIcon, Loader2Icon, MapPinIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { getLanguageFlag } from "../components/FriendCard";
import useAuthUser from "../hooks/useAuthUser";

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ["searchUsers", debouncedTerm],
    queryFn: () => searchUsers(debouncedTerm),
    enabled: debouncedTerm.length > 1,
  });

  const { mutate: sendRequest, isPending: isSending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      toast.success("Friend request sent!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send request");
    },
  });

  const users = data?.users?.filter(u => u._id !== authUser?._id) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 min-h-[85vh]">
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Find Your Next Partner
        </h1>
        <p className="max-w-[600px] text-base-content opacity-70 text-lg font-medium">
          Search by name or email to connect with language learners around the world.
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity" />
        </div>
        <input
          type="text"
          className="input input-lg input-bordered w-full pl-14 bg-base-100/50 backdrop-blur-sm shadow-2xl border-primary/20 focus:border-primary transition-all rounded-[2rem] text-lg font-medium"
          placeholder="Type a name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-6 flex items-center">
            <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {users.length > 0 ? (
          users.map((user) => (
            <div
              key={user._id}
              className="group relative overflow-hidden rounded-[2rem] bg-base-100 border border-base-300 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-6 flex items-center gap-4">
                <Link to={`/profile/${user._id}`} className="relative block shrink-0">
                  <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden ring-4 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-xl">
                    <img
                      src={user.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-xl leading-tight group-hover:text-primary transition-colors truncate">
                    {user.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="badge badge-secondary badge-sm gap-1 py-3 px-3 rounded-lg border-none shadow-sm">
                        {getLanguageFlag(user.nativeLanguage)} Native
                    </span>
                    <span className="badge badge-primary badge-sm gap-1 py-3 px-3 rounded-lg border-none shadow-sm">
                        {getLanguageFlag(user.learningLanguage)} Learning
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => sendRequest(user._id)}
                  className="btn btn-primary btn-sm rounded-2xl gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  disabled={isSending}
                >
                  <UserPlusIcon size={18} />
                </button>
              </div>
            </div>
          ))
        ) : debouncedTerm.length > 1 && !isLoading ? (
          <div className="col-span-full py-24 text-center glass rounded-[3rem] border-dashed border-2 border-base-300">
            <div className="flex flex-col items-center gap-4 opacity-40">
                <UsersIcon size={64} />
                <p className="text-xl font-bold">No users found matching "{debouncedTerm}"</p>
            </div>
          </div>
        ) : !isLoading && debouncedTerm.length <= 1 ? (
            <div className="col-span-full py-24 text-center opacity-30 flex flex-col items-center gap-6">
                <div className="p-8 bg-base-200 rounded-full">
                    <SearchIcon size={64} className="text-primary" />
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-black uppercase tracking-widest">Start Typing</p>
                    <p className="text-sm font-medium">Connect with learners around the globe</p>
                </div>
            </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchPage;
