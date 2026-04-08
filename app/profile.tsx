import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings, LogOut, ArrowLeft, Star, Calendar, Clock,
  CheckCircle, MapPin, Edit3, Plus, X, Save, Heart,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useGetCurrentUser, useUpdateCurrentUser } from '@/lib/api/generated/auth/auth';
import { useFavorites } from '@/lib/FavoritesContext';
import { MOSCOW_EVENTS, MeetEvent } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';

// ── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  visible,
  currentUsername,
  currentBio,
  onClose,
  onSave,
  isSaving,
}: {
  visible: boolean;
  currentUsername: string;
  currentBio: string;
  onClose: () => void;
  onSave: (username: string, bio: string) => void;
  isSaving: boolean;
}) {
  const [username, setUsername] = useState(currentUsername);
  const [bio, setBio] = useState(currentBio);

  const handleSave = () => {
    if (!username.trim()) {
      Alert.alert('Ошибка', 'Имя пользователя не может быть пустым');
      return;
    }
    onSave(username.trim(), bio.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#0a0a0b' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
          }}>

            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color="#9ca3af" />
            </Pressable>

            <UIText className="text-white font-bold text-[16px]">
              Редактировать профиль
            </UIText>

            <Pressable onPress={handleSave} disabled={isSaving} hitSlop={8}>
              {isSaving
                ? <ActivityIndicator size="small" color="#1E9954" />
                : <Save size={22} color="#1E9954" />
              }
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#6b7280', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                ИМЯ ПОЛЬЗОВАТЕЛЯ
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Введите имя"
                placeholderTextColor="#4b5563"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
                  color: '#fff', fontSize: 15,
                }}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: '#6b7280', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                БИО
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Расскажите о себе..."
                placeholderTextColor="#4b5563"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
                  color: '#fff', fontSize: 15, minHeight: 110,
                }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Profile Event Card ────────────────────────────────────────────────────────
