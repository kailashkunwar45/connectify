import React from "react";
import { Loader2 } from "lucide-react";

const PageLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-r from-purple-200 via-pink-100 to-blue-200 bg-opacity-40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 bg-white/40 rounded-3xl shadow-xl border border-white/30 animate-fadeIn">
        <Loader2 className="w-14 h-14 text-purple-600 animate-spin-slow" />
        <p className="text-lg font-semibold text-purple-700 tracking-wide">
          Loading, please wait...
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
