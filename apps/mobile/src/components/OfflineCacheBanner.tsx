import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  cacheAgeMinutes: number | null;
};

export function OfflineCacheBanner({ cacheAgeMinutes }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📶</Text>
      <Text style={styles.text}>
        오프라인 —{' '}
        {cacheAgeMinutes !== null
          ? `${cacheAgeMinutes}분 전 정보 표시 중`
          : '마지막 저장 정보 표시 중'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#374151',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: { fontSize: 16 },
  text: { fontSize: 13, color: '#F9FAFB', flex: 1 },
});
