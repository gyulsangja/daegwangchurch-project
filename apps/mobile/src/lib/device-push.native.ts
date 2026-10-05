import { AppState, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { z } from 'zod';
import { pushRegistrationSchema } from '@daegwang/contracts/features/member/push';
import { revokePush } from '@daegwang/api-client/push';
import type { DevicePushState, PushClient } from './device-push';

const storageKey = 'daegwang.push.installation.v1';
const storedSchema = pushRegistrationSchema.extend({ owner: z.uuid(), revokePending: z.boolean() });
type Stored = z.infer<typeof storedSchema>;
let activeOwner: string | null = null;
let operations: Promise<unknown> = Promise.resolve();
function serial<T>(operation: () => Promise<T>): Promise<T> { const result = operations.then(operation, operation); operations = result.catch(() => {}); return result; }
const project = () => z.uuid().safeParse(Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId);
const supported = () => Constants.executionEnvironment !== 'storeClient' && project().success;
async function channelBlocked() { return Platform.OS === 'android' && (await Notifications.getNotificationChannelAsync('church-updates'))?.importance === Notifications.AndroidImportance.NONE; }
async function read(): Promise<Stored | null> {
  const raw = await SecureStore.getItemAsync(storageKey); if (!raw) return null;
  const parsed = storedSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error('기기 알림 정보를 읽지 못했습니다. 휴대폰 설정에서 알림을 확인해 주세요.');
  return parsed.data;
}
const write = (record: Stored) => SecureStore.setItemAsync(storageKey, JSON.stringify(record));
async function revokeStored() {
  const stored = await read(); if (!stored) return;
  await write({ ...stored, revokePending: true });
  await Notifications.dismissAllNotificationsAsync();
  await revokePush(process.env.EXPO_PUBLIC_API_BASE_URL, { installationId: stored.installationId, secret: stored.secret });
  await SecureStore.deleteItemAsync(storageKey);
}
async function token() {
  const id = project(); if (!id.success) throw new Error('휴대폰 알림 연결을 준비하고 있습니다.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([Notifications.getExpoPushTokenAsync({ projectId: id.data }), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 20000); })]);
    return { token: result.data, projectId: id.data };
  } catch { throw new Error('휴대폰 알림을 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.'); }
  finally { clearTimeout(timer); }
}
function registration(record: Stored) { return pushRegistrationSchema.parse({ installationId: record.installationId, secret: record.secret, token: record.token, platform: record.platform, projectId: record.projectId }); }
Notifications.setNotificationHandler({ handleNotification: async () => {
  const stored = await read().catch(() => null); const show = !!activeOwner && stored?.owner === activeOwner && !stored.revokePending;
  return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
} });
export async function devicePushState(client: PushClient, owner: string): Promise<DevicePushState> {
  const stored = await read(); const canDisable = !!stored;
  if (stored?.revokePending) return { state: 'pending', canDisable };
  if (!supported()) return { state: 'setup', canDisable };
  const permission = await Notifications.getPermissionsAsync();
  if ((!permission.granted && !permission.canAskAgain) || await channelBlocked()) return { state: 'denied', canDisable };
  const remote = await client.status();
  if (!remote.available) return { state: 'setup', canDisable };
  return { state: permission.granted && stored?.owner === owner && remote.devices.some(device => device.id === stored.installationId) ? 'enabled' : 'off', canDisable };
}
export function enableDevicePush(client: PushClient, owner: string) {
  return serial(async () => {
    if (!supported() || !(await client.status()).available) throw new Error('휴대폰 알림 연결을 준비하고 있습니다.');
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('church-updates', { name: '말씀과 교회 소식', importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted || await channelBlocked()) throw new Error('알림 권한이 꺼져 있습니다. 휴대폰 설정에서 대광교회 알림을 허용해 주세요.');
    let stored = await read();
    if (stored && (stored.owner !== owner || stored.revokePending)) { await revokeStored(); stored = null; }
    const nativeToken = await token();
    const record: Stored = { installationId: stored?.installationId ?? Crypto.randomUUID(), secret: stored?.secret ?? Crypto.randomUUID() + Crypto.randomUUID(), ...nativeToken, platform: Platform.OS === 'ios' ? 'ios' : 'android', owner, revokePending: false };
    // Save the unsubscribe capability before HTTP: registration may succeed despite a lost response.
    await write(record); await client.register(registration(record)); activeOwner = owner;
  });
}
export function disableDevicePush(): Promise<void> { activeOwner = null; return serial(revokeStored); }
export function reconcileDevicePush(client: PushClient, owner: string | null): Promise<void> {
  activeOwner = owner;
  return serial(async () => {
    const stored = await read(); if (!stored) return;
    if (stored.revokePending || (owner && stored.owner !== owner)) { await revokeStored(); return; }
    // Closing the app does not withdraw consent. An explicit logout does.
    if (!owner || !supported()) return;
    if (!(await Notifications.getPermissionsAsync()).granted || await channelBlocked()) { await revokeStored(); return; }
    if (!(await client.status()).available) return;
    const next = { ...stored, ...await token() }; await write(next); await client.register(registration(next));
  });
}
export function observeDevicePush(client: PushClient, owner: string | null, open: (id: string) => void): () => void {
  activeOwner = owner;
  if (Constants.executionEnvironment === 'storeClient') return () => {};
  const reconcile = () => { void reconcileDevicePush(client, owner).catch(() => {}); };
  reconcile();
  const app = AppState.addEventListener('change', state => { if (state === 'active') reconcile(); });
  const rotation = Notifications.addPushTokenListener(reconcile);
  let alive = true; const seen = new Set<string>();
  const respond = (response: Notifications.NotificationResponse | null) => {
    if (!alive || !response) return;
    const id = response.notification.request.content.data?.notificationId;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || seen.has(response.notification.request.identifier)) return;
    seen.add(response.notification.request.identifier); open(id);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  };
  const listener = Notifications.addNotificationResponseReceivedListener(respond);
  void Notifications.getLastNotificationResponseAsync().then(respond).catch(() => {});
  return () => { alive = false; app.remove(); rotation.remove(); listener.remove(); };
}
export async function openPushSettings() { await Linking.openSettings(); }
