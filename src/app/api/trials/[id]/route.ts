import { getTrial } from "@/lib/store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/trials/[id]">,
) {
  const trial = getTrial((await ctx.params).id);
  if (!trial) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(trial);
}
