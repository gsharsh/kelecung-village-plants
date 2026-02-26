"use client";

import { useEffect, useState } from "react";
import { CopyLinkButton } from "@/components/CopyLinkButton";

interface PlantLinkShareProps {
  slug: string;
}

export function PlantLinkShare({ slug }: PlantLinkShareProps) {
  const [link, setLink] = useState(() => {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
    const path = `/plants/${slug}`;
    return siteUrl ? `${siteUrl}${path}` : path;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLink(window.location.href);
    }
  }, []);

  return (
    <section className="card-surface mt-6 p-5">
      <p className="text-sm font-semibold text-[var(--text-900)]">Share this plant page</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-[var(--surface-1)] px-3 py-2 text-xs text-[var(--text-700)] sm:text-sm">{link}</code>
        <CopyLinkButton value={link} label="Copy page link" className="px-3 py-2 text-sm" />
      </div>
    </section>
  );
}
