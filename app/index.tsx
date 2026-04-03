import * as React from 'react';
import { useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MapScreen } from '../components/MapScreen';
import { FeedScreen } from '../components/FeedScreen';
import { NotificationsModal } from '../components/NotificationsModal';
import { useNotifications } from '../lib/NotificationsContext';

function BellButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <Pressable
        className="p-2 relative"
        onPress={() => setModalVisible(true)}
      >
        <Bell size={24} color="white" />
        {unreadCount > 0 && (
          <View
            className="absolute top-1 right-1 bg-primary rounded-full items-center justify-center"
            style={{ width: 10, height: 10 }}
          />
        )}
      </Pressable>
      <NotificationsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

export default function Screen() {
  const [activeTab, setActiveTab] = useState<'map' | 'feed'>('map');
  const [feedHeight, setFeedHeight] = useState(0);
  const router = useRouter();

  const onContentLayout = (e: LayoutChangeEvent) => {
    setFeedHeight(e.nativeEvent.layout.height);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 mt-2">
        <Pressable className="p-2" onPress={() => router.push('/profile')}>
          <User size={24} color="white" />
        </Pressable>

        {/* Brand */}
        <View className="flex-row items-baseline">
          <Text className="text-foreground text-2xl font-black tracking-widest">Meet</Text>
          <Text style={{ color: '#1E9954' }} className="text-2xl font-black tracking-widest">Hub</Text>
        </View>

        <BellButton />
      </View>

      {/* Pill Tab Bar */}
      <View className="px-4 py-2 mt-2 pb-4 z-10 bg-background">
        <View className="flex-row bg-card rounded-full p-1">
          <Pressable
            onPress={() => setActiveTab('map')}
            className={`flex-1 py-3 rounded-full items-center justify-center ${
              activeTab === 'map' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text className={`font-semibold ${activeTab === 'map' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Карта
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('feed')}
            className={`flex-1 py-3 rounded-full items-center justify-center ${
              activeTab === 'feed' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text className={`font-semibold ${activeTab === 'feed' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Лента событий
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1" onLayout={onContentLayout}>
        {activeTab === 'map'
          ? <MapScreen />
          : <FeedScreen availableHeight={feedHeight} />
        }

      </View>

      {/* FAB: create event */}
      <Pressable
        onPress={() => router.push('/create-event' as any)}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: 24,
          alignSelf: 'center',
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: '#10b981',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#10b981',
          shadowOpacity: 0.55,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
          elevation: 12,
          opacity: pressed ? 0.8 : 1,
          zIndex: 100,
        })}
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  );
}
