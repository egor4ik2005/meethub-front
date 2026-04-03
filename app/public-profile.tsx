import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Share,
  Dimensions,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Calendar } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ORGANIZERS, MOSCOW_EVENTS, type MeetEvent } from '@/lib/mockData';

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_W - 4) / 3; // 3 cols, 2px gaps

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}

// ─── Stat Block ──────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Event Grid Cell ─────────────────────────────────────────────────────────

function EventCell({ event, onPress }: { event: MeetEvent; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Image
        source={{ uri: event.imageUrl }}
        style={styles.cellImage}
        contentFit="cover"
        transition={200}
      />
      {/* Gradient overlay */}
      <View style={styles.cellOverlay} />
      {/* Category badge */}
      <View style={styles.cellBadge}>
        <Text style={styles.cellBadgeText} numberOfLines={1}>
          {event.category}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── PublicProfileScreen ─────────────────────────────────────────────────────

export default function PublicProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [subscribed, setSubscribed] = useState(false);

  const organizer = ORGANIZERS.find((o) => o.id === userId) ?? ORGANIZERS[0];
  const events = MOSCOW_EVENTS.filter((e) => e.organizerId === organizer.id);

  const handleSubscribe = async () => {
    await Haptics.impactAsync(
      subscribed ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    setSubscribed((prev) => !prev);
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      title: organizer.name,
      message: `Посмотри профиль организатора ${organizer.name} в MeetHub!\n${organizer.bio}`,
    });
  };

  const handleEventPress = useCallback(
    (eventId: string) => {
      router.push({ pathname: '/details', params: { id: eventId } });
    },
    [router]
  );

  const renderEvent = useCallback(
    ({ item }: { item: MeetEvent }) => (
      <EventCell event={item} onPress={() => handleEventPress(item.id)} />
    ),
    [handleEventPress]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <ArrowLeft size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Share2 size={22} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: organizer.avatarColor }]}>
            <Text style={styles.avatarText}>{organizer.avatarInitial}</Text>
          </View>
          {/* Emerald ring */}
          <View style={styles.avatarRing} />
        </View>

        {/* Name */}
        <Text style={styles.name}>{organizer.name}</Text>
        <Text style={styles.bio}>{organizer.bio}</Text>

        {/* Subscribe button */}
        <Pressable
          onPress={handleSubscribe}
          style={({ pressed }) => [
            styles.subBtn,
            subscribed ? styles.subBtnOutline : styles.subBtnFilled,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[styles.subBtnText, subscribed && styles.subBtnTextOutline]}>
            {subscribed ? 'Вы подписаны ✓' : 'Подписаться'}
          </Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem value={fmtNumber(organizer.followers)} label="Подписчики" />
          <View style={styles.statDivider} />
          <StatItem value={String(events.length)} label="Мероприятия" />
          <View style={styles.statDivider} />
          <StatItem value={organizer.rating.toFixed(1)} label="Рейтинг" />
        </View>

        {/* Section label */}
        <View style={styles.sectionHeader}>
          <Calendar size={14} color="#6b7280" />
          <Text style={styles.sectionLabel}>МЕРОПРИЯТИЯ</Text>
        </View>

        {/* Event grid */}
        {events.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Нет мероприятий</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContent}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  safeTop: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 48,
    alignItems: 'center',
  },
  // Avatar
  avatarWrap: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 96,
    height: 96,
  },
  avatarRing: {
    position: 'absolute',
    inset: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: '#10b981',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
  },
  // Text
  name: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bio: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  // Subscribe
  subBtn: {
    width: SCREEN_W - 80,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 28,
  },
  subBtnFilled: {
    backgroundColor: '#10b981',
    // emerald gradient fallback (no LinearGradient dep)
    shadowColor: '#10b981',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  subBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  subBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subBtnTextOutline: {
    color: '#10b981',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    width: SCREEN_W - 48,
    paddingVertical: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 12,
    gap: 6,
  },
  sectionLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  // Grid
  row: {
    gap: 2,
  },
  gridContent: {
    gap: 2,
    paddingHorizontal: 0,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE * 1.4,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  cellOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cellBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(16,185,129,0.85)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  cellBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  // Empty
  emptyWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
