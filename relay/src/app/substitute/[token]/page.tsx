import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SubstituteRelayPack from "@/components/substitute-relay-pack";
import type { RelayPackContent } from "@/types";

export default async function SubstitutePage({ params }: { params: { token: string } }) {
  const pack = await prisma.relayPack.findUnique({
    where: { secureToken: params.token },
    include: { class: true, handovers: true }
  });

  // Draft packs (not yet approved by the teacher) and expired links are both
  // treated as not-found — a substitute should never see unapproved content.
  if (!pack || pack.status === "draft" || (pack.expiresAt && pack.expiresAt < new Date())) {
    notFound();
  }

  const alreadySubmitted = pack.handovers.length > 0;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <SubstituteRelayPack
        className={pack.class.className}
        section={pack.class.section}
        content={pack.relayPackJson as unknown as RelayPackContent}
        token={params.token}
        alreadySubmitted={alreadySubmitted}
      />
    </main>
  );
}
