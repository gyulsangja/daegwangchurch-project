"use server";

import { revalidatePath } from "@/lib/revalidate";
import { redirect } from "next/navigation";

import { Prisma } from "@daegwang/database/generated/client";
import { parseEventFormData } from "@daegwang/contracts/features/events/schema";
import { requireAdmin } from "../../lib/auth/permissions";
import { getPrisma } from "@daegwang/database/prisma";

export type EventActionState = { message?: string; errors?: Record<string, string[]> };

function buildSlug(title: string) {
  const base = title.normalize("NFKC").toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 70);
  return `${base || "event"}-${Date.now().toString(36)}`;
}

function parseInput(formData: FormData):
  | { success: true; data: ReturnType<typeof parseEventFormData>["data"] & object }
  | { success: false; state: EventActionState } {
  const result = parseEventFormData(formData);
  if (!result.success) return { success: false, state: { message: "입력값을 확인해 주세요.", errors: result.error.flatten().fieldErrors } };
  return { success: true, data: result.data };
}

function revalidateEventPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/events");
  revalidatePath("/news/events");
  if (slug) revalidatePath(`/news/events/${slug}`);
}

export async function createEventAction(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  let createdId = "";
  try {
    await getPrisma().$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title: parsed.data.title,
          slug: buildSlug(parsed.data.title),
          category: parsed.data.category,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
          isAllDay: parsed.data.isAllDay,
          location: parsed.data.location,
          ministryName: parsed.data.ministryName,
          ...(parsed.data.description ? { description: { body: parsed.data.description } } : {}),
          status: parsed.data.status,
          publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
        },
      });
      createdId = event.id;
      await tx.activityLog.create({ data: { actorId: admin.id, action: "CREATE", entityType: "Event", entityId: event.id, summary: `교회 일정 '${event.title}' 등록` } });
    });
  } catch (error) {
    console.error("Failed to create event", error);
    return { message: "일정을 저장하지 못했습니다." };
  }
  revalidateEventPaths();
  redirect(`/admin/events/${createdId}/edit?saved=1`);
}

export async function updateEventAction(id: string, _state: EventActionState, formData: FormData): Promise<EventActionState> {
  const admin = await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) return parsed.state;
  let slug = "";
  try {
    await getPrisma().$transaction(async (tx) => {
      const current = await tx.event.findFirst({ where: { id, deletedAt: null } });
      if (!current) throw new Error("NOT_FOUND");
      slug = current.slug;
      const event = await tx.event.update({
        where: { id },
        data: {
          title: parsed.data.title,
          category: parsed.data.category,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
          isAllDay: parsed.data.isAllDay,
          location: parsed.data.location,
          ministryName: parsed.data.ministryName,
          description: parsed.data.description ? { body: parsed.data.description } : Prisma.JsonNull,
          status: parsed.data.status,
          publishedAt: parsed.data.status === "PUBLISHED" ? current.publishedAt ?? new Date() : null,
        },
      });
      await tx.activityLog.create({ data: { actorId: admin.id, action: "UPDATE", entityType: "Event", entityId: event.id, summary: `교회 일정 '${event.title}' 수정`, changes: { previousStatus: current.status, nextStatus: event.status } } });
    });
  } catch (error) {
    console.error("Failed to update event", error);
    return { message: "일정을 수정하지 못했습니다." };
  }
  revalidateEventPaths(slug);
  redirect(`/admin/events/${id}/edit?saved=1`);
}

export async function deleteEventAction(id: string) {
  const admin = await requireAdmin();
  let slug = "";
  await getPrisma().$transaction(async (tx) => {
    const event = await tx.event.update({ where: { id }, data: { deletedAt: new Date() } });
    slug = event.slug;
    await tx.activityLog.create({ data: { actorId: admin.id, action: "DELETE", entityType: "Event", entityId: event.id, summary: `교회 일정 '${event.title}' 삭제` } });
  });
  revalidateEventPaths(slug);
  redirect("/admin/events");
}
