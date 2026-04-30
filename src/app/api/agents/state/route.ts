import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Agent state endpoint.
 *
 *   GET  /api/agents/state              -> list all agents
 *   POST /api/agents/state              -> upsert one agent's state
 *
 * OpenClaw agents call POST here every N seconds with their current status.
 * Auth: requires `Authorization: Bearer <INTERNAL_API_SECRET>` header.
 * Rate limit: 1 request per second per agent ID.
 * Validation: Zod schema on recentActivity.
 */

// --- Rate limiter (in-memory, per agent ID) ---
const lastRequest = new Map<string, number>();

function isRateLimited(agentId: string): boolean {
  const now = Date.now();
  const last = lastRequest.get(agentId) || 0;
  if (now - last < 1000) {
    return true;
  }
  lastRequest.set(agentId, now);
  return false;
}

// --- Zod schemas ---
const RecentActivityItem = z.object({
  timestamp: z.string(),
  message: z.string(),
});

const RecentActivitySchema = z.array(RecentActivityItem).max(50);

const AgentStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  status: z.string().optional(),
  tasksCompleted: z.number().int().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
  currentTask: z.string().optional().nullable(),
  recentActivity: RecentActivitySchema.optional(),
});

// --- Auth ---
function checkAuth(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

// --- Handlers ---
export async function GET() {
  const agents = await prisma.agentState.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate with Zod
  const parsed = AgentStateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const body = parsed.data;

  // Rate limit: 1 req/sec per agent ID
  if (isRateLimited(body.id)) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": "1" } },
    );
  }

  const updated = await prisma.agentState.upsert({
    where: { id: body.id },
    create: {
      id: body.id,
      name: body.name,
      emoji: body.emoji ?? null,
      role: body.role ?? null,
      status: body.status ?? "offline",
      lastActive: new Date(),
      tasksCompleted: body.tasksCompleted ?? 0,
      totalCost: body.totalCost ?? 0,
      currentTask: body.currentTask ?? null,
      recentActivity: body.recentActivity ?? [],
    },
    update: {
      name: body.name,
      ...(body.emoji !== undefined && { emoji: body.emoji ?? null }),
      ...(body.role !== undefined && { role: body.role ?? null }),
      ...(body.status !== undefined && { status: body.status }),
      lastActive: new Date(),
      ...(body.tasksCompleted !== undefined && { tasksCompleted: body.tasksCompleted }),
      ...(body.totalCost !== undefined && { totalCost: body.totalCost }),
      ...(body.currentTask !== undefined && { currentTask: body.currentTask ?? null }),
      ...(body.recentActivity !== undefined && { recentActivity: body.recentActivity }),
    },
  });

  return NextResponse.json({ agent: updated });
}
