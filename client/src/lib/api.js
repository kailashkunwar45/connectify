import { axiosInstance } from "./axios";

// SIGNUP
export const signup = async (signupData) => {
  const res = await axiosInstance.post("/auth/register", signupData, { withCredentials: true });
  return res.data;
};

// LOGIN
export const login = async (loginData) => {
  const res = await axiosInstance.post("/auth/login", loginData, { withCredentials: true });
  return res.data;
};

// LOGOUT
export const logout = async () => {
  const res = await axiosInstance.post("/auth/logout", {}, { withCredentials: true });
  return res.data;
};

// GET CURRENT USER
export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me", { withCredentials: true });
    return res.data;
  } catch (err) {
    return null; // not authenticated
  }
};

// COMPLETE ONBOARDING
export const completeOnboarding = async (formData) => {
  const res = await axiosInstance.post("/auth/onboarding", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// GET FRIENDS
export const getUserFriends = async () => {
  const res = await axiosInstance.get("/users/friends", { withCredentials: true });
  return res.data;
};

// GET RECOMMENDED USERS
export const getUserRecommendatedUsers = async () => {
  const res = await axiosInstance.get("/users", { withCredentials: true });
  return res.data;
};

// GET OUTGOING FRIEND REQUESTS
export const getOutGoingFriendReqs = async () => {
  const res = await axiosInstance.get("/users/outgoing-friend-requests", { withCredentials: true });
  return res.data;
};

// SEND FRIEND REQUEST
export const sendFriendRequest = async (userId) => {
  const res = await axiosInstance.post(`/users/friend-request/${userId}`, {}, { withCredentials: true });
  return res.data;
};

// GET FRIEND REQUESTS (INCOMING & OUTGOING)
export const getFriendRequests = async () => {
  const res = await axiosInstance.get("/users/friend-requests", { withCredentials: true });
  return res.data;
};

// ACCEPT FRIEND REQUEST
export const acceptFriendRequest = async (requestId) => {
  const res = await axiosInstance.put(`/users/friend-request/${requestId}/accept`, {}, { withCredentials: true });
  return res.data;
};

// SEARCH USERS
export const searchUsers = async (query) => {
  const res = await axiosInstance.get(`/users/search?query=${query}`, { withCredentials: true });
  return res.data;
};

// DECLINE FRIEND REQUEST
export const declineFriendRequest = async (requestId) => {
  const res = await axiosInstance.delete(`/users/friend-request/${requestId}/decline`, { withCredentials: true });
  return res.data;
};

// CANCEL FRIEND REQUEST
export const cancelFriendRequest = async (requestId) => {
  const res = await axiosInstance.delete(`/users/friend-request/${requestId}/cancel`, { withCredentials: true });
  return res.data;
};

// UNFRIEND USER
export const unfriendUser = async (userId) => {
  const res = await axiosInstance.delete(`/users/friends/${userId}`, { withCredentials: true });
  return res.data;
};

// GET USER PROFILE
export const getUserProfile = async (userId) => {
  const res = await axiosInstance.get(`/users/profile/${userId}`, { withCredentials: true });
  return res.data;
};

// UPDATE USER PROFILE
export const updateUserProfile = async (formData) => {
  const res = await axiosInstance.put("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
