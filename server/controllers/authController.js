import User from "../models/User.js";
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js";
import { upsertStreamUser, generateStreamToken } from "../lib/stream.js";

// REGISTER
export async function register(req, res) {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Fill all fields" });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Password too short" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email exists" });

    const newUser = await User.create({ name, email, password });

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("jwt", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", 
      maxAge: 7*24*60*60*1000 
    });

    const { password: pass, ...userData } = newUser._doc;
    res.status(201).json({ success: true, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Fill all fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    const correct = await user.matchPassword(password);
    if (!correct) return res.status(401).json({ success: false, message: "Incorrect password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("jwt", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", 
      maxAge: 7*24*60*60*1000 
    });

    const { password: pass, ...userData } = user._doc;
    res.status(200).json({ success: true, message: "Login successful", user: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// LOGOUT
export function logout(req, res) {
  res.clearCookie("jwt", { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax"
  });
  res.status(200).json({ success: true, message: "Logged out" });
}

// ONBOARD
export async function onboard(req, res) {
  try {
    console.log("🚀 Onboarding started...");
    console.log("Logged in User:", req.user?._id);
    console.log("Request Body:", req.body);
    console.log("Request File:", req.file ? "File present" : "No file");

    const userId = req.user?._id;
    if (!userId) {
      console.error("❌ No user in request");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, bio, location, nativeLanguage, learningLanguage } = req.body;
    let profilePic = req.body.profilePic;

    if (req.file) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
        console.warn("⚠️ Cloudinary credentials missing or set to placeholder. Skipping file upload.");
      } else {
        console.log("🚀 Uploading to Cloudinary...");
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "connect_profiles" },
            (error, result) => {
              if (error) {
                console.error("❌ Cloudinary error:", error);
                reject(error);
              } else {
                console.log("✅ Cloudinary success");
                resolve(result);
              }
            }
          );
          uploadStream.end(req.file.buffer);
        });
        const result = await uploadPromise;
        profilePic = result.secure_url;
      }
    }

    console.log("🚀 Updating user in DB...");
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, bio, location, nativeLanguage, learningLanguage, profilePic, isOnboarded: true },
      { new: true }
    );

    if (!updatedUser) {
      console.error("❌ User not found in DB:", userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("🚀 Syncing with Stream...");
    try {
      await upsertStreamUser({ 
        id: updatedUser._id.toString(), 
        name: updatedUser.name, 
        image: updatedUser.profilePic || "" 
      });
      console.log("✅ Stream sync success");
    } catch (e) { 
      console.error("⚠️ Stream sync failed (non-fatal):", e.message); 
    }

    console.log("✅ Onboarding complete!");
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("❌ CRITICAL Onboarding Error:", error.stack);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

// GET ME
export async function getMe(req, res) {
  try {
    const user = req.user;
    const streamToken = await generateStreamToken(user._id);
    const streamApiKey = process.env.STREAM_API_KEY;
    res.status(200).json({ success: true, user, streamToken, streamApiKey });
  } catch (error) {
    console.error("getMe error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}