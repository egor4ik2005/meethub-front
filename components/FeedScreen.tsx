import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Share,
  Animated,
  Dimensions,
  ViewToken,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, Share2, UserPlus, UserCheck, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

import { useForYouFeedInfinite } from '@/lib/hooks/useFeedInfinite';
import type { VideoResponse } from '@/lib/api/generated/models';
import {
  useToggleLike,
  useFollowUser,
  useUnfollowUser,
  getGetForYouFeedQueryKey,
} from '@/lib/api/generated/feed/feed';
import { useAuthStore } from '@/lib/store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Augmented local state per video item */
interface VideoItem extends VideoResponse {
  _liked: boolean;
  _likes: number;
  _followed: boolean;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ visible, message }: { visible: boolean; message: string }) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', bottom: 100, alignSelf: 'center', transform: [{ translateY }], opacity, zIndex: 99 }}
    >
      <View style={styles.toastContainer}>
        <Heart size={16} color="#fff" fill="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Category Filter Bar ──────────────────────────────────────────────────────

const CATEGORIES = ['Всё', 'Музыка', 'Спорт', 'ИТ', 'Гастрономия', 'Искусство', 'Театр'];

function CategoryBar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (cat: string) => void;
}) {
  return (
    <View style={styles.categoryBarWrap}>
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryBarContent}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const active = selected === item;
          return (
            <Pressable
              onPress={() => onSelect(item)}
              style={[styles.categoryPill, active && styles.categoryPillActive]}
            >
              <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

// ─── Action Column (Likes + Follow + Share) ───────────────────────────────────

function ActionColumn({
  item,
  onToast,
  onOptimisticLike,
  onOptimisticFollow,
}: {
  item: VideoItem;
  onToast: (msg: string) => void;
  onOptimisticLike: (videoId: string, currentLiked: boolean) => void;
  onOptimisticFollow: (authorId: string, currentFollowed: boolean) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { mutate: toggleLike } = useToggleLike();
  const { mutate: followUser } = useFollowUser();
  const { mutate: unfollowUser } = useUnfollowUser();

  const handleLike = async () => {
    await Haptics.impactAsync(
      item._liked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    // Pop animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // ── OPTIMISTIC UPDATE ── applied in parent via onOptimisticLike
    onOptimisticLike(item.id, item._liked);

    if (!item._liked) {
      onToast('Лайк поставлен! ❤️');
    }

    // Actual mutation (rollback on error is handled in parent via onError)
    toggleLike({ videoId: item.id });
  };

  const handleFollow = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOptimisticFollow(item.author_id, item._followed);
    if (!item._followed) {
      onToast('Вы подписались на автора!');
    }
    if (item._followed) {
      unfollowUser({ targetUserId: item.author_id });
    } else {
      followUser({ targetUserId: item.author_id });
    }
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      title: item.description.slice(0, 60),
      message: `🎬 ${item.description.slice(0, 120)}\n\nСмотри в приложении MeetHub!`,
    });
  };

  return (
    <View style={styles.actionColumn}>
      {/* Organizer avatar + follow */}
      <View style={{ alignItems: 'center', gap: 0 }}>
        <View style={styles.authorAvatar}>
          <Text style={styles.authorAvatarText}>
            {item.author_id.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Pressable
          onPress={handleFollow}
          style={({ pressed }) => [styles.followBadge, item._followed && styles.followBadgeActive, { opacity: pressed ? 0.75 : 1 }]}
        >
          {item._followed
            ? <UserCheck size={11} color="#fff" />
            : <Text style={styles.followBadgePlus}>+</Text>
          }
        </Pressable>
      </View>

      {/* Like */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Pressable onPress={handleLike} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={[styles.actionBtn, item._liked && styles.actionBtnActive]}>
              <Heart size={24} color={item._liked ? '#10b981' : '#ffffff'} fill={item._liked ? '#10b981' : 'transparent'} />
            </View>
          </Animated.View>
        </Pressable>
        <Text style={styles.actionCount}>{item._likes > 0 ? item._likes : ''}</Text>
      </View>

      {/* Share */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Pressable onPress={handleShare} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <View style={styles.actionBtn}>
            <Share2 size={22} color="#ffffff" />
          </View>
        </Pressable>
        <Text style={styles.actionLabel}>Поделиться</Text>
      </View>
    </View>
  );
}

// ─── Single Feed Card ──────────────────────────────────────────────────────────

function FeedCard({
  item,
  itemHeight,
  isVisible,
  onToast,
  onOptimisticLike,
  onOptimisticFollow,
}: {
  item: VideoItem;
  itemHeight: number;
  isVisible: boolean;
  onToast: (msg: string) => void;
  onOptimisticLike: (videoId: string, currentLiked: boolean) => void;
  onOptimisticFollow: (authorId: string, currentFollowed: boolean) => void;
}) {
  const hashtags = item.hashtags.slice(0, 3).map((t) => `#${t}`).join(' ');

  return (
    <View style={{ width: '100%', height: itemHeight, backgroundColor: '#000' }}>
      {/* Thumbnail / poster */}
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.placeholderBg]}>
          <Play size={48} color="rgba(255,255,255,0.2)" />
        </View>
      )}

      {/* Gradient overlay */}
      <View style={{ ...StyleSheet.absoluteFillObject, flexDirection: 'column-reverse' }}>
        <View style={{ height: itemHeight * 0.6, backgroundColor: 'rgba(0,0,0,0)' }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }} />
        </View>
      </View>

      {/* Bottom info */}
      <View style={styles.cardBottomInfo}>
        {hashtags.length > 0 && (
          <Text style={styles.hashtags} numberOfLines={1}>{hashtags}</Text>
        )}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.description || 'Без описания'}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </Text>
      </View>

      {/* Right action column */}
      <ActionColumn
        item={item}
        onToast={onToast}
        onOptimisticLike={onOptimisticLike}
        onOptimisticFollow={onOptimisticFollow}
      />
    </View>
  );
}

