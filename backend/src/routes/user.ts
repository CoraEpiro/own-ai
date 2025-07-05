import express from "express";
import { getUserById } from "../services/databaseService";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.get("/me", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  const user = await getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export { router as userRoutes };
