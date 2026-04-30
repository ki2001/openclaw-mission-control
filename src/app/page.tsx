import { prisma } from "@/lib/prisma";
import { Bot, ListTodo, Lightbulb, Activity } from "lucide-react";
import { AgentGrid } from "@/components/agent-grid";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [agents, pendingMissions, pendingIdeas] = await Promise.all([
      prisma.agentState.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.mission.count({ where: { status: "pending" } }),
      prisma.idea.count({ where: { status: "pending" } }),
    ]);
    const online = agents.filter((a) => a.status === "online" || a.status === "working").length;
    const totalCost = agents.reduce((s, a) => s + (a.totalCost || 0), 0);
    const totalTasks = agents.reduce((s, a) => s + (a.tasksCompleted || 0), 0);
    return { agents, online, total: agents.length, totalCost, totalTasks, pendingMissions, pendingIdeas };
  } catch {
    return { agents: [], online: 0, total: 0, totalCost: 0, totalTasks: 0, pendingMissions: 0, pendingIdeas: 0 };
  }
}

export default async function HomePage() {
  const s = await getStats();
  const empty = s.total === 0;

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <h1 className="text-[32px] font-semibold tracking-[-0.02em] mb-2">Mission Control</h1>
      <p className="text-[var(--ink-2)] mb-8">
        Every agent in your OpenClaw stack, at a glance.
      </p>

      {empty && (
        <div
          className="mb-6 p-5 rounded-xl"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <div className="text-[14px] font-medium mb-1">No agents yet.</div>
          <div className="text-[13px] text-[var(--ink-2)]">
            Run{" "}
            <code className="px-1.5 py-0.5 rounded" style={{ background: "#000", color: "var(--accent)" }}>
              npm run seed:demo
            </code>{" "}
            to populate sample agents, or wire your OpenClaw agents to POST to{" "}
            <code className="px-1.5 py-0.5 rounded" style={{ background: "#000" }}>/api/agents/state</code>.
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Kpi icon={<Bot className="w-4 h-4" />} label="Agents online" value={`${s.online} / ${s.total}`} />
        <Kpi icon={<Activity className="w-4 h-4" />} label="Tasks completed" value={s.totalTasks.toLocaleString()} />
        <Kpi icon={<ListTodo className="w-4 h-4" />} label="Pending missions" value={String(s.pendingMissions)} />
        <Kpi icon={<Lightbulb className="w-4 h-4" />} label="Ideas to review" value={String(s.pendingIdeas)} />
      </div>

      {/* Client-side agent grid with auto-refresh every 15s */}
      <AgentGrid />
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="p-4 rounded-xl flex flex-col gap-1"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-3)]">
        {icon}
        {label}
      </div>
      <div className="text-[22px] font-semibold tracking-[-0.01em]">{value}</div>
    </div>
  );
}
