import { prisma } from "../db/prisma.js";
import { HTTPException } from "hono/http-exception";
import type { NotificationType, Prisma } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metaData?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metaData: (input.metaData ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function getUserNotifications(
  userId: string,
  options: { unreadOnly?: boolean; page?: number; limit?: number }
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 30;
  const skip = (page - 1) * limit;

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId, ...(options.unreadOnly && { isRead: false }) },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { userId, ...(options.unreadOnly && { isRead: false }) },
    }),
  ]);

  return { data: notifications, total, page, limit, hasMore: skip + notifications.length < total };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new HTTPException(404, { message: "Notification not found" });
  if (notification.userId !== userId) throw new HTTPException(403, { message: "Access denied" });

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  const { count } = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updated: count };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
