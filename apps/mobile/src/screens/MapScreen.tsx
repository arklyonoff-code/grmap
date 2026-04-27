import React, { useMemo } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PointDetailSheet } from '../components/PointDetailSheet';
import { ZoneMarker } from '../components/ZoneMarker';
import { Colors } from '../constants/colors';
import { Radius, Spacing } from '../constants/typography';
import { GARAK_CENTER } from '../constants/zones';
import { useAppStore } from '../stores/useAppStore';
import { ZoneWithStatus } from '@grmap/shared/types';
import { getCongestionLevel } from '@grmap/shared/utils/report';

const GRAYSCALE_MAP_STYLE = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -35 }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#EDE8DA' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#DDE8D3' }] },
  { featureType: 'administrative.land_parcel', elementType: 'geometry', stylers: [{ color: '#F7F5EF' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F1EFE8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#E8E3D7' }] },
  { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE2EC' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6F8FA3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F3D8D1' }] },
];

export function MapScreen() {
  const zones = useAppStore((state) => state.zones);
  const activeReports = useAppStore((state) => state.activeReports);
  const selectedZone = useAppStore((state) => state.selectedZone);
  const setSelectedZone = useAppStore((state) => state.setSelectedZone);
  const openWaitModal = useAppStore((state) => state.openWaitModal);

  const zonesWithStatus = useMemo<ZoneWithStatus[]>(
    () =>
      zones.map((zone) => {
        const latestReport =
          activeReports
            .filter((r) => r.zoneId === zone.id)
            .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
        return {
          ...zone,
          latestReport,
          congestionLevel: getCongestionLevel(latestReport),
        };
      }),
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
        <View style={styles.topBar}>
          <Image source={require('../../assets/grmap-logo.png')} style={styles.logo} resizeMode="contain" />
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
    marginTop: Spacing.sm,
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(17,17,17,0.45)',
  },
  logo: { width: 92, height: 32 },
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
