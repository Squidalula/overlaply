"use client";

import { useActionState } from "react";
import { createGroup } from "@/lib/actions/groups";
import Link from "next/link";

export default function CreateGroupPage() {
  const [state, formAction, pending] = useActionState(createGroup, null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 inline-block"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Create a Group
        </h1>
        <form
          action={formAction}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6"
        >
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Group name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            placeholder='e.g., "Monthly Dinner Crew"'
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {state?.error && (
            <p className="mt-2 text-sm text-red-600">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
