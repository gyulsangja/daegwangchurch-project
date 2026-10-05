import { Tabs } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../components/ui';

const tabs = [
  { name: 'index', title: '홈', icon: require('../../../assets/tab-icons/home.png') },
  { name: 'worship', title: '말씀', icon: require('../../../assets/tab-icons/worship.png') },
  { name: 'news', title: '소식', icon: require('../../../assets/tab-icons/news.png') },
  { name: 'church', title: '교회', icon: require('../../../assets/tab-icons/church.png') },
  { name: 'my', title: '나의', icon: require('../../../assets/tab-icons/my.png') },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 24);
  return <Tabs backBehavior="history" screenOptions={{ headerShown: false }} tabBar={({ state, navigation }) =>
    <View style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, paddingBottom: bottom }}>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', paddingTop: 10, paddingHorizontal: 20, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        {tabs.map((tab) => {
          const route = state.routes.find((entry) => entry.name === tab.name)!;
          const selected = state.routes[state.index].key === route.key;
          return <Pressable key={tab.name} accessibilityRole="tab" accessibilityLabel={`${tab.title} 탭`} aria-selected={selected} accessibilityState={{ selected }}
            onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params); }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={({ pressed }) => ({ flex: 1, minHeight: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: selected ? colors.soft : 'transparent', opacity: pressed ? 0.65 : 1 })}>
            <Image source={tab.icon} style={{ width: 24, height: 24 }} accessible={false} />
            <Text style={{ fontFamily: selected ? 'NotoSansKR_700Bold' : 'NotoSansKR_400Regular', fontSize: 14, lineHeight: 21, color: selected ? colors.primary : colors.muted }}>{tab.title}</Text>
          </Pressable>;
        })}
      </View>
    </View>
  }>
    {tabs.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />)}
  </Tabs>;
}
