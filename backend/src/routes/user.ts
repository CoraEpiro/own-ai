import express from "express";
import { getUserById, getUserBio, updateUserBio } from "../services/databaseService";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.get("/me", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  const user = await getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// GET /api/user/bio — fetch user's custom instructions
router.get("/bio", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const bio = await getUserBio(userId);
    res.json({ bio });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch bio" });
  }
});

// PUT /api/user/bio — update user's custom instructions
router.put("/bio", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { bio } = req.body;
    if (typeof bio !== "string") return res.status(400).json({ error: "Bio must be a string" });
    if (bio.length > 2000) return res.status(400).json({ error: "Bio must be under 2000 characters" });
    await updateUserBio(userId, bio.trim());
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update bio" });
  }
});

export { router as userRoutes };
