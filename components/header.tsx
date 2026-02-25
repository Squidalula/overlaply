import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "./avatar";
import { ThemeToggle } from "./theme-toggle";
import { logout } from "@/lib/actions/auth";
import Link from "next/link";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Overlaply</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar
                  nickname={user.nickname}
                  avatarUrl={user.avatarUrl}
                  avatarColor={user.avatarColor}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user.nickname}
                </span>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