function ProfileEventCard({ event, onPress }: { event: MeetEvent, onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', padding: 14, borderRadius: 20,
        backgroundColor: '#1a1a1c',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 16, opacity: pressed ? 0.75 : 1, gap: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
      })}
      className="flex-row p-[14px] rounded-[20px] bg-white dark:bg-[#1a1a1c] border-[1.5px] border-gray-200 dark:border-white/[0.08] mb-4 active:opacity-75 gap-[14px] shadow-lg shadow-black/30"
    >
      <Image source={{ uri: event.imageUrl }} style={{ width: 72, height: 72, borderRadius: 14 }} />
      <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
        <UIText style={{ color: '#fff', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>{event.title}</UIText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Calendar size={13} color="#9ca3af" />
          <UIText style={{ color: '#9ca3af', fontSize: 13, fontWeight: '500' }}>{event.date}</UIText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MapPin size={13} color="#9ca3af" />
          <UIText style={{ color: '#9ca3af', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>{event.location}</UIText>
        </View>
      </View>
    </Pressable>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user: storedUser, setAuth, token, logout } = useAuthStore();
  const { favorites } = useFavorites();
  const [editVisible, setEditVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');

  // Mock history events
  const historyEvents = MOSCOW_EVENTS.slice(0, 3);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const { data: profile, isLoading, refetch } = useGetCurrentUser({
    query: { enabled: !!token && token !== 'stub_fake_token' },
  });

  // Use real data or fall back to stub
  const displayUser = profile ?? storedUser;
  const username = displayUser?.username ?? 'Пользователь';
  const email = displayUser?.email ?? '';
  const avatarUrl = displayUser?.avatar_url ?? null;
  const bio = (displayUser as any)?.bio ?? '';

  // ── Update profile ────────────────────────────────────────────────────────
  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateCurrentUser();

  const handleSaveProfile = async (newUsername: string, newBio: string) => {
    try {
      const updated = await updateProfile({ data: { username: newUsername } });
      if (token) {
        setAuth(updated, token);
      }
      setEditVisible(false);
      refetch();
    } catch (err: any) {
      Alert.alert('Ошибка', err?.response?.data?.message ?? 'Не удалось сохранить');
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Выйти из MeetHub?',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: () => { logout(); } },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header ────────────────────────── */}
        <View className="flex-row justify-between px-4 pt-2">
          <Pressable className="p-2" onPress={() => router.back()}>
            <ArrowLeft size={22} color="#9ca3af" />
          </Pressable>
          <Pressable className="p-2" onPress={() => setEditVisible(true)}>
            <Settings size={22} color="#9ca3af" />
          </Pressable>
        </View>

        {/* ── Avatar + Name ─────────────────── */}
        <View className="items-center px-4 pb-6 gap-3">
          {isLoading ? (
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#1E9954" />
            </View>
          ) : (
            <View style={{
              padding: 3, borderRadius: 999, borderWidth: 2, borderColor: '#1E9954',
              shadowColor: '#1E9954', shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
            }}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 96, height: 96, borderRadius: 999 }} />
              ) : (
                <View style={{
                  width: 96, height: 96, borderRadius: 999, backgroundColor: '#1f2937',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#1E9954', fontSize: 36, fontWeight: '800' }}>
                    {username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="items-center gap-1">
            <Text className="text-foreground text-2xl font-bold">{username}</Text>
            {email ? (
              <Text className="text-muted-foreground text-sm">{email}</Text>
            ) : null}
            {bio ? (
              <Text className="text-muted-foreground text-sm text-center px-6 mt-1">{bio}</Text>
            ) : null}
          </View>

          {/* Edit Profile Button */}
          <Pressable
            onPress={() => setEditVisible(true)}
            className="flex-row items-center gap-[6px] bg-[#1E9954]/[0.12] border border-[#1E9954]/30 px-4 py-2 rounded-[20px] active:opacity-70"
          >
            <Edit3 size={14} color="#1E9954" />
            <Text className="text-[#1E9954] font-semibold text-[13px]">
              Редактировать профиль
            </Text>
          </Pressable>
        </View>

        {/* ── Create Event Button ─────────── */}
        <View className="px-6 mb-8 mt-3">
          <Button
            variant="outline"
            onPress={() => router.push('/create-event' as any)}
            className="flex-row items-center justify-center border-2 border-[#1E9954]/40 bg-transparent rounded-2xl h-14"
          >
            <Plus size={22} color="#1E9954" strokeWidth={3} style={{ marginRight: 8 }} />
            <UIText className="text-[#1E9954] font-bold text-[16px]" numberOfLines={1}>
              Создать мероприятие
            </UIText>
          </Button>
        </View>

        {/* ── Tabs (History / Favorites) ──────── */}
        <View className="mx-6 mb-6 flex-row border-b border-border/50">
          <Pressable
            onPress={() => setActiveTab('history')}
            style={{ flex: 1, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: activeTab === 'history' ? '#1E9954' : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ color: activeTab === 'history' ? '#1E9954' : '#6b7280', fontWeight: '700', fontSize: 15 }}>
              История
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('favorites')}
            style={{ flex: 1, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: activeTab === 'favorites' ? '#1E9954' : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ color: activeTab === 'favorites' ? '#1E9954' : '#6b7280', fontWeight: '700', fontSize: 15 }}>
              Избранное
            </Text>
          </Pressable>
        </View>

        {/* ── Tab Content ─────────────────────── */}
        <View className="mx-6 mb-8">

          {activeTab === 'history' && (
            <View>
              {historyEvents.length > 0 ? (
                historyEvents.map((event) => (
                  <ProfileEventCard
                    key={`history-${event.id}`}
                    event={event}
                    onPress={() => router.push(`/(tabs)/details?id=${event.id}` as any)}
                  />
                ))
              ) : (
                <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 20 }}>Вы еще не посещали мероприятия</Text>
              )}
            </View>
          )}

          {activeTab === 'favorites' && (
            <View>
              {favorites.length > 0 ? (
                favorites.map((event) => (
                  <ProfileEventCard
                    key={`fav-${event.id}`}
                    event={event}
                    onPress={() => router.push(`/(tabs)/details?id=${event.id}` as any)}
                  />
                ))
              ) : (
                <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 20 }}>У вас нет избранных мероприятий</Text>
              )}
            </View>
          )}
        </View>

        {/* ── Divider ───────────────────────── */}
        <View className="h-px bg-border mx-4 mb-6" />

        {/* ── Action List ───────────────────── */}
        <View className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            className="flex-row items-center px-4 py-4"
          >
            <View className="w-9 h-9 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <LogOut size={18} color="#ef4444" />
            </View>
            <Text style={{ color: '#ef4444', fontWeight: '600' }}>Выйти</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* ── Edit Modal ───────────────────────── */}
      <EditProfileModal
        visible={editVisible}
        currentUsername={username}
        currentBio={bio}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
        isSaving={isSaving}
      />
    </SafeAreaView>
  );
}
