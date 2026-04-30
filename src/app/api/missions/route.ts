import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/missions?agentId=xxx  -> missions for one agent
 * GET /api/missions               -> all missions
 */
export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId");

  try {
    const missions = await prisma.mission.findMany({
      where: agentId ? { agentId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ missions });
  } catch {
    return NextResponse.json({ missions: [] });
  }
}
