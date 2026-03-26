import express from 'express';  
import {
  getReccomendedUsers, 
  getMyFriends, 
  sendFriendRequest, 
  acceptFriendRequest, 
  getFriendRequest, 
  getOutgoingFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriendUser,
  searchUsers,
  getUserProfile,
  updateProfile
} from '../controllers/UserController.js'
import {protectRoute} from '../middleware/auth.middleware.js'
import upload from '../middleware/multer.js'

const router = express.Router(); 

router.use(protectRoute);

router.get("/", getReccomendedUsers);
router.get("/friends", getMyFriends);
router.get("/search", searchUsers);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.delete("/friend-request/:id/decline", declineFriendRequest);
router.delete("/friend-request/:id/cancel", cancelFriendRequest);

router.get("/friend-requests", getFriendRequest);
router.get("/outgoing-friend-requests", getOutgoingFriendRequest);

router.delete("/friends/:id", unfriendUser);

router.get("/profile/:id", protectRoute, getUserProfile);
router.put("/profile", protectRoute, upload.single("profilePic"), updateProfile);

router.get("/me", protectRoute, (req, res) => res.status(200).json({ success: true, user: req.user }));
  
export default router;