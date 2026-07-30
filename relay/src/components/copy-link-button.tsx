"use client";

import { useState } from "react";

export default function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/substitute/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — fail quietly,
      // the Preview page still has the link visible/copyable as a fallback.
    }
  }

  return (
    <button onClick={copy} className="text-sm text-primary hover:underline whitespace-nowrap">
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}
