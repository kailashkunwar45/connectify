import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

// Get Recommended Users
export async function getReccomendedUsers(req, res) {
  try {
    const currentUserId = req.user._id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnboarded: true },
      ],
    });

    res.status(200).json({ success: true, users: recommendedUsers });
  } catch (error) {
    console.log("Error in getReccomendedUsers", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Get My Friends
export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate("friends", "name profilePic nativeLanguage learningLanguage");

    res.status(200).json({ success: true, friends: user.friends });
  } catch (error) {
    console.log("Error in getMyFriends", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Send Friend Request
export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { id: receiverId } = req.params;

    if (myId.toString() === receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot send a friend request to yourself" });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (receiver.friends.includes(myId)) {
      return res
        .status(400)
        .json({ success: false, message: "You are already friends with this user" });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, receiver: receiverId },
        { sender: receiverId, receiver: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ success: false, message: "Friend request already exists" });
    }

    await FriendRequest.create({
      sender: myId,
      receiver: receiverId,
    });

    res
      .status(200)
      .json({ success: true, message: "Friend request sent successfully" });
  } catch (error) {
    console.log("Error in sendFriendRequest", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ success: false, message: "Friend request not found" });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.receiver },
    });

    await User.findByIdAndUpdate(friendRequest.receiver, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ success: true, message: "Friend request accepted successfully" });
  } catch (error) {
    console.log("Error in acceptFriendRequest", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getFriendRequest(req, res) {
  try {
    const incomingRequests = await FriendRequest.find({
      receiver: req.user._id,
      status: "pending",
    }).populate("sender", "name profilePic nativeLanguage learningLanguage");

    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    }).populate("receiver", "name profilePic nativeLanguage learningLanguage");

    res.status(200).json({
      incomingRequests,
      outgoingRequests,
    });
  } catch (error) {
    console.log("Error in getFriendRequest", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getOutgoingFriendRequest(req, res) {
  try {

    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    }).populate("receiver", "name profilePic nativeLanguage learningLanguage");

    res.status(200).json({ outgoingRequests });

  } catch (error) {
    console.log("Error in getOutgoingFriendRequest", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Search Users
export async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      ],
    }).select("name profilePic nativeLanguage learningLanguage");

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.log("Error in searchUsers", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Decline Friend Request
export async function declineFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ success: false, message: "Friend request not found" });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({ success: true, message: "Friend request declined" });
  } catch (error) {
    console.log("Error in declineFriendRequest", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Cancel Friend Request
export async function cancelFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ success: false, message: "Friend request not found" });
    }

    if (friendRequest.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({ success: true, message: "Friend request cancelled" });
  } catch (error) {
    console.log("Error in cancelFriendRequest", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Unfriend User
export async function unfriendUser(req, res) {
  try {
    const myId = req.user._id;
    const { id: friendId } = req.params;

    await User.findByIdAndUpdate(myId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: myId } });

    // Also remove any accepted/pending requests between them to be safe
    await FriendRequest.deleteMany({
      $or: [
        { sender: myId, receiver: friendId },
        { sender: friendId, receiver: myId },
      ],
    });

    res.status(200).json({ success: true, message: "User unfriended" });
  } catch (error) {
    console.log("Error in unfriendUser", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Get User Profile
export async function getUserProfile(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password -friends");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in getUserProfile", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Update Profile
import cloudinary from "../lib/cloudinary.js";
import { upsertStreamUser } from "../lib/stream.js";

export async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    const { name, bio, location, nativeLanguage, learningLanguage } = req.body;
    
    // Parse languagesKnown if sent as JSON string or multi-part form data array
    let languagesKnown = [];
    if (req.body.languagesKnown) {
        try {
            languagesKnown = JSON.parse(req.body.languagesKnown);
        } catch (e) {
            languagesKnown = Array.isArray(req.body.languagesKnown) ? req.body.languagesKnown : [req.body.languagesKnown];
        }
    }

    let profilePic = req.body.profilePic;

    if (req.file) {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name") {
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "connect_profiles" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        const result = await uploadPromise;
        profilePic = result.secure_url;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, bio, location, nativeLanguage, learningLanguage, languagesKnown, ...(profilePic && { profilePic }) },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    try {
      await upsertStreamUser({ 
        id: updatedUser._id.toString(), 
        name: updatedUser.name, 
        image: updatedUser.profilePic || "https://api.dicebear.com/9.x/avataaars/svg?seed=default" 
      });
    } catch (e) { 
        console.error("Stream update failed:", e.message); 
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfile", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
