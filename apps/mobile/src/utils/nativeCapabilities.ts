import { NativeModules } from 'react-native';

/** Expo Go 등 네이티브 바이너리에 AdMob이 없으면 false */
export function hasGoogleMobileAdsNativeModule(): boolean {
  return Boolean(NativeModules.RNGoogleMobileAdsModule);
}

/** EAS/스토어 빌드에 Firebase Analytics가 링크됐을 때만 true */
export function hasFirebaseAnalyticsNativeModule(): boolean {
  return Boolean(NativeModules.RNFBAnalyticsModule);
}
