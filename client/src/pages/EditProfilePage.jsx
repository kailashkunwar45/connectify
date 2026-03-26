import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "../lib/api";
import { toast } from "react-hot-toast";
import { MapPinIcon, GlobeIcon, LanguagesIcon, CameraIcon, ShuffleIcon, PlusIcon, XIcon, CheckCircle2Icon } from "lucide-react";

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean",
  "Italian", "Portuguese", "Russian", "Arabic", "Hindi", "Bengali", "Urdu",
  "Indonesian", "Turkish", "Vietnamese", "Swahili", "Nepali"
].sort();

export default function EditProfilePage({ authUser }) {
  const [formData, setFormData] = useState({
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
  });

  const [languagesKnown, setLanguagesKnown] = useState(authUser?.languagesKnown || []);
  const [newLanguage, setNewLanguage] = useState("");
  
  const [profileImgPreview, setProfileImgPreview] = useState(authUser?.profilePic || null);
  const [profileImgFile, setProfileImgFile] = useState(null);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Profile updated successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append("bio", formData.bio);
    submitData.append("location", formData.location);
    submitData.append("nativeLanguage", formData.nativeLanguage);
    submitData.append("learningLanguage", formData.learningLanguage);
    
    // Send array properly
    submitData.append("languagesKnown", JSON.stringify(languagesKnown));

    if (profileImgFile) {
      submitData.append("profilePic", profileImgFile);
    } else if (profileImgPreview && profileImgPreview !== authUser?.profilePic) {
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

  const addLanguage = (e) => {
      e.preventDefault();
      if(newLanguage.trim() && !languagesKnown.includes(newLanguage.trim())) {
          setLanguagesKnown([...languagesKnown, newLanguage.trim()]);
          setNewLanguage("");
      }
  };

  const removeLanguage = (langToRemove) => {
      setLanguagesKnown(languagesKnown.filter(lang => lang !== langToRemove));
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-10 no-scrollbar bg-base-300" data-theme="dark">
      <div className="max-w-3xl mx-auto glass rounded-[3rem] p-8 lg:p-16 shadow-2xl relative border border-white/5 bg-base-100">
        
        <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                Edit <span className="text-primary italic">Profile</span>
            </h1>
            <p className="opacity-60 text-lg font-medium">Keep your language learning preferences up to date.</p>
        </div>

        {/* Profile Pic Selection */}
        <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
                <div className="avatar">
                    <div className="w-32 h-32 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-4 overflow-hidden shadow-2xl">
                        <img src={profileImgPreview || "https://api.dicebear.com/9.x/avataaars/svg?seed=default"} alt="Avatar Preview" className="object-cover" />
                    </div>
                </div>
                <label className="absolute bottom-0 right-0 bg-primary hover:bg-primary-focus text-white p-3 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <CameraIcon size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>
            <button type="button" onClick={handleRandomAvatar} className="btn btn-sm btn-ghost gap-2 rounded-xl text-primary font-bold">
                <ShuffleIcon size={16} /> Random Avatar
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest opacity-40 ml-4">About You</label>
            <textarea
              className="textarea textarea-bordered w-full rounded-3xl bg-base-200/50 border-none focus:ring-4 focus:ring-primary/20 transition-all p-6 text-base"
              rows={3}
              placeholder="Hi! I'm learning Spanish and love talking about science fiction and coding."
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest opacity-40 ml-4 flex items-center gap-2">
                    <GlobeIcon size={14} /> Native Language
                </label>
                <select
                    className="select select-bordered w-full rounded-2xl bg-base-200/50 border-none focus:ring-4 focus:ring-primary/20 transition-all px-6 font-bold"
                    value={formData.nativeLanguage}
                    onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                >
                    <option value="">Select Language</option>
                    {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>
            
            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest opacity-40 ml-4 flex items-center gap-2">
                    <LanguagesIcon size={14} /> Learning Language
                </label>
                <select
                    className="select select-bordered w-full rounded-2xl bg-primary/10 border-none focus:ring-4 focus:ring-primary/40 transition-all px-6 text-primary font-bold"
                    value={formData.learningLanguage}
                    onChange={(e) => setFormData({ ...formData, learningLanguage: e.target.value })}
                >
                    <option value="">Select Language</option>
                    {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>
          </div>

          <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest opacity-40 ml-4 flex items-center gap-2">
                    <CheckCircle2Icon size={14} /> Other Fluent Languages
              </label>
              <div className="flex flex-wrap gap-2 mb-2 p-4 bg-base-200/50 rounded-3xl min-h-[4rem]">
                   {languagesKnown.length === 0 && <span className="opacity-40 italic text-sm my-auto ml-2">No other languages added yet.</span>}
                   {languagesKnown.map(lang => (
                       <div key={lang} className="badge badge-lg badge-secondary font-bold gap-2 p-4 rounded-xl">
                           {lang}
                           <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-base-100/50 opacity-70 transition-all">
                               <XIcon size={14} />
                           </button>
                       </div>
                   ))}
              </div>
              <div className="flex gap-2">
                  <select
                    className="select select-bordered w-full rounded-2xl bg-base-200/50 border-none focus:ring-4 focus:ring-secondary/20 transition-all px-6 font-bold"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                  >
                      <option value="">Select a language to add...</option>
                      {LANGUAGES.filter(l => !languagesKnown.includes(l)).map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                      ))}
                  </select>
                  <button type="button" onClick={addLanguage} className="btn btn-secondary rounded-2xl px-6">
                      <PlusIcon size={20} /> Add
                  </button>
              </div>
          </div>

          <div className="pt-8">
            <button 
              type="submit" 
              className="btn btn-primary w-full rounded-2xl shadow-xl shadow-primary/30 text-lg h-14 font-black tracking-wide"
              disabled={isPending}
            >
              {isPending ? <span className="loading loading-spinner"></span> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
