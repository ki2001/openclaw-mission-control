"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

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
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "online" || status === "working"
      ? "bg-emerald-500"
      : status === "error"
      ? "bg-red-500"
      : status === "idle"
      ? "bg-amber-500"
      : "bg-zinc-600";
  return <div className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}

export function AgentGrid() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/state", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
        setLastUpdated(new Date());
      }
    } catch {
      // silently fail — will retry on next poll
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString()
    : "loading...";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Agents</h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--ink-3)]">
            Last updated: {timeStr}
          </span>
          <Link href="/agents" className="text-[13px] text-[var(--ink-2)] hover:text-[var(--ink)]">
            View all →
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {agents.slice(0, 6).map((a) => (
          <Link
            key={a.id}
            href={`/agents/${a.id}`}
            className="p-4 rounded-xl flex items-center gap-3 hover:bg-[#1a1a1a] transition-colors"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <div className="text-2xl">{a.emoji || "🤖"}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-[14px] truncate">{a.name}</div>
                <StatusDot status={a.status} />
              </div>
              <div className="text-[12px] text-[var(--ink-3)] truncate">
                {a.currentTask || a.role || "Idle"}
              </div>
            </div>
            <div className="text-right text-[12px] text-[var(--ink-3)]">
              <div>{a.tasksCompleted} tasks</div>
              <div>${(a.totalCost || 0).toFixed(2)}</div>
            </div>
          </Link>
        ))}
        {agents.length === 0 && (
          <div className="col-span-2 p-6 text-center text-[var(--ink-3)]">
            No agents reporting yet.
          </div>
        )}
      </div>
    </div>
  );
}
