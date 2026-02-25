"use client";

import { useState, useTransition } from "react";
import { finalizeEvent, reopenEvent } from "@/lib/actions/events";

interface EventActionsProps {
  eventId: string;
  status: string;
  isAdmin: boolean;
  topDateStr?: string;
}

export function EventActions({
  eventId,
  status,
  isAdmin,
  topDateStr,
}: EventActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState(topDateStr || "");

  if (!isAdmin) return null;

  if (status === "finalized") {
    return (
      <button
        onClick={() => startTransition(async () => { await reopenEvent(eventId); })}
        disabled={isPending}
        className="px-5 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors disabled:opacity-50"
      >
        {isPending ? "Reopening..." : "Reopen Voting"}
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800"
      />
      <button
        onClick={() => {
          if (!selectedDate) return;
          startTransition(async () => { await finalizeEvent(eventId, selectedDate); });
        }}
        disabled={isPending || !selectedDate}
        className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
      >
        {isPending ? "Finalizing..." : "✓ Finalize This Date"}
      </button>
    </div>
  );
}
