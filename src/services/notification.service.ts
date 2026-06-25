import api from './api';
import type { AppNotification, UnreadCount } from '@/types/notification';

export const notificationService = {
  getMyNotifications: async (): Promise<AppNotification[]> => {
    const { data } = await api.get<AppNotification[]>('/notifications/me');
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<UnreadCount>('/notifications/me/unread-count');
    return data.count;
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/me/read-all');
  },

  markRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/me/${id}/read`);
  },
};
