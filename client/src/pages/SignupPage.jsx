import React, { useState } from "react";
import { NetworkIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { useThemeStore } from "../store/useThemeStore.js";

const SignUpPage = () => {
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useThemeStore();

  const { mutate, isLoading, error } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/register", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/login"); // redirect after signup
    },
  });

  const handleSignup = (e) => {
    e.preventDefault();
    mutate(signupData);
  };

  const handleChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-base-200"
      data-theme={theme}
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-3xl bg-base-100 rounded-xl shadow-lg overflow-hidden">

        {/* LEFT SIDE */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 flex flex-col">

          {/* Logo */}
          <div className="mb-6 flex items-center gap-2">
            <NetworkIcon className="w-9 h-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              LinkIt
            </span>
          </div> 

          {/* Error if any */}
          {error && (
            <div className="alert alert-error shadow-lg mb-4">
              <div>
                <span>{error.response?.data?.message || "Signup failed"}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">

            <div>
              <h2 className="text-xl font-semibold">Create an Account</h2>
              <p className="text-sm opacity-70">
                Join LinkIt and Start Your Language Learning Adventure!
              </p>
            </div>

            {/* NAME */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                className="input input-bordered w-full"
                value={signupData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* EMAIL */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">E-mail</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="input input-bordered w-full"
                value={signupData.email}
                onChange={handleChange}
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
                name="password"
                placeholder="Enter your password"
                className="input input-bordered w-full"
                value={signupData.password}
                onChange={handleChange}
                required
              />
              <p className="text-xs opacity-70">
                Password must be at least 8 characters
              </p>
            </div>

            {/* TERMS */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-2">
                <input type="checkbox" className="checkbox checkbox-sm" required />
                <span className="text-xs">
                  I agree to the{" "}
                  <span className="text-primary hover:underline">terms of services</span>{" "}
                  and{" "}
                  <span className="text-primary hover:underline">privacy policy</span>
                </span>
              </label>
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
                  Signing Up...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="text-center">
              <p className="text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
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
                LinkIt links you with language learners from around the world.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SignUpPage;
