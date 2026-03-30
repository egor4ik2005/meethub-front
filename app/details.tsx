import React from 'react';
import { View, Text, ScrollView, Image, Pressable, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Map, Heart, Calendar, MapPin, Share as ShareIcon } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MOSCOW_EVENTS } from '@/lib/mockData';
import { useFavorites } from '@/lib/FavoritesContext';

const { height } = Dimensions.get('window');

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Find the event from mock data, fall back to first one
  const event = MOSCOW_EVENTS.find((e) => e.id === id) ?? MOSCOW_EVENTS[0];
  const liked = isFavorite(event.id);

  const handleToggleFavorite = async () => {
    await Haptics.impactAsync(
      liked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    toggleFavorite(event);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Пойдем на ${event.title}! ${event.date} в ${event.time}. Место: ${event.location}`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Image */}
        <View style={{ height: height * 0.38 }} className="w-full bg-muted relative">
          <Image
            source={{ uri: event.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Dark gradient overlay */}
          <View className="absolute inset-0 bg-black/30" />

          {/* Category badge */}
          <View className="absolute bottom-4 left-4 bg-primary px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">{event.category}</Text>
          </View>

          {/* Navigation buttons */}
          <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-4 pt-4">
            <Pressable
              onPress={() => router.back()}
              className="bg-black/50 p-3 rounded-full"
            >
              <ArrowLeft size={22} color="white" />
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="bg-black/50 p-3 rounded-full"
            >
              <ShareIcon size={22} color="white" />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View className="p-5 pb-36">
          <Text className="text-white text-3xl font-extrabold leading-tight mb-3">
            {event.title}
          </Text>

          <View className="flex-row items-center gap-2 mb-2">
            <Calendar size={16} color="#1E9954" />
            <Text className="text-muted-foreground text-base">
              {event.date} | {event.time}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 mb-6">
            <MapPin size={16} color="#1E9954" />
            <Text className="text-muted-foreground text-base flex-1">{event.address}</Text>
          </View>

          {/* Описание */}
          <Text className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-3">
            ОПИСАНИЕ
          </Text>
          <Text className="text-white text-base leading-7 mb-8">
            {event.description}
          </Text>

          {/* Программа */}
          <Text className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-3">
            ПРОГРАММА
          </Text>
          <View className="gap-4 mb-8">
            {event.program.map((item, index) => (
              <View key={index} className="flex-row items-start gap-3">
                <View className="bg-primary rounded-full w-2 h-2 mt-2 shrink-0" />
                <Text className="text-white text-base flex-1">{item}</Text>
              </View>
            ))}
          </View>

          {/* Кто идет */}
          <Text className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-3">
            КТО ИДЕТ
          </Text>
          <View className="flex-row items-center mb-8">
            <View className="flex-row">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
              ].map((url, i) => (
                <Image
                  key={i}
                  source={{ uri: url }}
                  style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#121212', marginLeft: i === 0 ? 0 : -12 }}
                />
              ))}
            </View>
            <Text className="text-muted-foreground ml-3 text-sm font-medium leading-tight">
              +42 ваших друзей{'\n'}и других участников
            </Text>
          </View>

          {/* Место */}
          <Text className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-3">
            МЕСТО
          </Text>
          <View className="bg-card w-full h-44 rounded-2xl items-center justify-center border border-border">
            <Map size={48} color="#1E9954" />
            <Text className="text-muted-foreground mt-2 font-medium">{event.location}</Text>
            <Text className="text-muted-foreground text-sm mt-1">{event.address}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View className="absolute bottom-0 w-full px-5 pt-4 pb-8 bg-background border-t border-border">
        <Pressable className="w-full bg-primary rounded-xl flex-row justify-between items-center px-6 py-4">
          <Text className="text-white text-lg font-bold tracking-widest">КУПИТЬ БИЛЕТ</Text>
          <Text className="text-white text-lg font-bold">{event.price}</Text>
        </Pressable>

        <Pressable
          onPress={handleToggleFavorite}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          className="flex-row items-center justify-center gap-2 mt-4"
        >
          <Heart
            size={20}
            color={liked ? '#1E9954' : '#9ca3af'}
            fill={liked ? '#1E9954' : 'transparent'}
          />
          <Text
            style={{ color: liked ? '#1E9954' : '#9ca3af' }}
            className="font-semibold uppercase tracking-wider text-sm"
          >
            {liked ? 'В избранном ✓' : 'Добавить в избранное'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
