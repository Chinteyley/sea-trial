import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Masthead } from "@/components/Masthead";
import { TrialView } from "@/components/TrialView";
import { getTrial } from "@/lib/store";

export default function TrialPage({ params }: PageProps<"/trials/[id]">) {
  return (
    <>
      <Masthead />
      <Suspense>
        <Trial params={params} />
      </Suspense>
    </>
  );
}

async function Trial({
  params,
}: {
  params: PageProps<"/trials/[id]">["params"];
}) {
  const trial = getTrial((await params).id);
  if (!trial) notFound();
  return <TrialView initial={trial} />;
}
