import { eq, and, isNull, isNotNull, count, desc } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { notifications } from '../../shared/db/schema.js'

// ─── Leitura ─────────────────────────────────────────────────────────────────

export async function countNotifications(
  userId: string,
  tenantId: string,
  read?: boolean,
): Promise<number> {
  const conditions = [
    eq(notifications.tenantId, tenantId),
    eq(notifications.userId, userId),
  ]
  if (read === true) conditions.push(isNotNull(notifications.readAt))
  if (read === false) conditions.push(isNull(notifications.readAt))

  const [row] = await db
    .select({ total: count() })
    .from(notifications)
    .where(and(...conditions))
  return Number(row?.total ?? 0)
}

export async function listNotifications(
  userId: string,
  tenantId: string,
  offset: number,
  limit: number,
  read?: boolean,
) {
  const conditions = [
    eq(notifications.tenantId, tenantId),
    eq(notifications.userId, userId),
  ]
  if (read === true) conditions.push(isNotNull(notifications.readAt))
  if (read === false) conditions.push(isNull(notifications.readAt))

  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset)
}

export async function countUnread(userId: string, tenantId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    )
  return Number(row?.total ?? 0)
}

export async function findNotificationById(notificationId: string, tenantId: string, userId: string) {
  const [row] = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
      ),
    )
    .limit(1)
  return row ?? null
}

// ─── Escrita ─────────────────────────────────────────────────────────────────

export async function markNotificationRead(notificationId: string, readAt: Date) {
  const [row] = await db
    .update(notifications)
    .set({ readAt })
    .where(eq(notifications.id, notificationId))
    .returning({ id: notifications.id, readAt: notifications.readAt })
  return row!
}

/** Marca todas as notificações não lidas do usuário como lidas. Retorna a contagem. */
export async function markAllNotificationsRead(
  userId: string,
  tenantId: string,
  readAt: Date,
): Promise<number> {
  const rows = await db
    .update(notifications)
    .set({ readAt })
    .where(
      and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id })
  return rows.length
}
