import { isIP } from 'node:net';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = value => typeof value === 'string' && value.trim().length > 0;

function httpsOrigin(value) {
  try {
    const u = new URL(value);
    const host = u.hostname.replace(/^\[|\]$/g, '');
    return u.protocol === 'https:' && !u.username && !u.password &&
      u.pathname === '/' && !u.search && !u.hash &&
      !isIP(host) && host.includes('.') &&
      !/(^|\.)(localhost|local|test|invalid|example)$/.test(host);
  } catch { return false; }
}

function publicKey(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('sb_publishable_') && value.length > 15) return true;
  try { return JSON.parse(Buffer.from(value.split('.')[1], 'base64url')).role === 'anon'; }
  catch { return false; }
}

// Pure local checks. Results contain fixed labels only, never configuration values.
export function pushReadiness({ app = {}, admin = {}, firebase, firebaseState = 'missing' } = {}) {
  const rows = [];
  const check = (id, label, ok, action) => rows.push({ id, label, status: ok ? 'PASS' : 'WAIT', ...(ok ? {} : { action }) });
  check('eas-project', '앱 EAS 프로젝트', uuid.test(app.EXPO_PUBLIC_EAS_PROJECT_ID ?? ''), 'Expo 프로젝트 연결 후 EXPO_PUBLIC_EAS_PROJECT_ID를 설정하세요.');
  check('same-project', '앱·서버 EAS 프로젝트 일치', uuid.test(admin.EXPO_PUSH_PROJECT_ID ?? '') && app.EXPO_PUBLIC_EAS_PROJECT_ID === admin.EXPO_PUSH_PROJECT_ID, '관리자 EXPO_PUSH_PROJECT_ID를 앱과 같은 UUID로 설정하세요.');
  check('api-origin', '휴대폰용 HTTPS API', httpsOrigin(app.EXPO_PUBLIC_API_BASE_URL), '휴대폰에서 접근할 관리자/API HTTPS origin을 설정하세요. 로컬 개발 주소는 APK 연결 준비로 인정하지 않습니다.');
  check('auth-project', '앱·서버 인증 프로젝트', httpsOrigin(app.EXPO_PUBLIC_SUPABASE_URL) && app.EXPO_PUBLIC_SUPABASE_URL === admin.NEXT_PUBLIC_SUPABASE_URL, '앱과 관리자의 Supabase 프로젝트 주소를 일치시키세요.');
  check('auth-key', '앱 공개 인증키', publicKey(app.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY), '앱에는 Supabase publishable/anon 키만 설정하세요.');
  check('no-server-secrets', '앱 서버 비밀값 제외', !Object.keys(app).some(key => /DATABASE|DIRECT_URL|SERVICE_ROLE|SECRET|PRIVATE_KEY|ACCESS_TOKEN|RATE_LIMIT_SALT/.test(key)), '서버 비밀키를 모바일 환경 파일에서 제거하세요.');
  const packageName = app.APP_ANDROID_PACKAGE ?? 'org.daegwangchurch.app';
  check('android-package', 'Android 패키지 이름', /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(packageName), 'Firebase 등록 전 APP_ANDROID_PACKAGE를 확정하세요.');
  const privateFile = !!firebase && (firebase.type === 'service_account' || 'private_key' in firebase || 'private_key_id' in firebase);
  check('firebase-file', 'Firebase 앱 설정 파일', firebaseState === 'loaded' && !privateFile,
    privateFile ? '비밀 서비스 계정 파일을 앱 설정으로 지정했습니다. GOOGLE_SERVICES_JSON에는 Android google-services.json만 사용하세요. 비밀키는 EAS Credentials에 별도로 등록하세요.' : 'GOOGLE_SERVICES_JSON 경로의 Android 설정 JSON을 읽을 수 있는지 확인하세요. 경로 기준은 apps/mobile입니다.');
  const info = !privateFile && firebaseState === 'loaded' ? firebase?.project_info : undefined;
  check('firebase-project', 'Firebase 프로젝트 설정', text(info?.project_id) && /^\d+$/.test(info?.project_number ?? ''), 'Firebase 콘솔에서 Android 앱 설정 파일을 다시 내려받으세요.');
  const client = !privateFile && Array.isArray(firebase?.client) ? firebase.client.find(row => row?.client_info?.android_client_info?.package_name === packageName) : undefined;
  check('firebase-package', 'Firebase와 Android 앱 일치', !!client && text(client.client_info?.mobilesdk_app_id) && Array.isArray(client.api_key) && client.api_key.some(key => text(key?.current_key)), '확정한 Android 패키지로 등록한 Firebase 앱의 google-services.json을 사용하세요.');
  check('server-notifications', '서버 알림 기능', admin.APP_MEMBER_NOTIFICATIONS_ENABLED === 'true', '검증된 서버에서 APP_MEMBER_NOTIFICATIONS_ENABLED를 설정하세요.');
  check('worker-secret', '서버 주기 작업 비밀값', (admin.APP_PUSH_WORKER_SECRET?.length ?? 0) >= 32, '관리자 서버에 32자 이상 난수 APP_PUSH_WORKER_SECRET을 설정하세요. 앱에는 넣지 마세요.');
  const active = admin.APP_PUSH_ENABLED === 'true' && admin.APP_PUSH_WORKER_READY === 'true';
  rows.push({ id: 'sending', label: '실제 발송 플래그', status: 'INFO', action: active ? '현재 로컬 설정은 발송 활성입니다. 이 검사는 발송하지 않습니다.' : '현재 로컬 설정은 발송 비활성입니다. 계정·배포·크론 검증 전에는 유지하세요.' });
  rows.push({ id: 'external', label: '외부 연결·실기기 확인', status: 'MANUAL', action: 'EAS 환경변수·FCM V1 자격·HTTPS API 응답·크론 실행·APK 수신은 별도 검증해야 합니다. 로컬 PASS는 이를 보장하지 않습니다.' });
  return rows;
}
