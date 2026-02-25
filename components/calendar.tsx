"use client";

import { useState, useTransition } from "react";
import { saveAvailability } from "@/lib/actions/events";

interface CalendarProps {
  eventId: string;
  year: number;
  month: number; // 0-indexed
  initialSelectedDates: string[];
  availabilityCounts: Record<string, number>;
  totalMembers: number;
  memberAvailability: Record<string, string[]>;
  disabled?: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({
  eventId,
  year,
  month,
  initialSelectedDates,
  availabilityCounts,
  totalMembers,
  memberAvailability,
  disabled = false,
}: CalendarProps) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    new Set(initialSelectedDates)
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getDateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const toggleDate = (day: number) => {
    if (disabled) return;
    const dateStr = getDateKey(day);
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await saveAvailability(eventId, Array.from(selectedDates));
      setSaved(true);
    });
  };

  const getAvailabilityColor = (count: number) => {
    if (count === 0) return "";
    const ratio = count / totalMembers;
    if (ratio === 1) return "ring-2 ring-emerald-400 bg-emerald-50 dark:bg-emerald-950/40";
    if (ratio >= 0.7) return "ring-2 ring-lime-400 bg-lime-50 dark:bg-lime-950/40";
    if (ratio >= 0.4) return "ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/40";
    return "ring-2 ring-gray-300 dark:ring-gray-600 bg-gray-50 dark:bg-gray-800";
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = getDateKey(day);
          const isSelected = selectedDates.has(dateStr);
          const count = availabilityCounts[dateStr] || 0;
          const names = memberAvailability[dateStr] || [];

          return (
            <button
              key={day}
              onClick={() => toggleDate(day)}
              disabled={disabled}
              title={
                names.length > 0
                  ? `Available: ${names.join(", ")}`
                  : "No one available yet"
              }
              className={`
                relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all
                ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-105 active:scale-95"}
                ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md"
                    : `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 ${getAvailabilityColor(count)}`
                }
              `}
            >
              <span className="font-medium">{day}</span>
              {count > 0 && !isSelected && (
                <span className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                  {count}/{totalMembers}
                </span>
              )}
              {count > 0 && isSelected && (
                <span className="text-[10px] leading-tight text-indigo-200">
                  {count}/{totalMembers}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!disabled && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Availability"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">
              ✓ Saved!
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-indigo-600" />
          <span className="text-gray-600 dark:text-gray-400">Your selection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-400" />
          <span className="text-gray-600 dark:text-gray-400">All available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-400" />
          <span className="text-gray-600 dark:text-gray-400">Some available</span>
        </div>
      </div>
    </div>
  );
}
