import React from 'react';
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { Calendar, MapPin, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MOSCOW_EVENTS, type MeetEvent } from '@/lib/mockData';
import { useFavorites } from '@/lib/FavoritesContext';

function HeartButton({ event }: { event: MeetEvent }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(event.id);

  const handlePress = async () => {
    await Haptics.impactAsync(
      liked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    toggleFavorite(event);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      className="absolute top-3 right-3 bg-black/50 p-2 rounded-full"
    >
      <Heart
        size={18}
        color={liked ? '#1E9954' : '#ffffff'}
        fill={liked ? '#1E9954' : 'transparent'}
      />
    </Pressable>
  );
}

export function FeedScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background pt-2">
      <FlatList
        data={MOSCOW_EVENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
            className="bg-card rounded-2xl overflow-hidden mx-4 mb-6 border border-border"
          >
            {/* Cover Image */}
            <View className="relative">
              <Image
                source={{ uri: item.imageUrl }}
                className="w-full h-48"
                resizeMode="cover"
              />
              {/* Category badge */}
              <View className="absolute top-3 left-3 bg-primary px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">{item.category}</Text>
              </View>
              {/* Heart button - sits on the image */}
              <HeartButton event={item} />
            </View>

            <View className="p-4">
              <Text className="text-foreground text-xl font-bold mb-3" numberOfLines={2}>
                {item.title}
              </Text>

              <View className="flex-row items-center gap-2 mb-2">
                <Calendar size={15} color="#9ca3af" />
                <Text className="text-muted-foreground text-sm flex-1">
                  {item.date} | {item.time}
                </Text>
                <View className="bg-muted px-2 py-0.5 rounded-full">
                  <Text className="text-primary text-xs font-semibold">{item.price}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2 mb-3">
                <MapPin size={15} color="#9ca3af" />
                <Text className="text-muted-foreground text-sm flex-1">{item.address}</Text>
              </View>

              <Text className="text-muted-foreground text-sm leading-5" numberOfLines={3}>
                {item.description}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
