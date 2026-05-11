import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WeatherInfo } from '../services/weather';

interface Props {
  weather: WeatherInfo;
}

export function WeatherWarningBanner({ weather }: Props) {
  if (!weather.isDangerous) return null;

  const isSnow = weather.status === 'snow';
  const bg = isSnow ? '#1D4ED8' : '#EF9F27';
  const icon = isSnow ? '❄️' : '🌧️';

  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{isSnow ? '눈 주의' : '비 주의'} — 지하층 미끄러움</Text>
        <Text style={styles.sub}>지하 1~2층 이동 시 속도를 줄이세요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: { fontSize: 24 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
