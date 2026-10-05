import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  return {
    ...config, name: config.name ?? '대광교회', slug: config.slug ?? 'daegwang-church',
    android: { ...config.android, package: process.env.APP_ANDROID_PACKAGE ?? 'org.daegwangchurch.app', ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}) },
    ios: { ...config.ios, bundleIdentifier: process.env.APP_IOS_BUNDLE_ID ?? 'org.daegwangchurch.app' },
    extra: { ...config.extra, ...(projectId ? { eas: { projectId } } : {}) },
  };
};
