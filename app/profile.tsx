import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Ticket, Bell, CreditCard, LogOut, MapPin, Calendar, CheckCircle, Clock, ArrowLeft, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MOSCOW_EVENTS, type MeetEvent } from '@/lib/mockData';
import { useFavorites } from '@/lib/FavoritesContext';
import { useNotifications } from '@/lib/NotificationsContext';

// ── Mock user data ──────────────────────────────────────────────
const MOCK_USER = {
  name: 'Александр Петров',
  city: 'Москва',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop',
  visited: 8,
  friends: 34,
};

type EventStatus = 'saved' | 'visited' | 'upcoming';
type ProfileEvent = MeetEvent & { status: EventStatus };

// History mock (static, backend will replace)
const HISTORY: ProfileEvent[] = MOSCOW_EVENTS.slice(1, 4).map((e) => ({
  ...e,
  status: (e.id === '2' ? 'visited' : 'upcoming') as EventStatus,
}));

// ── Brand with emerald "Hub" ────────────────────────────────────
function BrandText({ size = 14 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{ color: '#ffffff', fontSize: size, fontWeight: '900', letterSpacing: 1 }}>Meet</Text>
      <Text style={{ color: '#1E9954', fontSize: size, fontWeight: '900', letterSpacing: 1 }}>Hub</Text>
    </View>
  );
}

