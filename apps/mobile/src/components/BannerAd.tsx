import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { hasGoogleMobileAdsNativeModule } from '../utils/nativeCapabilities';

const PROD_BANNER_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID ?? 'ca-app-pub-XXXXXX/XXXXXX';

export function GRmapBannerAd() {
  const [banner, setBanner] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (!hasGoogleMobileAdsNativeModule()) return;

    let cancelled = false;
    void import('react-native-google-mobile-ads')
      .then(({ BannerAd, BannerAdSize, TestIds }) => {
        if (cancelled) return;
        const unitId = __DEV__ ? TestIds.BANNER : PROD_BANNER_UNIT_ID;
        setBanner(
          <View style={{ alignItems: 'center', backgroundColor: '#f5f5f5' }}>
            <BannerAd
              unitId={unitId}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        );
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return banner;
}
