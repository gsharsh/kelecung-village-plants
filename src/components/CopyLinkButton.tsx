"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CopyLinkButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function CopyLinkButton({
  value,
  label = "Copy link",
  copiedLabel = "Copied",
  className,
  disabled = false,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn("primary-btn whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60", className)}
      disabled={disabled}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
