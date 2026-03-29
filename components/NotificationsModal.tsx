import React from 'react';
import { View, Text, Modal, Pressable, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Bell } from 'lucide-react-native';
import { useNotifications, type Notification } from '@/lib/NotificationsContext';

function NotificationItem({ item }: { item: Notification }) {
  return (
    <View
      className={`flex-row items-start gap-3 px-4 py-4 border-b border-border ${
        !item.read ? 'bg-primary/5' : ''
      }`}
    >
      {/* Unread dot */}
      <View className="mt-1 w-2 h-2 rounded-full shrink-0" style={{
        backgroundColor: item.read ? 'transparent' : '#1E9954',
      }} />
      <View className="flex-1">
        <Text className="text-foreground font-semibold text-sm mb-1">{item.title}</Text>
        <Text className="text-muted-foreground text-sm leading-5">{item.body}</Text>
        <Text className="text-muted-foreground text-xs mt-2">{item.time}</Text>
      </View>
    </View>
  );
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const handleClose = () => {
    markAllRead();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-background">
        <SafeAreaView edges={['top']} className="bg-background">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <Bell size={20} color="#1E9954" />
              <Text className="text-foreground text-lg font-bold">Уведомления</Text>
              {unreadCount > 0 && (
                <View className="bg-primary px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={handleClose}
              className="bg-card p-2 rounded-full border border-border"
            >
              <X size={18} color="#9ca3af" />
            </Pressable>
          </View>
        </SafeAreaView>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-20">
              <Bell size={48} color="#9ca3af" />
              <Text className="text-muted-foreground mt-4">Нет уведомлений</Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
}
