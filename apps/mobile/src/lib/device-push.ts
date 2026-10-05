import type { createPushClient } from '@daegwang/api-client/push';
export type PushClient = ReturnType<typeof createPushClient>;
export type DevicePushState = { state: 'web' | 'setup' | 'off' | 'denied' | 'enabled' | 'pending'; canDisable: boolean };
export async function devicePushState(_client: PushClient, _owner: string): Promise<DevicePushState> { return { state: 'web', canDisable: false }; }
export async function enableDevicePush(_client: PushClient, _owner: string): Promise<void> { throw new Error('휴대폰에 설치한 앱에서 알림을 켜 주세요.'); }
export async function disableDevicePush(): Promise<void> {}
export async function reconcileDevicePush(_client: PushClient, _owner: string | null): Promise<void> {}
export function observeDevicePush(_client: PushClient, _owner: string | null, _open: (id: string) => void): () => void { return () => {}; }
export async function openPushSettings(): Promise<void> {}
