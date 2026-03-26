import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../lib/api.js";
import { BrainCircuitIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore.js";

const LoginPage = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const queryClient = useQueryClient();
  const { theme } = useThemeStore();

  const { mutate: loginMutation, isLoading, error } = useMutation({
    mutationFn: (data) => login(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      onLoginSuccess(data.user);
      toast.success("Login successful!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Login failed");
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-base-200"
      data-theme={theme}
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-3xl bg-base-100 rounded-xl shadow-lg overflow-hidden">

        {/* LEFT SIDE */}
        <div className="w-full lg:w-1/2 p-5 sm:p-8 flex flex-col">

          {/* Logo */}
          <div className="mb-6 flex items-center gap-2">
            <BrainCircuitIcon className="w-8 h-8 sm:w-9 sm:h-9 text-primary" />
            <span className="text-2xl sm:text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              LinkIt
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error shadow-lg mb-4">
              <div>
                <span>{error.response?.data?.message || "Login failed"}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Welcome Back</h2>
              <p className="text-sm opacity-70">Sign in to your LinkIt account</p>
            </div>

            {/* EMAIL */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">E-mail</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="input input-bordered w-full"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered w-full"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
              />
            </div>

            {/* BUTTON */}
            <button
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center">
              <p className="text-sm">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Create One
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* RIGHT SIDE */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            <div className="relative aspect-square max-w-sm mx-auto">
              <img
                src="/images/signup.png"
                alt="Language Learning Illustration"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">
                Link With Language Learners Around the World
              </h2>
              <p className="opacity-70">
                Practice conversation skills with native speakers and improve
                your skills together.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
