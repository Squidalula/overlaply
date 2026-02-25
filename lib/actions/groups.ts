"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateJoinCode } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function createGroup(
  _prevState: unknown,
  formData: FormData
) {
  const user = await requireUser();
  const name = (formData.get("name") as string)?.trim();

  if (!name || name.length < 2) {
    return { error: "Group name must be at least 2 characters." };
  }

  let joinCode = generateJoinCode();
  let existing = await db.group.findUnique({ where: { joinCode } });
  while (existing) {
    joinCode = generateJoinCode();
    existing = await db.group.findUnique({ where: { joinCode } });
  }

  const group = await db.group.create({
    data: {
      name,
      joinCode,
      createdBy: user.id,
      members: {
        create: {
          userId: user.id,
          role: "admin",
        },
      },
    },
  });

  redirect(`/groups/${group.id}`);
}

export async function joinGroup(
  _prevState: unknown,
  formData: FormData
) {
  const user = await requireUser();
  const code = (formData.get("code") as string)?.trim().toUpperCase();

  if (!code || code.length !== 6) {
    return { error: "Please enter a valid 6-character join code." };
  }

  const group = await db.group.findUnique({ where: { joinCode: code } });
  if (!group) {
    return { error: "No group found with that code." };
  }

  const existing = await db.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
  });

  if (existing) {
    redirect(`/groups/${group.id}`);
  }

  await db.groupMembership.create({
    data: {
      userId: user.id,
      groupId: group.id,
      role: "member",
    },
  });

  redirect(`/groups/${group.id}`);
}
