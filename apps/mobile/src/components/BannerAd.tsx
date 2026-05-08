import React from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const PROD_BANNER_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID ?? 'ca-app-pub-XXXXXX/XXXXXX';

const unitId = __DEV__ ? TestIds.BANNER : PROD_BANNER_UNIT_ID;

export function GRmapBannerAd() {
  return (
    <View style={{ alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
