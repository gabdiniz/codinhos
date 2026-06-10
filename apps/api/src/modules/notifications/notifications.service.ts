import { NotFoundError } from '../../shared/errors/index.js'
import {
  countNotifications,
  listNotifications,
  countUnread,
  findNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications.repository.js'

export async function getNotifications(
  userId: string,
  tenantId: string,
  page: number,
  limit: number,
  read?: boolean,
) {
  const offset = (page - 1) * limit

  const [total, rows] = await Promise.all([
    countNotifications(userId, tenantId, read),
    listNotifications(userId, tenantId, offset, limit, read),
  ])

  return {
    data: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
    meta: { total, page, limit },
  }
}

export async function getUnreadCount(userId: string, tenantId: string) {
  const count = await countUnread(userId, tenantId)
  return { count }
}

export async function markAsRead(notificationId: string, userId: string, tenantId: string) {
  const notification = await findNotificationById(notificationId, tenantId, userId)
  if (!notification) throw new NotFoundError('Notificação')

  // Se já foi lida, retorna sem update desnecessário
  if (notification.readAt) {
    return { notification: { id: notification.id, readAt: notification.readAt.toISOString() } }
  }

  const now = new Date()
  const updated = await markNotificationRead(notificationId, now)
  return { notification: { id: updated.id, readAt: updated.readAt!.toISOString() } }
}

export async function markAllAsRead(userId: string, tenantId: string) {
  const updated = await markAllNotificationsRead(userId, tenantId, new Date())
  return { updated }
}
