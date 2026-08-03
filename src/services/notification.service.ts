import api, { toArray } from './api';
import type { AppNotification, UnreadCount } from '@/types/notification';

export const notificationService = {
  getMyNotifications: async (): Promise<AppNotification[]> => {
    const { data } = await api.get<AppNotification[] | { data: AppNotification[] }>(
      '/notifications/me',
    );
    return toArray(data);
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<UnreadCount>('/notifications/me/unread-count');
    // The backend field is `unreadCount`; `count` is a defensive fallback.
    return data?.unreadCount ?? data?.count ?? 0;
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/me/read-all');
  },

  markRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/me/${id}/read`);
  },
};