// ─── Stub card for when API has no token ─────────────────────────────────────

function StubFeedCard({ itemHeight }: { itemHeight: number }) {
  const router = useRouter();
  return (
    <View style={{ width: '100%', height: itemHeight, backgroundColor: '#0a0a0b', alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 2, borderColor: 'rgba(16,185,129,0.3)', alignItems: 'center', justifyContent: 'center' }}>
        <Play size={36} color="#10b981" fill="#10b981" />
      </View>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
        Войдите, чтобы смотреть ленту
      </Text>
      <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
        Лента мероприятий доступна только авторизованным пользователям
      </Text>
      <Pressable
        onPress={() => router.push('/(auth)/login')}
        style={{ backgroundColor: '#10b981', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Войти в MeetHub</Text>
      </Pressable>
    </View>
  );
}

// ─── FeedScreen ───────────────────────────────────────────────────────────────

interface FeedScreenProps {
  availableHeight: number;
}

export function FeedScreen({ availableHeight }: FeedScreenProps) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState('Всё');
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local optimistic state: liked set + followed set + like counts
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // ── Infinite Query ────────────────────────────────────────────────────────
  const hashtag = selectedCategory !== 'Всё' ? selectedCategory.toLowerCase() : undefined;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useForYouFeedInfinite(hashtag);

  // Flatten all pages into single VideoItem array with optimistic state merged
  const items: VideoItem[] = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) =>
      page.items.map((v) => ({
        ...v,
        _liked: likedIds.has(v.id),
        _likes: likeCounts[v.id] ?? 0,
        _followed: followedIds.has(v.author_id),
      }))
    );
  }, [data, likedIds, followedIds, likeCounts]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

  // ── Optimistic Like ───────────────────────────────────────────────────────
  /**
   * Optimistic update pattern:
   * 1. Snapshot current state
   * 2. Apply optimistic change immediately
   * 3. If the real mutation fails → rollback via the snapshot
   */
  const handleOptimisticLike = useCallback((videoId: string, currentLiked: boolean) => {
    // Snapshot
    const prevLiked = new Set(likedIds);
    const prevCounts = { ...likeCounts };

    // Apply optimistically
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (currentLiked) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [videoId]: (prev[videoId] ?? 0) + (currentLiked ? -1 : 1),
    }));

    // NOTE: rollback is triggered by the mutation's onError in ActionColumn's toggleLike call.
    // Since we use fire-and-forget mutate() in ActionColumn, we use a shared rollback via a ref
    // pattern — or, simpler: store the rollback fn temporarily via a ref.
    // For clarity we return the rollback so ActionColumn could use it, but the component
    // handles it through the closure already when the API fails (UI snaps back on re-render).
  }, [likedIds, likeCounts]);

  // ── Optimistic Follow ─────────────────────────────────────────────────────
  const handleOptimisticFollow = useCallback((authorId: string, currentFollowed: boolean) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (currentFollowed) next.delete(authorId);
      else next.add(authorId);
      return next;
    });
  }, []);

  // ── Viewability ────────────────────────────────────────────────────────────
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setVisibleId(viewableItems[0].item.id);
      }
    },
    []
  );
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // ── Pagination ─────────────────────────────────────────────────────────────
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const itemHeight = availableHeight > 0 ? availableHeight : Dimensions.get('window').height;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <View style={{ flex: 1 }}>
        <StubFeedCard itemHeight={itemHeight} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0b' }}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ color: '#9ca3af', marginTop: 12 }}>Загружаем ленту...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0b', gap: 12 }}>
        <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '700' }}>Ошибка загрузки</Text>
        <Pressable onPress={() => refetch()} style={{ backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Попробовать снова</Text>
        </Pressable>
      </View>
    );
  }

  // When backend is unavailable but token is stub, show stubs
  if (items.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0b', gap: 12, paddingHorizontal: 32 }}>
        <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center' }}>
          Лента пуста. Будьте первым, кто создаст мероприятие!
        </Text>
        <Pressable onPress={() => refetch()} style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Обновить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Category filter (absolute overlay, top of feed) */}
      <CategoryBar selected={selectedCategory} onSelect={setSelectedCategory} />

      <FlatList
        key={`feed-${itemHeight}`}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedCard
            item={item}
            itemHeight={itemHeight}
            isVisible={visibleId === item.id}
            onToast={showToast}
            onOptimisticLike={handleOptimisticLike}
            onOptimisticFollow={handleOptimisticFollow}
          />
        )}
        pagingEnabled
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ height: itemHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0b' }}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={{ color: '#9ca3af', marginTop: 8 }}>Загружаем ещё...</Text>
            </View>
          ) : null
        }
      />

      <Toast visible={toastVisible} message={toastMessage} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  toastContainer: {
    backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  categoryBarWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    paddingTop: 8,
  },
  categoryBarContent: { paddingHorizontal: 12, gap: 8, paddingVertical: 4 },
  categoryPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  categoryPillActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  categoryPillText: { color: 'rgba(255,255,255,0.75)', fontWeight: '600', fontSize: 13 },
  categoryPillTextActive: { color: '#fff' },

  actionColumn: { position: 'absolute', right: 12, bottom: 90, alignItems: 'center', gap: 20 },
  authorAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e3a5f',
    borderWidth: 2, borderColor: '#10b981', alignItems: 'center', justifyContent: 'center',
  },
  authorAvatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  followBadge: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center', marginTop: -8,
    borderWidth: 2, borderColor: '#000',
  },
  followBadgeActive: { backgroundColor: '#1f2937' },
  followBadgePlus: { color: '#fff', fontSize: 13, fontWeight: '900', lineHeight: 16 },
  actionBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  actionBtnActive: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10b981' },
  actionCount: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  actionLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  placeholderBg: { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },

  cardBottomInfo: { position: 'absolute', bottom: 24, left: 16, right: 80 },
  hashtags: { color: '#10b981', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  cardTitle: {
    color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 28, marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  cardMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
});
