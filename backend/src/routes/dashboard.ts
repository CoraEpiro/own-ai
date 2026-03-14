import express from "express";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../config";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getUserUsage } from "../services/databaseService";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const router = express.Router();

// ── GET /dashboard ───────────────────────────────────────────
router.get("/", authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const stats = await getUserUsage(userId);
  res.json(stats);
});

// ── GET /dashboard/filters ───────────────────────────────────
// Returns available models and providers the user has used
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
    const providerMap: Record<string, string> = {
      "gpt-4o": "OpenAI",
      "gpt-4o-mini": "OpenAI",
      "claude-sonnet-4-20250514": "Anthropic",
      "claude-haiku-4-5-20251001": "Anthropic",
      "gemini-2.0-flash": "Google",
    };

    (messages || []).forEach((m: any) => {
      if (m.model) modelSet.add(m.model);
    });

    const models = Array.from(modelSet);
    const providerSet = new Set(models.map(m => providerMap[m] || "Unknown"));

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

    // Total usage
    const totalTokens = rows.reduce((s, m) => s + (m.tokens_used || 0), 0);
    const totalCost = rows.reduce((s, m) => s + (m.cost || 0), 0);

    // Model breakdown
    const modelMap: Record<string, { tokens: number; cost: number; messages: number; inputTokens: number; outputTokens: number; inputCost: number; outputCost: number }> = {};
    const providerMap: Record<string, string> = {
      "gpt-4o": "OpenAI",
      "gpt-4o-mini": "OpenAI",
      "claude-sonnet-4-20250514": "Anthropic",
      "claude-haiku-4-5-20251001": "Anthropic",
      "gemini-2.0-flash": "Google",
    };

    for (const m of rows) {
      const model = m.model || "unknown";
      if (!modelMap[model]) {
        modelMap[model] = { tokens: 0, cost: 0, messages: 0, inputTokens: 0, outputTokens: 0, inputCost: 0, outputCost: 0 };
      }
      modelMap[model].tokens += m.tokens_used || 0;
      modelMap[model].cost += m.cost || 0;
      modelMap[model].messages += 1;
      if (m.role === "user") {
        modelMap[model].inputTokens += m.tokens_used || 0;
        modelMap[model].inputCost += m.cost || 0;
      } else {
        modelMap[model].outputTokens += m.tokens_used || 0;
        modelMap[model].outputCost += m.cost || 0;
      }
    }

    const modelBreakdown = Object.entries(modelMap).map(([model, stats]) => ({
      model,
      provider: providerMap[model] || "Unknown",
      ...stats,
    }));

    // Provider breakdown
    const provBreak: Record<string, { tokens: number; cost: number; messages: number }> = {};
    for (const mb of modelBreakdown) {
      if (!provBreak[mb.provider]) provBreak[mb.provider] = { tokens: 0, cost: 0, messages: 0 };
      provBreak[mb.provider].tokens += mb.tokens;
      provBreak[mb.provider].cost += mb.cost;
      provBreak[mb.provider].messages += mb.messages;
    }
    const providerBreakdown = Object.entries(provBreak).map(([provider, stats]) => ({ provider, ...stats }));

    // Daily usage
    const dailyMap: Record<string, { tokens: number; cost: number; messages: number }> = {};
    for (const m of rows) {
      const date = (m.timestamp || "").substring(0, 10);
      if (!date) continue;
      if (!dailyMap[date]) dailyMap[date] = { tokens: 0, cost: 0, messages: 0 };
      dailyMap[date].tokens += m.tokens_used || 0;
      dailyMap[date].cost += m.cost || 0;
      dailyMap[date].messages += 1;
    }
    const dailyUsage = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats }));

    res.json({
      totalUsage: { tokens: totalTokens, cost: totalCost, messages: rows.length },
      modelBreakdown,
      providerBreakdown,
      dailyUsage,
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
