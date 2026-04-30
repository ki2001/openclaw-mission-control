# OpenClaw Mission Control

A web dashboard template for running and monitoring your OpenClaw AI agents.
Inspired by Max HQ, the mission control that powers everything built by
[@sharbelxyz](https://x.com/sharbelxyz).

> **Featured in:** "OpenClaw is 10x Better With This Mission Control Setup"
> ([@Sharbelxyz on YouTube](https://www.youtube.com/@Sharbelxyz))

## What this is

If you're running multiple AI agents (content writer, research analyst,
trading bot, inbox triage, growth scout…), you quickly end up with a dozen
terminals, a dozen log files, and no single place that answers:

- Which of my agents are online right now?
- What is each one doing?
- How much have they cost me this month?
- Where are the ideas they queued up for me to review?
- What's in my missions backlog?

That's what this dashboard is for. Every OpenClaw agent posts its state to
one endpoint (`POST /api/agents/state`), and the dashboard shows you the
entire stack at a glance.

## Stack

- **Next.js 16** (App Router, React 19)
- **Prisma 6** on SQLite (local) — also supports Postgres
- **Tailwind CSS v4**
- **HTTP Basic Auth** — dashboard protected with username/password
- **Rate limiting** — 1 req/sec per agent on POST endpoint
- **Zod validation** — input schemas enforced on agent state updates
- **Auto-refresh** — dashboard polls every 15 seconds

## Quick start

```bash
# 1. Clone
git clone https://github.com/sharbelxyz/openclaw-mission-control.git
cd openclaw-mission-control

# 2. Install
npm install

# 3. Copy env and fill in values
cp .env.example .env
# Edit .env - at minimum you need DATABASE_URL and INTERNAL_API_SECRET

# 4. Push schema to your db
npx prisma db push

# 5. Seed demo agents so the dashboard isn't empty
npm run seed:demo

# 6. Run it
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Wiring your OpenClaw agents to it

Every agent sends a heartbeat. Minimal Python example:

```python
import os
import requests

requests.post(
    "http://localhost:3000/api/agents/state",
    headers={"Authorization": f"Bearer {os.environ['INTERNAL_API_SECRET']}"},
    json={
        "id": "my-content-agent",
        "name": "Content Writer",
        "emoji": "✍️",
        "role": "Content",
        "status": "working",
        "currentTask": "Drafting thread about agent workflows",
        "tasksCompleted": 42,
        "totalCost": 3.14,
    },
)
```

Or TypeScript:

```ts
await fetch("http://localhost:3000/api/agents/state", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
  },
  body: JSON.stringify({
    id: "my-content-agent",
    name: "Content Writer",
    status: "working",
    currentTask: "Drafting thread about agent workflows",
    tasksCompleted: 42,
    totalCost: 3.14,
  }),
});
```

That's it. The dashboard picks up the update on next refresh.

## Customizing

This repo is **intentionally minimal** - a dashboard shell with one generic
agents table. The idea is you send your OpenClaw agent at this codebase with
the `BOOTSTRAP.md` file and it extends the dashboard for *your* stack.

Want trading PnL cards? Newsletter analytics? YouTube performance? Wire your
own agent to fetch it, post to a new route, and render it on a new page. The
scaffolding is here; the personality is yours.

See `BOOTSTRAP.md` for the onboarding flow designed for OpenClaw agents.
See `CLAUDE.md` for notes if you're editing this with Claude Code.

## Deploying

For local deployment (recommended):

```bash
npm run dev
# Dashboard available at http://localhost:3000
# Login: admin / DASHBOARD_PASSWORD from .env
```

## License

MIT. Fork it. Build something wild.
