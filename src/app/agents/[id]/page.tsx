"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, DollarSign, CheckCircle, Clock } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string | null;
  role: string | null;
  status: string;
  tasksCompleted: number;
  totalCost: number;
  currentTask: string | null;
  lastActive: string | null;
  recentActivity: Array<{ timestamp: string; message: string }> | null;
}

interface Mission {
  id: string;
  agentId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  completedAt: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "bg-emerald-500/20 text-emerald-400",
    working: "bg-emerald-500/20 text-emerald-400",
    idle: "bg-amber-500/20 text-amber-400",
    offline: "bg-zinc-500/20 text-zinc-400",
    error: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${colors[status] || colors.offline}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-amber-500/20 text-amber-400",
    low: "bg-zinc-500/20 text-zinc-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${colors[priority] || colors.medium}`}>
      {priority}
    </span>
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [agentRes, missionsRes] = await Promise.all([
        fetch("/api/agents/state", { cache: "no-store" }),
        fetch(`/api/missions?agentId=${agentId}`, { cache: "no-store" }),
      ]);

      if (agentRes.ok) {
        const data = await agentRes.json();
        const found = (data.agents || []).find((a: Agent) => a.id === agentId);
        if (found) {
          setAgent(found);
          setNotFound(false);
        } else if (!agent) {
          setNotFound(true);
        }
      }

      if (missionsRes.ok) {
        const mdata = await missionsRes.json();
        setMissions(mdata.missions || []);
      }

      setLastUpdated(new Date());
    } catch {
      // silently retry on next poll
    }
  }, [agentId, agent]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (notFound) {
    return (
      <div className="p-8 max-w-[900px] mx-auto">
        <Link href="/agents" className="text-[13px] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to agents
        </Link>
        <div className="p-8 text-center text-[var(--ink-3)]">
          Agent not found.
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-8 max-w-[900px] mx-auto">
        <Link href="/agents" className="text-[13px] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to agents
        </Link>
        <div className="p-8 text-center text-[var(--ink-3)]">Loading...</div>
      </div>
    );
  }

  const activity = Array.isArray(agent.recentActivity) ? agent.recentActivity : [];
  const timeStr = lastUpdated ? lastUpdated.toLocaleTimeString() : "loading...";

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <Link href="/agents" className="text-[13px] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to agents
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="text-4xl">{agent.emoji || "🤖"}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{agent.name}</h1>
            <StatusBadge status={agent.status} />
          </div>
          <div className="text-[14px] text-[var(--ink-2)]">
            {agent.role || "No role assigned"}
          </div>
        </div>
        <span className="text-[11px] text-[var(--ink-3)] mt-2">
          Last updated: {timeStr}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-3)] mb-1">
            <CheckCircle className="w-3.5 h-3.5" /> Tasks completed
          </div>
          <div className="text-[22px] font-semibold">{agent.tasksCompleted}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-3)] mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Total cost
          </div>
          <div className="text-[22px] font-semibold">${(agent.totalCost || 0).toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-3)] mb-1">
            <Clock className="w-3.5 h-3.5" /> Last active
          </div>
          <div className="text-[14px] font-medium">
            {agent.lastActive ? new Date(agent.lastActive).toLocaleString() : "never"}
          </div>
        </div>
      </div>

      {/* Current task */}
      {agent.currentTask && (
        <div className="mb-8 p-4 rounded-xl" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
          <div className="text-[11px] uppercase tracking-wider text-[var(--ink-3)] mb-2">Current task</div>
          <div className="text-[14px] flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            {agent.currentTask}
          </div>
        </div>
      )}

      {/* Activity timeline */}
      <div className="mb-8">
        <h2 className="text-[16px] font-semibold mb-4">Activity Timeline</h2>
        {activity.length === 0 ? (
          <div className="p-4 text-[13px] text-[var(--ink-3)] rounded-xl" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
            No activity recorded yet.
          </div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px" style={{ background: "var(--line)" }} />
            {activity.map((item, i) => (
              <div key={i} className="mb-4 relative">
                <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                <div className="text-[11px] text-[var(--ink-3)] mb-0.5">{item.timestamp}</div>
                <div className="text-[13px] text-[var(--ink-2)]">{item.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missions for this agent */}
      <div>
        <h2 className="text-[16px] font-semibold mb-4">Missions</h2>
        {missions.length === 0 ? (
          <div className="p-4 text-[13px] text-[var(--ink-3)] rounded-xl" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
            No missions assigned to this agent.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {missions.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl flex items-center gap-4"
                style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[14px]">{m.title}</div>
                  <div className="text-[12px] text-[var(--ink-3)]">{m.description}</div>
                </div>
                <PriorityBadge priority={m.priority} />
                <span className="text-[12px] text-[var(--ink-2)]">{m.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
