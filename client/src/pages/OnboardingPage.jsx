import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { MapPinIcon, GlobeIcon, LanguagesIcon, SparklesIcon, ChevronRightIcon, CameraIcon, ShuffleIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const OnboardingPage = () => {
  const [formData, setFormData] = useState({
    bio: "",
    location: "",
    nativeLanguage: "",
    learningLanguage: "",
  });
  const [profileImgPreview, setProfileImgPreview] = useState(null);
  const [profileImgFile, setProfileImgFile] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Profile completed!");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nativeLanguage || !formData.learningLanguage) {
        return toast.error("Please select languages");
    }
    
    const submitData = new FormData();
    submitData.append("bio", formData.bio);
    submitData.append("location", formData.location);
    submitData.append("nativeLanguage", formData.nativeLanguage);
    submitData.append("learningLanguage", formData.learningLanguage);

    if (profileImgFile) {
      submitData.append("profilePic", profileImgFile);
    } else if (profileImgPreview) {
      submitData.append("profilePic", profileImgPreview);
    }

    mutate(submitData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImgFile(file);
      setProfileImgPreview(URL.createObjectURL(file));
    }
  };

  const handleRandomAvatar = () => {
    const randomSeed = Math.floor(Math.random() * 10000);
    const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}`;
    setProfileImgPreview(url);
    setProfileImgFile(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-base-100 relative overflow-hidden text-base-content" data-theme="dark">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[150px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full glass rounded-[3rem] p-8 md:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-white/20 relative z-10"
      >
        <div className="text-center space-y-3 mb-10">
            <div className="inline-flex p-4 bg-primary/10 rounded-[2rem] text-primary mb-4">
                <SparklesIcon size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                Finish your <span className="text-primary italic">Profile</span>
            </h1>
            <p className="opacity-60 text-lg font-medium">Tell us more to find your perfect match.</p>
        </div>

        {/* Profile Pic Selection */}
        <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
                <div className="avatar">
                    <div className="w-28 h-28 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4 overflow-hidden shadow-2xl">
                        <img src={profileImgPreview || "https://api.dicebear.com/9.x/avataaars/svg?seed=boy"} alt="Avatar Preview" className="object-cover" />
                    </div>
                </div>
                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <CameraIcon size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>
            <button type="button" onClick={handleRandomAvatar} className="btn btn-sm btn-ghost gap-2 rounded-xl text-primary">
                <ShuffleIcon size={16} /> Random Avatar
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest opacity-40 ml-4">About You</label>
            <textarea
              className="textarea textarea-bordered w-full rounded-3xl bg-base-200/50 border-none focus:ring-4 focus:ring-primary/20 transition-all h-28 text-lg p-5"
              placeholder="E.g. I love exploring new cultures and practicing Spanish!"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest opacity-40 ml-4 flex items-center gap-2">
                    <MapPinIcon size={14} /> Country
                </label>
                <select
                    className="select select-bordered w-full rounded-2xl bg-base-200/50 border-none focus:ring-4 focus:ring-primary/20 transition-all px-6 font-bold"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                    <option value="">Select Country</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="Brazil">Brazil</option>
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Japan">Japan</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Spain">Spain</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest opacity-40 ml-4 flex items-center gap-2">
                    <LanguagesIcon size={14} /> Native
                </label>
                <select
                    className="select select-bordered w-full rounded-2xl bg-base-200/50 border-none focus:ring-4 focus:ring-primary/20 transition-all px-6 font-bold"
                    value={formData.nativeLanguage}
                    onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                >
                    <option value="">Select...</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Nepali">Nepali</option>
                </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest opacity-40 ml-4 flex items-center gap-2">
                <LanguagesIcon size={14} /> Learning Language
            </label>
            <select
                className="select select-bordered w-full rounded-2xl bg-base-200/50 border-none focus:ring-4 focus:ring-primary/20 transition-all px-6 font-bold"
                value={formData.learningLanguage}
                onChange={(e) => setFormData({ ...formData, learningLanguage: e.target.value })}
            >
                <option value="">Select...</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Nepali">Nepali</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full rounded-3xl shadow-2xl shadow-primary/30 mt-4 group"
            disabled={isPending}
          >
            {isPending ? (
                <span className="loading loading-spinner" />
            ) : (
                <>
                    Complete Onboarding
                    <ChevronRightIcon className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
