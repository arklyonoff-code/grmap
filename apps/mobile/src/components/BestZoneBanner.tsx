import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ZoneWithStatus } from '@grmap/shared/types';
import { WAIT_LABELS } from '@grmap/shared/utils/report';

interface Props {
  zones: ZoneWithStatus[];
  onPress: (zone: ZoneWithStatus) => void;
}

const SCORE: Record<ZoneWithStatus['congestionLevel'], number> = {
  green: 0,
  yellow: 1,
  red: 2,
  unknown: 3,
};

export function BestZoneBanner({ zones, onPress }: Props) {
  const best = useMemo(() => {
    const ranked = [...zones]
      .filter((z) => z.congestionLevel !== 'unknown')
      .sort((a, b) => SCORE[a.congestionLevel] - SCORE[b.congestionLevel]);
    return ranked[0];
  }, [zones]);

  if (!best) return null;

  const isGreen = best.congestionLevel === 'green';
  const isYellow = best.congestionLevel === 'yellow';
  const bg = isGreen ? '#1D9E75' : isYellow ? '#EF9F27' : '#E24B4A';

  return (
    <TouchableOpacity
      onPress={() => onPress(best)}
      activeOpacity={0.85}
      style={[styles.banner, { backgroundColor: bg }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerLabel}>지금 가장 빠른 구역</Text>
        <Text style={styles.bannerZone}>{best.name}</Text>
        <Text style={styles.bannerWait}>
          {best.latestReport ? WAIT_LABELS[best.latestReport.waitLevel] : '정보 없음'}
        </Text>
      </View>
      <View style={styles.bannerArrow}>
        <Text style={styles.bannerArrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  bannerZone: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  bannerWait: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  bannerArrow: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerArrowText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
