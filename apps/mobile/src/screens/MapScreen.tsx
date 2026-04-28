import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PointDetailSheet } from '../components/PointDetailSheet';
import { ZoneMarker } from '../components/ZoneMarker';
import { Colors } from '../constants/colors';
import { Radius, Spacing } from '../constants/typography';
import { GARAK_CENTER } from '../constants/zones';
import { useAppStore } from '../stores/useAppStore';
import { ZoneWithStatus } from '@grmap/shared/types';
import { getCongestionLevel } from '@grmap/shared/utils/report';

const GRAYSCALE_MAP_STYLE = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -60 }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
];

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const zones = useAppStore((state) => state.zones);
  const activeReports = useAppStore((state) => state.activeReports);
  const selectedZone = useAppStore((state) => state.selectedZone);
  const setSelectedZone = useAppStore((state) => state.setSelectedZone);
  const openWaitModal = useAppStore((state) => state.openWaitModal);

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
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={GRAYSCALE_MAP_STYLE}
        initialRegion={{
          latitude: GARAK_CENTER.lat,
          longitude: GARAK_CENTER.lng,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
      >
        {zonesWithStatus.map((zone) => (
          <ZoneMarker
            key={zone.id}
            zone={zone}
            isSelected={selectedZone?.id === zone.id}
            onPress={() => setSelectedZone(zone)}
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.topBar, { marginTop: insets.top + 12 }]}>
          <Text style={styles.logoText}>GRmap</Text>
        </View>

        <View style={styles.bottomArea}>
          <Pressable style={styles.bottomButton} onPress={() => openWaitModal()}>
            <Text style={styles.bottomButtonText}>대기시간 공유하기</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {selectedZone ? <PointDetailSheet zone={selectedZone} onClose={() => setSelectedZone(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  map: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: {
    alignSelf: 'flex-start',
    marginLeft: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  logoText: { color: Colors.text.inverse, fontSize: 15, fontWeight: '700' },
  bottomArea: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  bottomButton: {
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.action.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonText: { color: Colors.action.primaryFg, fontSize: 16, fontWeight: '600' },
});
