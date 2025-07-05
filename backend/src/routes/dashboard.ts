import express from "express";
import { getUserUsage } from "../services/databaseService";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const stats = await getUserUsage(userId);
  res.json(stats);
});

export { router as dashboardRoutes };
