import { View } from 'react-native';
import { WebView } from 'react-native-webview';
export function LocationMap({ url }: { url: string }) {
  return <View style={{ height: 260, borderRadius: 16, overflow: 'hidden' }}><WebView source={{ uri: url }} style={{ flex: 1 }} originWhitelist={['https://*']} /></View>;
}
