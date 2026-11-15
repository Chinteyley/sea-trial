import { desktopUrl } from "@/lib/boat";
import { getTrial } from "@/lib/store";

// A fresh, short-lived desktop stream URL for one claim's sandbox, asked for when the wall mounts.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/trials/[id]/desktop/[claimId]">,
) {
  const { id, claimId } = await ctx.params;
  const claim = getTrial(id)?.claims.find((c) => c.id === claimId);
  if (!claim?.sandboxId)
    return Response.json({ error: "no sandbox yet" }, { status: 404 });
  try {
    return Response.json({ url: await desktopUrl(claim.sandboxId) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
