import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForkliftMapWebView } from '../components/ForkliftMapWebView';
import { PointDetailSheet } from '../components/PointDetailSheet';
import { Colors } from '../constants/colors';
import { useAppStore } from '../stores/useAppStore';
import type { ZoneWithStatus } from '@grmap/shared/types';
import { getCongestionLevel } from '@grmap/shared/utils/report';

/**
 * Forklift 3D 맵 — WebView + Three.js 번들.
 * WebGL은 실제 기기에서 확인하는 것을 권장합니다(시뮬레이터는 제한적일 수 있음).
 */
export function ForkliftMapScreen() {
  const insets = useSafeAreaInsets();
  const zones = useAppStore((state) => state.zones);
  const activeReports = useAppStore((state) => state.activeReports);
  const [selectedZone, setSelectedZone] = useState<ZoneWithStatus | null>(null);

  const zonesWithStatus = useMemo<ZoneWithStatus[]>(() => {
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
  }, [zones, activeReports]);

  return (
    <View style={styles.container}>
      <ForkliftMapWebView
        zones={zonesWithStatus}
        onZoneTap={(zoneId) => {
          const z = zonesWithStatus.find((x) => x.id === zoneId);
          if (z) setSelectedZone(z);
        }}
      />
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none" edges={['top', 'left', 'right']}>
        <View style={[styles.titlePill, { marginTop: insets.top + 8 }]}>
          <Text style={styles.titleText}>3D 가락시장</Text>
        </View>
      </SafeAreaView>
      {selectedZone ? <PointDetailSheet zone={selectedZone} onClose={() => setSelectedZone(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  topOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  titlePill: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15,17,24,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  titleText: {
    color: '#f5f6fa',
    fontSize: 13,
    fontWeight: '700',
  },
});
