"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createEvent(
  _prevState: unknown,
  formData: FormData
) {
  const user = await requireUser();
  const groupId = formData.get("groupId") as string;
  const name = (formData.get("name") as string)?.trim();
  const description =
    (formData.get("description") as string)?.trim() || null;
  const month = formData.get("month") as string; // "YYYY-MM"

  if (!name || name.length < 2) {
    return { error: "Event name must be at least 2 characters." };
  }

  if (!month) {
    return { error: "Please select a month." };
  }

  const membership = await db.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  });

  if (!membership) {
    return { error: "You are not a member of this group." };
  }

  const [year, monthNum] = month.split("-").map(Number);
  const dateRangeStart = new Date(Date.UTC(year, monthNum - 1, 1));
  const dateRangeEnd = new Date(Date.UTC(year, monthNum, 0));

  const event = await db.event.create({
    data: {
      groupId,
      name,
      description,
      dateRangeStart,
      dateRangeEnd,
      createdBy: user.id,
    },
  });

  redirect(`/groups/${groupId}/events/${event.id}`);
}

export async function saveAvailability(
  eventId: string,
  selectedDates: string[]
) {
  const user = await requireUser();

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { group: { include: { members: true } } },
  });

  if (!event) throw new Error("Event not found");
  if (event.status === "finalized") throw new Error("Event is finalized");

  const isMember = event.group.members.some((m) => m.userId === user.id);
  if (!isMember) throw new Error("Not a member");

  // Delete existing availability for this user and event
  await db.availability.deleteMany({
    where: { eventId, userId: user.id },
  });

  // Create new availability records
  if (selectedDates.length > 0) {
    await db.availability.createMany({
      data: selectedDates.map((dateStr) => ({
        eventId,
        userId: user.id,
        date: new Date(dateStr + "T00:00:00Z"),
        isAvailable: true,
      })),
    });
  }

  revalidatePath(`/groups/${event.groupId}/events/${eventId}`);
  return { success: true };
}

export async function finalizeEvent(eventId: string, date: string) {
  const user = await requireUser();

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      group: {
        include: { members: true },
      },
    },
  });

  if (!event) throw new Error("Event not found");

  const membership = event.group.members.find((m) => m.userId === user.id);
  if (!membership || membership.role !== "admin") {
    throw new Error("Only admins can finalize events");
  }

  await db.event.update({
    where: { id: eventId },
    data: {
      status: "finalized",
      finalDate: new Date(date + "T00:00:00Z"),
    },
  });

  revalidatePath(`/groups/${event.groupId}/events/${eventId}`);
  return { success: true };
}

export async function reopenEvent(eventId: string) {
  const user = await requireUser();

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      group: {
        include: { members: true },
      },
    },
  });

  if (!event) throw new Error("Event not found");

  const membership = event.group.members.find((m) => m.userId === user.id);
  if (!membership || membership.role !== "admin") {
    throw new Error("Only admins can reopen events");
  }

  await db.event.update({
    where: { id: eventId },
    data: {
      status: "voting",
      finalDate: null,
    },
  });

  revalidatePath(`/groups/${event.groupId}/events/${eventId}`);
  return { success: true };
}
