import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Radius, Spacing, Typography } from '../constants/typography';
import { useAppStore } from '../stores/useAppStore';
import { WaitReport } from '@grmap/shared/types';
import { getCongestionLevel, getElapsedText, getWaitLevelLabel, isReportStale } from '@grmap/shared/utils/report';

const FILTERS = ['전체', '채소1동', '채소2동', '과일동', '수산동', '건어물동'] as const;

export function FeedScreen() {
  const zones = useAppStore((state) => state.zones);
  const activeReports = useAppStore((state) => state.activeReports);
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]>('전체');

  const filtered = useMemo(() => {
    const sorted = [...activeReports].sort((a, b) => b.createdAt - a.createdAt);
    if (selectedFilter === '전체') return sorted;
    const zone = zones.find((z) => z.name === selectedFilter);
    if (!zone) return [];
    return sorted.filter((report) => report.zoneId === zone.id);
  }, [activeReports, selectedFilter, zones]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      >
        {FILTERS.map((filter) => {
          const selected = selectedFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedItem item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={32} color={Colors.status.unknown} />
            <Text style={styles.emptyText}>아직 제보가 없어요</Text>
          </View>
        }
        contentContainerStyle={[styles.listContent, !filtered.length && styles.emptyWrap]}
      />
    </View>
  );
}

function FeedItem({ item }: { item: WaitReport }) {
  const zones = useAppStore((state) => state.zones);
  const zoneName = zones.find((z) => z.id === item.zoneId)?.name ?? '알 수 없음';
  const isStale = isReportStale(item.createdAt);
  const vehicleLabel =
    item.vehicleSize === '1ton' ? '1톤' : item.vehicleSize === '5ton' ? '5톤' : item.vehicleSize === '11ton_plus' ? '11톤+' : '미선택';
  const zone = zones.find((z) => z.id === item.zoneId);
  const level = getCongestionLevel(item);
  const dotColor =
    level === 'green'
      ? Colors.status.clear
      : level === 'yellow'
        ? Colors.status.caution
        : level === 'red'
          ? Colors.status.congested
          : Colors.status.unknown;

  return (
    <View style={[styles.item, isStale && styles.stale]}>
      <View style={styles.topRow}>
        <View style={styles.zoneRow}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.zoneName}>{zone?.name ?? zoneName}</Text>
          <PlatformBadge platform={item.platform} />
        </View>
        <Text style={styles.timeText}>{getElapsedText(item.createdAt)}</Text>
      </View>
      <Text style={styles.primaryText}>
        {getWaitLevelLabel(item.waitLevel)}
        {item.vehicleSize ? ` · ${vehicleLabel}` : ''}
      </Text>
    </View>
  );
}

function PlatformBadge({ platform }: { platform: WaitReport['platform'] }) {
  const isWeb = platform === 'web';
  return (
    <View style={[styles.platformBadge, isWeb ? styles.webBadge : styles.appBadge]}>
      <Text style={[styles.platformBadgeText, isWeb ? styles.webBadgeText : styles.appBadgeText]}>
        {isWeb ? '웹' : '앱'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  filterRow: { paddingHorizontal: 12, gap: 8, paddingVertical: 10 },
  filterChip: {
    height: 34,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.bg.base,
  },
  filterChipSelected: { backgroundColor: Colors.text.primary, borderColor: Colors.text.primary },
  filterText: { color: Colors.text.secondary, fontSize: 13, fontWeight: '500' },
  filterTextSelected: { color: Colors.text.inverse },
  listContent: { paddingBottom: 24, backgroundColor: Colors.bg.surface },
  separator: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  item: {
    minHeight: 64,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.bg.surface,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  zoneName: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
  primaryText: { marginTop: 4, color: Colors.text.secondary, fontSize: 14 },
  platformBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  platformBadgeText: { fontSize: 10, fontWeight: '600' },
  webBadge: { backgroundColor: '#EFF6FF' },
  appBadge: { backgroundColor: '#F0FDF4' },
  webBadgeText: { color: '#1D4ED8' },
  appBadgeText: { color: '#065F46' },
  timeText: { color: Colors.text.hint, ...Typography.micro },
  stale: { opacity: 0.4 },
  emptyWrap: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyText: { marginTop: 12, color: Colors.status.unknown, ...Typography.body },
});
