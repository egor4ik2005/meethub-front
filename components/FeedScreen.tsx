import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Share,
  Animated,
  Dimensions,
  ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { Calendar, MapPin, Heart, Share2, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MOSCOW_EVENTS, ORGANIZERS, type MeetEvent } from '@/lib/mockData';
import { useFavorites } from '@/lib/FavoritesContext';

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ visible, message }: { visible: boolean; message: string }) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      style={{
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        transform: [{ translateY }],
        opacity,
        zIndex: 99,
      }}
    >
      <View
        style={{
          backgroundColor: '#10b981',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 30,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Heart size={16} color="#fff" fill="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{message}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Right Action Column ───────────────────────────────────────────────────────

function ActionColumn({
  event,
  onToast,
}: {
  event: MeetEvent;
  onToast: (msg: string) => void;
}) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(event.id);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const organizer = ORGANIZERS.find((o) => o.id === event.organizerId) ?? ORGANIZERS[0];

  const handleAvatarPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/public-profile' as any, params: { userId: event.organizerId } });
  };

  const handleLike = async () => {
    await Haptics.impactAsync(
      liked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    // Pop animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    if (!liked) {
      onToast('Вы записаны на мероприятие!');
    }
    toggleFavorite(event);
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      title: event.title,
      message: `🗓 ${event.title}\n📍 ${event.address}\n🕐 ${event.date}, ${event.time}\n\nСкачай MeetHub и найди больше событий рядом!`,
    });
  };

  return (
    <View
      style={{
        position: 'absolute',
        right: 12,
        bottom: 90,
        alignItems: 'center',
        gap: 20,
      }}
    >
      {/* Organizer avatar */}
      <View style={{ alignItems: 'center', gap: 0 }}>
        <Pressable
          onPress={handleAvatarPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: organizer.avatarColor,
              borderWidth: 2,
              borderColor: '#10b981',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
              {organizer.avatarInitial}
            </Text>
          </View>
        </Pressable>
        {/* Plus badge */}
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#10b981',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -8,
            borderWidth: 2,
            borderColor: '#000',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', lineHeight: 16 }}>+</Text>
        </View>
      </View>

      {/* Like / Participate */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Pressable
          onPress={handleLike}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: liked ? 'rgba(16,185,129,0.2)' : 'rgba(0,0,0,0.5)',
                borderWidth: 1.5,
                borderColor: liked ? '#10b981' : 'rgba(255,255,255,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart
                size={24}
                color={liked ? '#10b981' : '#ffffff'}
                fill={liked ? '#10b981' : 'transparent'}
              />
            </View>
          </Animated.View>
        </Pressable>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' }}>
          Участвую
        </Text>
      </View>

      {/* Share */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Share2 size={22} color="#ffffff" />
          </View>
        </Pressable>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' }}>
          Поделиться
        </Text>
      </View>
    </View>
  );
}

// ─── Single Feed Card ──────────────────────────────────────────────────────────

function FeedCard({
  event,
  itemHeight,
  isVisible,
  onToast,
}: {
  event: MeetEvent;
  itemHeight: number;
  isVisible: boolean;
  onToast: (msg: string) => void;
}) {
  const router = useRouter();

  // Stub: log visibility for future video pause/play
  useEffect(() => {
    if (!isVisible) {
      // Future: pause video
    }
  }, [isVisible]);

  return (
    <View style={{ width: '100%', height: itemHeight, backgroundColor: '#000' }}>
      {/* Full-screen image */}
      <Image
        source={{ uri: event.imageUrl }}
        style={{
          position: 'absolute',
          width: '100%',
          height: itemHeight,
          backgroundColor: '#1a1a2e',
        }}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />

      {/* Dark gradient overlay (bottom 65%) */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: itemHeight * 0.65,
          backgroundColor: 'transparent',
        }}
      >
        {/* Multi-stop gradient via nested views */}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.0)' }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} />
      </View>

      {/* Category badge top-left */}
      <View
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          backgroundColor: '#10b981',
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{event.category}</Text>
      </View>

      {/* Bottom-left info */}
      <View
        style={{
          position: 'absolute',
          bottom: 24,
          left: 16,
          right: 80,
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: '900',
            lineHeight: 30,
            marginBottom: 8,
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        {/* Date & location */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Calendar size={13} color="rgba(255,255,255,0.8)" />
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' }}>
            {event.date} · {event.time}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <MapPin size={13} color="rgba(255,255,255,0.8)" />
          <Text
            style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' }}
            numberOfLines={1}
          >
            {event.location}
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(16,185,129,0.2)',
              borderWidth: 1,
              borderColor: '#10b981',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>{event.price}</Text>
          </View>
        </View>

        {/* Short description */}
        <Text
          style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18, marginBottom: 14 }}
          numberOfLines={2}
        >
          {event.description}
        </Text>

        {/* Details button */}
        <Pressable
          onPress={() => router.push({ pathname: '/details', params: { id: event.id } })}
          style={({ pressed }) => ({
            opacity: pressed ? 0.75 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: '#10b981',
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: 24,
            gap: 4,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Подробнее</Text>
          <ChevronRight size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Right action column */}
      <ActionColumn event={event} onToast={onToast} />
    </View>
  );
}

// ─── FeedScreen ───────────────────────────────────────────────────────────────

interface FeedScreenProps {
  availableHeight: number;
}

export function FeedScreen({ availableHeight }: FeedScreenProps) {
  const [visibleId, setVisibleId] = useState<string | null>(MOSCOW_EVENTS[0]?.id ?? null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setVisibleId(viewableItems[0].item.id);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const itemHeight = availableHeight > 0 ? availableHeight : Dimensions.get('window').height;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        key={`feed-${itemHeight}`}
        data={MOSCOW_EVENTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedCard
            event={item}
            itemHeight={itemHeight}
            isVisible={visibleId === item.id}
            onToast={showToast}
          />
        )}
        pagingEnabled
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />
      <Toast visible={toastVisible} message={toastMessage} />
    </View>
  );
}
