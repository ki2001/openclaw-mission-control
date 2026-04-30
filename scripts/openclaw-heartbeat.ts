#!/usr/bin/env tsx
/**
 * OpenClaw Heartbeat — sends agent state to Mission Control dashboard.
 *
 * Usage:
 *   npx tsx scripts/openclaw-heartbeat.ts \
 *     --agent-id dev \
 *     --agent-name "Dev Agent" \
 *     --agent-emoji "🔧" \
 *     --agent-role "Engineering"
 *
 * Env vars:
 *   INTERNAL_API_SECRET  — required, shared secret for dashboard auth
 *   DASHBOARD_URL        — optional, defaults to http://localhost:3000
 *
 * Sends a POST every 30 seconds with current agent status.
 * Gracefully shuts down on SIGINT/SIGTERM.
 */

// --- Config ---
const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3000";
const HEARTBEAT_INTERVAL_MS = 30_000;

// --- Parse CLI args ---
function parseArgs(): { agentId: string; agentName: string; agentEmoji: string; agentRole: string } {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const val = args[i + 1];
    if (key && val) parsed[key] = val;
  }

  if (!parsed["agent-id"]) {
    console.error("Error: --agent-id is required");
    process.exit(1);
  }

  return {
    agentId: parsed["agent-id"],
    agentName: parsed["agent-name"] || parsed["agent-id"],
    agentEmoji: parsed["agent-emoji"] || "🤖",
    agentRole: parsed["agent-role"] || "Agent",
  };
}

// --- Gather stats (simplified — reads from process metrics) ---
function gatherStats() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    tasksCompleted: Math.floor(uptime / 60), // rough proxy: 1 task per minute uptime
    totalCost: 0, // agents should report real costs via their own heartbeat
    currentTask: `Heartbeat active (uptime: ${Math.floor(uptime)}s, mem: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB)`,
    status: "online" as const,
  };
}

// --- Send heartbeat ---
async function sendHeartbeat(config: ReturnType<typeof parseArgs>) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.error("Error: INTERNAL_API_SECRET env var is required");
    process.exit(1);
  }

  const stats = gatherStats();
  const now = new Date().toISOString();

  const payload = {
    id: config.agentId,
    name: config.agentName,
    emoji: config.agentEmoji,
    role: config.agentRole,
    status: stats.status,
    tasksCompleted: stats.tasksCompleted,
    totalCost: stats.totalCost,
    currentTask: stats.currentTask,
    recentActivity: [
      { timestamp: now, message: `Heartbeat sent (pid ${process.pid})` },
    ],
  };

  try {
    const res = await fetch(`${DASHBOARD_URL}/api/agents/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`[${new Date().toLocaleTimeString()}] Heartbeat OK — ${config.agentId}`);
    } else if (res.status === 429) {
      console.log(`[${new Date().toLocaleTimeString()}] Rate limited — backing off`);
    } else {
      console.error(`[${new Date().toLocaleTimeString()}] Heartbeat failed: ${res.status}`);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Heartbeat error:`, (err as Error).message);
  }
}

// --- Main ---
const config = parseArgs();
console.log(`Starting heartbeat for ${config.agentId} -> ${DASHBOARD_URL}`);
console.log(`Interval: ${HEARTBEAT_INTERVAL_MS / 1000}s | PID: ${process.pid}`);

// Send first heartbeat immediately
sendHeartbeat(config);

// Schedule recurring heartbeats
const interval = setInterval(() => sendHeartbeat(config), HEARTBEAT_INTERVAL_MS);

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down heartbeat for ${config.agentId}...`);
  clearInterval(interval);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
