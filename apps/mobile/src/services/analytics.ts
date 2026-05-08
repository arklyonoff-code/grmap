/**
 * Firebase Analytics — 네이티브 빌드(EAS 등)에서 동작합니다. Expo Go에서는 무시됩니다.
 */
export async function trackEvent(
  event: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  try {
    const { default: analytics } = await import('@react-native-firebase/analytics');
    await analytics().logEvent(event, params as Record<string, unknown>);
  } catch {
    // 모듈 미포함·미초기화 시에도 앱 동작 유지
  }
}
