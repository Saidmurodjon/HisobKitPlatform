import { prisma } from "../db/prisma.js";
import { HTTPException } from "hono/http-exception";
import type { GroupType } from "@prisma/client";

export async function createGroup(
  createdById: string,
  data: { name: string; description?: string; type?: GroupType }
) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type ?? "OTHER",
        createdById,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: group.id,
        userId: createdById,
        role: "OWNER",
      },
    });

    return tx.group.findUniqueOrThrow({
      where: { id: group.id },
      include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    });
  });
}

export async function getUserGroups(userId: string) {
  return prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getGroupById(groupId: string, requestingUserId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
      },
      settlements: {
        where: { status: "PENDING" },
        include: {
          fromUser: { select: { id: true, name: true, avatar: true } },
          toUser: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  if (!group) throw new HTTPException(404, { message: "Group not found" });

  const isMember = group.members.some((m) => m.userId === requestingUserId);
  if (!isMember) throw new HTTPException(403, { message: "You are not a member of this group" });

  return group;
}

export async function joinGroupByInviteCode(inviteCode: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { inviteCode } });
  if (!group) throw new HTTPException(404, { message: "Invalid invite code" });

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId } },
  });
  if (existing) throw new HTTPException(409, { message: "Already a member of this group" });

  await prisma.groupMember.create({
    data: { groupId: group.id, userId, role: "MEMBER" },
  });

  return group;
}

export async function removeMember(groupId: string, targetUserId: string, requestingUserId: string) {
  const requestingMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requestingUserId } },
  });

  if (!requestingMember || !["OWNER", "ADMIN"].includes(requestingMember.role)) {
    throw new HTTPException(403, { message: "Insufficient permissions" });
  }

  const targetMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!targetMember) throw new HTTPException(404, { message: "Member not found" });
  if (targetMember.role === "OWNER") {
    throw new HTTPException(400, { message: "Cannot remove the group owner" });
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
}

export async function updateGroup(
  groupId: string,
  requestingUserId: string,
  data: { name?: string; description?: string; type?: GroupType }
) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requestingUserId } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new HTTPException(403, { message: "Insufficient permissions" });
  }

  return prisma.group.update({ where: { id: groupId }, data });
}
