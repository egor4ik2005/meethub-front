import React, { useRef, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Music, Palette, Mic, TreePine } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MOSCOW_EVENTS } from '@/lib/mockData';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'Музыка': Music,
  'Искусство': Palette,
  'Дизайн': Palette,
  'Конференция': Mic,
  'default': TreePine,
};

// Yandex Maps HTML template (memoised outside component so it never regenerates)
const markerCoords = MOSCOW_EVENTS.map((e) =>
  `{lat:${e.latitude},lng:${e.longitude},title:"${e.title}"}`
).join(',');

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #121212; }
  #map { width: 100%; height: 100%; filter: invert(90%) hue-rotate(180deg) contrast(85%) brightness(0.85); }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://api-maps.yandex.ru/2.1/?apikey=demoapikey&lang=ru_RU" type="text/javascript"></script>
<script>
var events = [${markerCoords}];
ymaps.ready(function() {
  var myMap = new ymaps.Map('map', {
    center: [55.753333, 37.622222],
    zoom: 11,
    controls: []
  });

  events.forEach(function(e) {
    var layout = ymaps.templateLayoutFactory.createClass(
      '<div style="background:#121212;border:2px solid #1E9954;border-radius:999px;padding:4px 10px;white-space:nowrap;">' +
      '<span style="color:#1E9954;font-size:10px;">●</span> ' +
      '<span style="color:#fff;font-size:10px;font-weight:bold;">' + e.title + '</span>' +
      '</div>'
    );
    var placemark = new ymaps.Placemark(
      [e.lat, e.lng],
      {},
      {
        iconLayout: layout,
        iconShape: { type: 'Rectangle', coordinates: [[-60, -16], [60, 16]] }
      }
    );
    myMap.geoObjects.add(placemark);
  });
});
</script>
</body>
</html>`;

export function MapScreen() {
  const router = useRouter();
  // Stable ref so WebView does NOT remount when parent re-renders (preserves map zoom/position)
  const webViewRef = useRef<WebView>(null);

  const handleSeeMore = useCallback((id: string) => {
    router.push({ pathname: '/details', params: { id } });
  }, [router]);

  return (
    <View className="flex-1">
      {/* WebView with stable source — never recreated so map state is preserved */}
      <WebView
        ref={webViewRef}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        source={{ html: MAP_HTML }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        // Prevent re-render from resetting zoom
        cacheEnabled
      />

      {/* Floating carousel */}
      <View className="absolute bottom-6 w-full">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
          data={MOSCOW_EVENTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const Icon = CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS['default'];
            return (
              <View style={{ width: CARD_WIDTH }} className="bg-card rounded-2xl p-3 flex-row gap-4 border border-border">
                <View className="w-20 h-20 rounded-xl bg-muted items-center justify-center overflow-hidden">
                  <Icon size={28} color="#1E9954" />
                </View>
                <View className="flex-1 justify-between py-1">
                  <View>
                    <Text className="text-foreground font-bold text-base leading-tight" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-muted-foreground text-xs mt-1">
                      {item.date} | {item.time}
                    </Text>
                    <Text className="text-muted-foreground text-xs">{item.location}</Text>
                  </View>
                  <View className="flex-row justify-end mt-2">
                    {/* ✅ "Смотреть" button navigates to EventDetailsScreen */}
                    <Pressable
                      onPress={() => handleSeeMore(item.id)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                      className="bg-primary px-3 py-1.5 rounded-full"
                    >
                      <Text className="text-white text-xs font-semibold">Смотреть</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}
