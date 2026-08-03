export type NotificationStatus = 'unread' | 'read';
export type NotificationPriority = 'low' | 'normal' | 'high';
export type NotificationType =
  | 'testimony_submitted'
  | 'feedback_resolved'
  | 'ai_connection'
  | string;

export type AppNotification = {
  id: number;
  title: string;
  message?: string;
  type: NotificationType;
  status: NotificationStatus;
  priority: NotificationPriority;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

/**
 * The API answers `/notifications/me/unread-count` with `{ unreadCount }`.
 * `count` is kept optional so an older or changed response still parses.
 */
export type UnreadCount = { unreadCount?: number; count?: number };
