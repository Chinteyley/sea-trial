import type { Verdict } from "@/lib/types";

export const VERDICT_STYLE: Record<
  Verdict,
  { label: string; text: string; ring: string }
> = {
  verified: {
    label: "Verified",
    text: "text-verified",
    ring: "border-verified",
  },
  partial: { label: "Partial", text: "text-partial", ring: "border-partial" },
  failed: { label: "Failed", text: "text-failed", ring: "border-failed" },
  untestable: {
    label: "Untestable",
    text: "text-untestable",
    ring: "border-untestable",
  },
};
