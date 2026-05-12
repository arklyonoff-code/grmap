import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BestZoneBanner } from '../components/BestZoneBanner';
import { OfflineCacheBanner } from '../components/OfflineCacheBanner';
import { WeatherWarningBanner } from '../components/WeatherWarningBanner';
import { HyperMap3D } from '../components/HyperMap3D';
import { PointDetailSheet } from '../components/PointDetailSheet';
import { Colors } from '../constants/colors';
import { DANGER_ZONES } from '../constants/dangerZones';
import { Radius, Spacing } from '../constants/typography';
import { useAppStore } from '../stores/useAppStore';
import { trackEvent } from '../services/analytics';
import { ZoneWithStatus } from '@grmap/shared/types';
import { getCongestionLevel } from '@grmap/shared/utils/report';
import { loadFromCache } from '../services/cache';
import { getCurrentWeather, type WeatherInfo } from '../services/weather';

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const zones = useAppStore((state) => state.zones);
  const activeReports = useAppStore((state) => state.activeReports);
  const setZones = useAppStore((state) => state.setZones);
  const setActiveReports = useAppStore((state) => state.setActiveReports);
  const selectedZone = useAppStore((state) => state.selectedZone);
  const setSelectedZone = useAppStore((state) => state.setSelectedZone);
  const openWaitModal = useAppStore((state) => state.openWaitModal);
  const [isOffline, setIsOffline] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [weather, setWeather] = useState<WeatherInfo>({
    status: 'unknown',
    description: '',
    isDangerous: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected ?? false));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOffline) {
      setCacheAge(null);
      return;
    }
    const applyCache = () => {
      void loadFromCache().then((cache) => {
        if (!cache) return;
        setZones(cache.zones);
        setActiveReports(cache.reports);
        if (cache.cachedAt) {
          setCacheAge(Math.floor((Date.now() - cache.cachedAt) / 60_000));
        }
      });
    };
    applyCache();
    const interval = setInterval(applyCache, 60_000);
    return () => clearInterval(interval);
  }, [isOffline, setActiveReports, setZones]);

  useEffect(() => {
    const interval = setInterval(() => {
      void getCurrentWeather().then(setWeather);
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      void getCurrentWeather().then((next) => {
        if (!cancelled) setWeather(next);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const zonesWithStatus = useMemo<ZoneWithStatus[]>(
    () => {
      const reportMap = new Map<string, (typeof activeReports)[number]>();
      activeReports.forEach((report) => {
        const prev = reportMap.get(report.zoneId);
        if (!prev || report.createdAt > prev.createdAt) {
          reportMap.set(report.zoneId, report);
        }
      });
      return zones.map((zone) => {
        const latestReport = reportMap.get(zone.id) ?? null;
        return {
          ...zone,
          latestReport,
          congestionLevel: getCongestionLevel(latestReport),
        };
      });
    },
    [zones, activeReports]
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapLayer} collapsable={false}>
      <HyperMap3D
        zones={zonesWithStatus}
        selectedZoneId={selectedZone?.id ?? null}
        dangerZones={DANGER_ZONES}
        isWeatherDangerous={weather.isDangerous}
        onZoneTap={(zoneId) => {
          const zone = zonesWithStatus.find((z) => z.id === zoneId);
          if (!zone) return;
          void trackEvent('zone_marker_tap', { zone_id: zoneId, source: 'hyper_map_3d' });
          setSelectedZone(zone);
        }}
      />
      </View>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none" edges={['top', 'left', 'right']}>
        <View style={styles.overlayColumn}>
          <View>
            <View style={[styles.topBar, { marginTop: insets.top + 12 }]}>
              <Text style={styles.logoText}>GRmap</Text>
            </View>
            {isOffline ? <OfflineCacheBanner cacheAgeMinutes={cacheAge} /> : null}
            <WeatherWarningBanner weather={weather} />
            <BestZoneBanner
              zones={zonesWithStatus}
              onPress={(zone) => {
                void trackEvent('zone_marker_tap', { zone_id: zone.id, source: 'best_banner' });
                setSelectedZone(zone);
              }}
            />
          </View>
          <View style={{ flex: 1 }} />
          <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable style={styles.bottomButton} onPress={() => openWaitModal()}>
              <Text style={styles.bottomButtonText}>대기시간 공유하기</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {selectedZone ? <PointDetailSheet zone={selectedZone} onClose={() => setSelectedZone(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  overlayColumn: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    alignSelf: 'flex-start',
    marginLeft: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  logoText: { color: Colors.text.inverse, fontSize: 15, fontWeight: '700' },
  bottomArea: { paddingHorizontal: Spacing.md },
  bottomButton: {
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.action.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonText: { color: Colors.action.primaryFg, fontSize: 16, fontWeight: '600' },
});
