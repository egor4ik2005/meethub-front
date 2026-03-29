import React, { createContext, useContext, useState } from 'react';

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  time: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '⏰ Скоро начало',
    body: 'VK Fest 2024 начнется через 2 часа. Не опаздывайте!',
    read: false,
    time: '14:00',
  },
  {
    id: '2',
    title: '📍 Новое рядом с вами',
    body: 'Джазовые вечера в Парке Горького — 500м от вас',
    read: false,
    time: '12:30',
  },
  {
    id: '3',
    title: '❤️ Мероприятие в избранном',
    body: 'Выставка ИИ-искусства: осталось 10 билетов. Успейте купить!',
    read: true,
    time: 'Вчера',
  },
  {
    id: '4',
    title: '🎉 Рекомендация',
    body: 'TEDxMoscow 2024 — идеально совпадает с вашими интересами',
    read: true,
    time: 'Вчера',
  },
];

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: 0,
  markAllRead: () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