// ── Compact event card ──────────────────────────────────────────
function EventCard({ item, onPress, rating, onRate }: { item: ProfileEvent; onPress: () => void; rating?: number; onRate?: (val: number) => void }) {
  const isVisited  = item.status === 'visited';
  const isUpcoming = item.status === 'upcoming';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="bg-card rounded-2xl mb-3 overflow-hidden border border-border"
    >
      <View className="flex-row items-center">
        <Image source={{ uri: item.imageUrl }} className="w-20 h-20" resizeMode="cover" />
      <View className="flex-1 px-3 py-2 gap-1">
        <Text className="text-foreground font-bold text-sm" numberOfLines={1}>{item.title}</Text>
        <View className="flex-row items-center gap-1">
          <Calendar size={12} color="#9ca3af" />
          <Text className="text-muted-foreground text-xs">{item.date}</Text>
        </View>
      </View>
      <View className="pr-3">
        {isVisited ? (
          <View className="flex-row items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(30,153,84,0.15)' }}>
            <CheckCircle size={11} color="#1E9954" />
            <Text style={{ color: '#1E9954', fontSize: 10, fontWeight: '600' }}>Посещено</Text>
          </View>
        ) : isUpcoming ? (
          <View className="flex-row items-center gap-1 bg-muted px-2 py-1 rounded-full">
            <Clock size={11} color="#9ca3af" />
            <Text className="text-muted-foreground text-xs font-semibold">Скоро</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1 bg-muted px-2 py-1 rounded-full">
            <Text style={{ color: '#1E9954', fontSize: 10, fontWeight: '600' }}>♥ Избранное</Text>
          </View>
        )}
      </View>
    </View>

      {isVisited && onRate && (
        <View className="px-4 pb-3 pt-2 flex-row items-center justify-between border-t border-border mt-2">
          <Text className="text-muted-foreground text-xs font-medium">
            {rating ? 'Оценка сохранена' : 'Оцените мероприятие:'}
          </Text>
          <View className="flex-row gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => { if (!rating) onRate(star); }}>
                <Star
                  size={18}
                  color={rating && star <= rating ? '#eab308' : '#374151'}
                  fill={rating && star <= rating ? '#eab308' : 'transparent'}
                />
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ── Empty state ──────────────────────────────────────────────────
function EmptyState({ onFind }: { onFind: () => void }) {
  return (
    <View className="items-center justify-center py-16 gap-4">
      <MapPin size={48} color="#9ca3af" />
      <Text className="text-muted-foreground text-base font-medium text-center">
        Здесь пока пусто
      </Text>
      <Pressable onPress={onFind} className="bg-primary px-5 py-3 rounded-full">
        <Text className="text-white font-bold">Найти мероприятия</Text>
      </Pressable>
    </View>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const { favorites } = useFavorites();
  const { unreadCount } = useNotifications();

  const favoritesAsProfileEvents: ProfileEvent[] = favorites.map((e) => ({ ...e, status: 'saved' as EventStatus }));
  const listData: ProfileEvent[] = activeTab === 'favorites' ? favoritesAsProfileEvents : HISTORY;

  const handleLogout = () => {
    Alert.alert(
      'Выйти из MeetHub?',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Header ────────────────────────── */}
        <View className="flex-row justify-between px-4 pt-2">
          <Pressable className="p-2" onPress={() => router.back()}>
            <ArrowLeft size={22} color="#9ca3af" />
          </Pressable>
          <Pressable className="p-2">
            <Settings size={22} color="#9ca3af" />
          </Pressable>
        </View>

        {/* ── User Header ────────────────────── */}
        <View className="items-center px-4 pb-6 gap-3">
          <View style={{
            padding: 3,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: '#1E9954',
            shadowColor: '#1E9954',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <Image
              source={{ uri: MOCK_USER.avatarUrl }}
              style={{ width: 96, height: 96, borderRadius: 999 }}
            />
          </View>
          <View className="items-center gap-1">
            <Text className="text-foreground text-2xl font-bold">{MOCK_USER.name}</Text>
            <View className="flex-row items-center gap-1">
              <MapPin size={13} color="#9ca3af" />
              <Text className="text-muted-foreground text-sm">{MOCK_USER.city}</Text>
            </View>
            <BrandText size={13} />
          </View>
        </View>

        {/* ── Stats Row ─────────────────────── */}
        <View className="mx-4 bg-card rounded-2xl border border-border flex-row mb-6">
          {[
            { label: 'Избранное', value: favorites.length },
            { label: 'Посещено',  value: MOCK_USER.visited },
            { label: 'Друзья',    value: MOCK_USER.friends },
          ].map((stat, i, arr) => (
            <View
              key={stat.label}
              className={`flex-1 items-center py-4 ${i < arr.length - 1 ? 'border-r border-border' : ''}`}
            >
              <Text className="text-foreground text-2xl font-extrabold">{stat.value}</Text>
              <Text className="text-muted-foreground text-xs mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Tabs ──────────────────────────── */}
        <View className="px-4 mb-4">
          <View className="flex-row bg-card rounded-full p-1 border border-border">
            {(['favorites', 'history'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-full items-center ${activeTab === tab ? 'bg-primary' : ''}`}
              >
                <Text className={`font-semibold text-sm ${activeTab === tab ? 'text-white' : 'text-muted-foreground'}`}>
                  {tab === 'favorites' ? 'Избранное' : 'История'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Event List ────────────────────── */}
        <View className="px-4 min-h-40">
          {listData.length === 0 ? (
            <EmptyState onFind={() => router.push('/')} />
          ) : (
            listData.map((item) => (
              <EventCard
                key={item.id}
                item={item}
                rating={ratings[item.id]}
                onRate={(val) => setRatings(prev => ({ ...prev, [item.id]: val }))}
                onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}
              />
            ))
          )}
        </View>

        {/* ── Divider ───────────────────────── */}
        <View className="h-px bg-border mx-4 my-6" />

        {/* ── Action List ───────────────────── */}
        <View className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
          {[
            { icon: Ticket,     label: 'Мои билеты',     badge: 3 },
            { icon: Bell,       label: 'Уведомления',    badge: unreadCount > 0 ? unreadCount : null },
            { icon: CreditCard, label: 'Способы оплаты', badge: null },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className={`flex-row items-center px-4 py-4 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
              >
                <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
                  <Icon size={18} color="#9ca3af" />
                </View>
                <Text className="text-foreground font-medium flex-1">{item.label}</Text>
                {item.badge != null && (
                  <View className="bg-primary w-6 h-6 rounded-full items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{item.badge}</Text>
                  </View>
                )}
                <Text className="text-muted-foreground">›</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
          className="mx-4 mt-3 bg-card rounded-2xl border border-border flex-row items-center px-4 py-4"
        >
          <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            <LogOut size={18} color="#ef4444" />
          </View>
          <Text style={{ color: '#ef4444', fontWeight: '600' }}>Выйти</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}
