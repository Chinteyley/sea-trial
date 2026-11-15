import { listTrials } from "@/lib/store";
import { startTrial } from "@/lib/trial";

export async function GET() {
  return Response.json(listTrials());
}

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url?: string };
  if (!url || !URL.canParse(url) || !/^https?:/.test(url)) {
    return Response.json({ error: "Give a full http(s) URL" }, { status: 400 });
  }
  return Response.json(startTrial(url), { status: 201 });
}
