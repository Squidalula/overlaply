import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar";
import { CopyJoinCode } from "@/components/copy-join-code";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await db.groupMembership.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: { user: true },
          },
          events: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { group: { createdAt: "desc" } },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Groups</h1>
          <div className="flex gap-2">
            <Link
              href="/groups/join"
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
            >
              Join Group
            </Link>
            <Link
              href="/groups/new"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Create Group
            </Link>
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No groups yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create a new group or join an existing one to start scheduling
              events.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/groups/join"
                className="px-5 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
              >
                Join a Group
              </Link>
              <Link
                href="/groups/new"
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create a Group
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {memberships.map(({ group, role }) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {group.name}
                  </h3>
                  {role === "admin" && (
                    <span className="px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 5).map((m) => (
                      <Avatar
                        key={m.userId}
                        nickname={m.user.nickname}
                        avatarUrl={m.user.avatarUrl}
                        avatarColor={m.user.avatarColor}
                        size="sm"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {group.members.length} member
                    {group.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {group.events[0] && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Latest: {group.events[0].name}
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                        group.events[0].status === "finalized"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {group.events[0].status}
                    </span>
                  </div>
                )}
                <CopyJoinCode code={group.joinCode} variant="compact" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
