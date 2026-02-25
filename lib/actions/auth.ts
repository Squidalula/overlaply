"use server";

import { db } from "@/lib/db";
import { setSession, clearSession } from "@/lib/auth";
import { generateAvatarColor } from "@/lib/utils";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function register(
  _prevState: unknown,
  formData: FormData
) {
  const nickname = (formData.get("nickname") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!nickname || nickname.length < 2) {
    return { error: "Username must be at least 2 characters." };
  }

  if (nickname.length > 20) {
    return { error: "Username must be at most 20 characters." };
  }

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const existing = await db.user.findUnique({ where: { nickname } });
  if (existing) {
    return { error: "Username is already taken." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      nickname,
      password: hashedPassword,
      avatarColor: generateAvatarColor(),
    },
  });

  await setSession(user.id);
  redirect("/");
}

export async function login(
  _prevState: unknown,
  formData: FormData
) {
  const nickname = (formData.get("nickname") as string)?.trim();
  const password = formData.get("password") as string;

  if (!nickname) {
    return { error: "Username is required." };
  }

  if (!password) {
    return { error: "Password is required." };
  }

  const user = await db.user.findUnique({ where: { nickname } });
  if (!user) {
    return { error: "Invalid username or password." };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "Invalid username or password." };
  }

  await setSession(user.id);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
