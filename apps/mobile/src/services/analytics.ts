import { hasFirebaseAnalyticsNativeModule } from '../utils/nativeCapabilities';

/** Firebase Analytics — EAS/스토어 빌드에서만 동작. Expo Go에서는 no-op */
export async function trackEvent(
  event: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  if (!hasFirebaseAnalyticsNativeModule()) return;
  try {
    const { default: analytics } = await import('@react-native-firebase/analytics');
    await analytics().logEvent(event, params as Record<string, unknown>);
  } catch {
    // 모듈 미포함·미초기화 시에도 앱 동작 유지
  }
}
