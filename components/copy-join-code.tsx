"use client";

import { useState } from "react";

interface CopyJoinCodeProps {
  code: string;
  variant?: "full" | "compact";
}

export function CopyJoinCode({ code, variant = "full" }: CopyJoinCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/groups/join?code=${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleCopy}
        className="mt-3 text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
      >
        {copied ? "✓ Link copied!" : `Code: ${code}`}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-3 w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
    >
      <span className="text-sm text-gray-500 dark:text-gray-400">Join code:</span>
      <code className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-widest">
        {code}
      </code>
      <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:hidden">
        Click to copy invite link
      </span>
      <span className="text-xs text-indigo-500 dark:text-indigo-400 hidden group-hover:inline">
        {copied ? "✓ Copied!" : "📋 Copy link"}
      </span>
    </button>
  );
}
