import { createReadStream, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { DATA_DIR, getTrial } from "@/lib/store";

// Serves a claim's recorded desktop MP4, with range support so the browser can seek.
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/trials/[id]/video/[claimId]">,
) {
  const { id, claimId } = await ctx.params;
  const video = getTrial(id)?.claims.find((c) => c.id === claimId)?.video;
  if (!video) return new Response("no recording", { status: 404 });
  const file = join(DATA_DIR, video);
  const size = statSync(file).size;
  const range = request.headers.get("range")?.match(/bytes=(\d+)-(\d*)/);
  const start = range ? Number(range[1]) : 0;
  const end = range?.[2] ? Number(range[2]) : size - 1;
  const stream = Readable.toWeb(
    createReadStream(file, { start, end }),
  ) as ReadableStream;
  return new Response(stream, {
    status: range ? 206 : 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
    },
  });
}
