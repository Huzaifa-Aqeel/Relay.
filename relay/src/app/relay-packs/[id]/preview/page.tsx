import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import SubstituteRelayPack from "@/components/substitute-relay-pack";
import type { RelayPackContent } from "@/types";

export default async function RelayPackPreviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pack = await prisma.relayPack.findFirst({
    where: { id: params.id, absence: { teacherId: user.id } },
    include: { class: true }
  });
  if (!pack) notFound();

  const substituteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/substitute/${pack.secureToken}`;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <span className="label-eyebrow">
          {pack.status === "sent" ? "Sent — handover received" : "Approved — shareable"}
        </span>
        <code className="text-xs bg-primary-light/40 px-2 py-1 rounded font-mono truncate max-w-[260px]">
          {substituteUrl}
        </code>
      </div>
      <SubstituteRelayPack
        className={pack.class.className}
        section={pack.class.section}
        content={pack.relayPackJson as unknown as RelayPackContent}
        token={pack.secureToken}
        alreadySubmitted={false}
        preview
      />
    </main>
  );
}
