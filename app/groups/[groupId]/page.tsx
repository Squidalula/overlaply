import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar";
import { CopyJoinCode } from "@/components/copy-join-code";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await requireUser();

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: true },
      },
      events: {
        orderBy: { createdAt: "desc" },
        include: {
          availability: true,
        },
      },
    },
  });

  if (!group) notFound();

  const membership = group.members.find((m) => m.userId === user.id);
  if (!membership) notFound();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block"
        >
          ← All groups
        </Link>

        {/* Group Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
            {membership.role === "admin" && (
              <span className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-full">
                Admin
              </span>
            )}
          </div>

          <CopyJoinCode code={group.joinCode} />
        </div>

        {/* Members */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Members ({group.members.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {group.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <Avatar
                  nickname={m.user.nickname}
                  avatarUrl={m.user.avatarUrl}
                  avatarColor={m.user.avatarColor}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {m.user.nickname}
                </span>
                {m.role === "admin" && (
                  <span className="text-xs text-indigo-500">admin</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Events</h2>
          <Link
            href={`/groups/${groupId}/events/new`}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Event
          </Link>
        </div>

        {group.events.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No events yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {group.events.map((event) => {
              const voterIds = new Set(
                event.availability.map((a) => a.userId)
              );
              const voterCount = voterIds.size;
              const startDate = new Date(event.dateRangeStart);
              const monthName = startDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              });

              return (
                <Link
                  key={event.id}
                  href={`/groups/${groupId}/events/${event.id}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {event.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{monthName}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        event.status === "finalized"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {event.status === "finalized" ? "✓ Finalized" : "Voting"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      {voterCount}/{group.members.length} voted
                    </span>
                    {event.status === "finalized" && event.finalDate && (
                      <span className="text-emerald-600 font-medium">
                        📅{" "}
                        {new Date(event.finalDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
