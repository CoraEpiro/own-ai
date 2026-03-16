import express from "express";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../config";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getUserUsage } from "../services/databaseService";
import { getModelDefinition } from "../config/models";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const router = express.Router();

/** Resolve provider name from model id, using centralized model definitions */
function getProvider(modelId: string): string {
  return getModelDefinition(modelId)?.provider || "Unknown";
}

// ── GET /dashboard ───────────────────────────────────────────
router.get("/", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const stats = await getUserUsage(userId);
  res.json(stats);
});

// ── GET /dashboard/filters ───────────────────────────────────
router.get("/filters", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("model")
      .eq("user_id", userId)
      .not("model", "is", null);

    const modelSet = new Set<string>();
    (messages || []).forEach((m: any) => { if (m.model) modelSet.add(m.model); });

    const models = Array.from(modelSet);
    const providerSet = new Set(models.map(getProvider));

    res.json({ models, providers: Array.from(providerSet) });
  } catch (err: any) {
    console.error("Dashboard filters error:", err);
    res.json({ models: [], providers: [] });
  }
});

// ── GET /dashboard/analytics ─────────────────────────────────
router.get("/analytics", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("model, tokens_used, cost, role, timestamp")
      .eq("user_id", userId)
      .order("timestamp", { ascending: true });

    const rows = messages || [];

    // Aggregate in a single pass
    let totalTokens = 0;
    let totalCost = 0;
    const modelMap: Record<string, { tokens: number; cost: number; messages: number; inputTokens: number; outputTokens: number; inputCost: number; outputCost: number }> = {};
    const dailyMap: Record<string, { tokens: number; cost: number; messages: number }> = {};

    for (const m of rows) {
      const tokens = m.tokens_used || 0;
      const cost = m.cost || 0;
      totalTokens += tokens;
      totalCost += cost;

      // Model breakdown
      const model = m.model || "unknown";
      const ms = modelMap[model] ??= { tokens: 0, cost: 0, messages: 0, inputTokens: 0, outputTokens: 0, inputCost: 0, outputCost: 0 };
      ms.tokens += tokens;
      ms.cost += cost;
      ms.messages++;
      if (m.role === "user") {
        ms.inputTokens += tokens;
        ms.inputCost += cost;
      } else {
        ms.outputTokens += tokens;
        ms.outputCost += cost;
      }

      // Daily breakdown
      const date = (m.timestamp || "").substring(0, 10);
      if (date) {
        const ds = dailyMap[date] ??= { tokens: 0, cost: 0, messages: 0 };
        ds.tokens += tokens;
        ds.cost += cost;
        ds.messages++;
      }
    }

    const modelBreakdown = Object.entries(modelMap).map(([model, stats]) => ({
      model,
      provider: getProvider(model),
      ...stats,
    }));

    // Provider breakdown from model breakdown
    const provBreak: Record<string, { tokens: number; cost: number; messages: number }> = {};
    for (const mb of modelBreakdown) {
      const ps = provBreak[mb.provider] ??= { tokens: 0, cost: 0, messages: 0 };
      ps.tokens += mb.tokens;
      ps.cost += mb.cost;
      ps.messages += mb.messages;
    }

    res.json({
      totalUsage: { tokens: totalTokens, cost: totalCost, messages: rows.length },
      modelBreakdown,
      providerBreakdown: Object.entries(provBreak).map(([provider, stats]) => ({ provider, ...stats })),
      dailyUsage: Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({ date, ...stats })),
    });
  } catch (err: any) {
    console.error("Dashboard analytics error:", err);
    res.json({
      totalUsage: { tokens: 0, cost: 0, messages: 0 },
      modelBreakdown: [],
      providerBreakdown: [],
      dailyUsage: [],
    });
  }
});

export { router as dashboardRoutes };
