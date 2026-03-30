import React, { useRef, useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Dimensions, Image, Alert } from 'react-native';
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
  `{id:"${e.id}",lat:${e.latitude},lng:${e.longitude},title:"${e.title}"}`
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
window.placemarks = {};

ymaps.ready(function() {
  var myMap = new ymaps.Map('map', {
    center: [55.753333, 37.622222],
    zoom: 11,
    controls: []
  });

  function getDefaultLayout(e) {
    return ymaps.templateLayoutFactory.createClass(
      '<div style="background:#121212;border:2px solid #1E9954;border-radius:999px;padding:4px 10px;white-space:nowrap;opacity:0.85;">' +
      '<span style="color:#1E9954;font-size:10px;">●</span> ' +
      '<span style="color:#fff;font-size:10px;font-weight:bold;">' + e.title + '</span>' +
      '</div>'
    );
  }

  function getActiveLayout(e) {
    return ymaps.templateLayoutFactory.createClass(
      '<div style="background:#1E9954;border:2px solid #fff;border-radius:999px;padding:6px 14px;white-space:nowrap;box-shadow:0 0 10px #1E9954;z-index:999;">' +
      '<span style="color:#fff;font-size:12px;font-weight:bold;">' + e.title + '</span>' +
      '</div>'
    );
  }

  window.setActiveItem = function(id) {
    if (window.placemarks[id]) {
      myMap.panTo(window.placemarks[id].geometry.getCoordinates(), { flying: true, duration: 400 });
      for (var key in window.placemarks) {
        var p = window.placemarks[key];
        var ev = events.find(function(item) { return item.id === key; });
        p.options.set('iconLayout', (key === id) ? getActiveLayout(ev) : getDefaultLayout(ev));
        p.options.set('zIndex', (key === id) ? 999 : 1);
      }
    }
  };

  events.forEach(function(e) {
    var placemark = new ymaps.Placemark(
      [e.lat, e.lng],
      {},
      {
        iconLayout: getDefaultLayout(e)
      }
    );
    placemark.events.add('click', function () {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
         window.ReactNativeWebView.postMessage(String(e.id));
      }
    });
    window.placemarks[e.id] = placemark;
    myMap.geoObjects.add(placemark);
  });
});
</script>
</body>
</html>`;

export function MapScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleSeeMore = useCallback((id: string) => {
    router.push({ pathname: '/details', params: { id } });
  }, [router]);

  const handleMessage = useCallback((event: any) => {
    const id = event.nativeEvent.data;
    const index = MOSCOW_EVENTS.findIndex(e => e.id === id);
    if (index !== -1 && flatListRef.current) {
      setActiveIndex(index);
      try {
        flatListRef.current.scrollToIndex({ index, animated: true });
      } catch (e) {
        console.error('[MapScreen] Scroll failed:', e);
      }
    }
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null) {
        setActiveIndex(index);
        const eventId = viewableItems[0].item.id;
        webViewRef.current?.injectJavaScript(`
          if (window.setActiveItem) window.setActiveItem('${eventId}');
          true;
        `);
      }
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

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
        onMessage={handleMessage}
      />

      {/* Floating carousel */}
      <View className="absolute bottom-6 w-full">
        <FlatList
          ref={flatListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
          data={MOSCOW_EVENTS}
          keyExtractor={(item) => item.id}
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + 16,
            offset: (CARD_WIDTH + 16) * index,
            index,
          })}
          renderItem={({ item, index }) => {
            const Icon = CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS['default'];
            return (
              <View style={{ width: CARD_WIDTH, opacity: activeIndex === index ? 1 : 0.6 }} className="bg-card rounded-2xl p-3 flex-row gap-4 border border-border">
                <View className="w-20 h-20 rounded-xl bg-muted items-center justify-center overflow-hidden">
                  <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop' }} className="w-full h-full" resizeMode="cover" />
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
