import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar";
import { Calendar } from "@/components/calendar";
import { EventActions } from "@/components/event-actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateKey } from "@/lib/utils";

export default async function EventPage({
  params,
}: {
  params: Promise<{ groupId: string; eventId: string }>;
}) {
  const { groupId, eventId } = await params;
  const user = await requireUser();

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      group: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
      availability: {
        include: { user: true },
      },
      creator: true,
    },
  });

  if (!event || event.groupId !== groupId) notFound();

  const membership = event.group.members.find((m) => m.userId === user.id);
  if (!membership) notFound();

  const isAdmin = membership.role === "admin";
  const totalMembers = event.group.members.length;

  // Current user's selected dates
  const userAvailability = event.availability.filter(
    (a) => a.userId === user.id && a.isAvailable
  );
  const userSelectedDates = userAvailability.map((a) =>
    formatDateKey(new Date(a.date))
  );

  // Availability counts per date
  const availabilityCounts: Record<string, number> = {};
  const memberAvailability: Record<string, string[]> = {};

  for (const a of event.availability) {
    if (!a.isAvailable) continue;
    const key = formatDateKey(new Date(a.date));
    availabilityCounts[key] = (availabilityCounts[key] || 0) + 1;
    if (!memberAvailability[key]) memberAvailability[key] = [];
    memberAvailability[key].push(a.user.nickname);
  }

  // Voting status
  const voterIds = new Set(event.availability.map((a) => a.userId));
  const voterCount = voterIds.size;
  const voters = event.group.members.filter((m) => voterIds.has(m.userId));
  const nonVoters = event.group.members
    .filter((m) => !voterIds.has(m.userId))
    .map((m) => m.user);

  // Calculate results - ranked dates
  const dateResults = Object.entries(availabilityCounts)
    .map(([date, count]) => ({
      date,
      count,
      available: memberAvailability[date] || [],
      unavailable: event.group.members
        .filter(
          (m) => !(memberAvailability[date] || []).includes(m.user.nickname)
        )
        .map((m) => m.user.nickname),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.date.localeCompare(b.date);
    });

  const startDate = new Date(event.dateRangeStart);
  const calYear = startDate.getUTCFullYear();
  const calMonth = startDate.getUTCMonth();
  const monthName = startDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const topDateStr = dateResults[0]?.date || "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/groups/${groupId}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block"
        >
          ← Back to {event.group.name}
        </Link>

        {/* Event Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{event.name}</h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                event.status === "finalized"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
              }`}
            >
              {event.status === "finalized" ? "✓ Finalized" : "Voting Open"}
            </span>
          </div>
          {event.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-3">{event.description}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">📅 {monthName}</p>

          {event.status === "finalized" && event.finalDate && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                Final Date
              </p>
              <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
                {new Date(event.finalDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Voting Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Voting Status
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{
                  width: `${totalMembers > 0 ? (voterCount / totalMembers) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {voterCount} / {totalMembers}
            </span>
          </div>

          {/* Voted members */}
          {voters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {voters.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg"
                >
                  <Avatar
                    nickname={m.user.nickname}
                    avatarUrl={m.user.avatarUrl}
                    avatarColor={m.user.avatarColor}
                    size="sm"
                  />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {m.user.nickname}
                  </span>
                  <span className="text-emerald-400 text-xs">✓</span>
                </div>
              ))}
            </div>
          )}

          {nonVoters.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Waiting for:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {nonVoters.map((u) => u.nickname).join(", ")}
              </span>
            </p>
          )}
          {nonVoters.length === 0 && voterCount > 0 && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Everyone has voted!
            </p>
          )}
        </div>

        {/* Calendar */}
        {event.status === "voting" && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Your Availability
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Tap the days you&apos;re available, then save.
            </p>
            <Calendar
              eventId={eventId}
              year={calYear}
              month={calMonth}
              initialSelectedDates={userSelectedDates}
              availabilityCounts={availabilityCounts}
              totalMembers={totalMembers}
              memberAvailability={memberAvailability}
            />
          </div>
        )}

        {/* Results */}
        {dateResults.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Results
            </h2>
            <div className="space-y-3">
              {dateResults.slice(0, 10).map((result, i) => {
                const isPerfect = result.count === totalMembers;
                return (
                  <div
                    key={result.date}
                    className={`p-4 rounded-xl border ${
                      i === 0
                        ? isPerfect
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                          : "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30"
                        : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {i === 0 && (
                          <span className="text-xs font-medium text-white bg-indigo-600 px-2 py-0.5 rounded-full">
                            Best Match
                          </span>
                        )}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {new Date(
                            result.date + "T00:00:00Z"
                          ).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPerfect ? "bg-emerald-500" : "bg-indigo-500"}`}
                            style={{
                              width: `${(result.count / totalMembers) * 100}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-bold whitespace-nowrap ${
                            isPerfect ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {result.count}/{totalMembers}
                          {isPerfect && " ✓"}
                        </span>
                      </div>
                    </div>
                    {result.unavailable.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Unavailable: {result.unavailable.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Admin Actions
            </h2>
            <EventActions
              eventId={eventId}
              status={event.status}
              isAdmin={isAdmin}
              topDateStr={topDateStr}
            />
          </div>
        )}
      </main>
    </div>
  );
}
