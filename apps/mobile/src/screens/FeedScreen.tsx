import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Radius, Spacing, Typography } from '../constants/typography';
import { useAppStore } from '../stores/useAppStore';
import { WaitReport } from '@grmap/shared/types';
import {
  getCongestionLevel,
  getElapsedMinutes,
  getElapsedText,
  getWaitLevelLabel,
} from '@grmap/shared/utils/report';

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
            <Feather name="inbox" size={32} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>아직 제보가 없어요</Text>
          </View>
        }
        contentContainerStyle={filtered.length ? styles.listContent : styles.emptyWrap}
      />
    </View>
  );
}

function FeedItem({ item }: { item: WaitReport }) {
  const zones = useAppStore((state) => state.zones);
  const zoneName = zones.find((z) => z.id === item.zoneId)?.name ?? '알 수 없음';
  const isStale = getElapsedMinutes(item.createdAt) >= 30;
  const vehicleLabel =
    item.vehicleSize === '1ton' ? '1톤' : item.vehicleSize === '5ton' ? '5톤' : item.vehicleSize === '11ton_plus' ? '11톤+' : '미선택';
  const zone = zones.find((z) => z.id === item.zoneId);
  const latestReport = item ?? null;
  const level = getCongestionLevel(latestReport);
  const dotColor =
    level === 'green'
      ? Colors.status.clear
      : level === 'yellow'
        ? Colors.status.caution
        : level === 'red'
          ? Colors.status.congested
          : Colors.status.unknown;
  const badgeLabel = level === 'green' ? '원활' : level === 'yellow' ? '보통' : level === 'red' ? '혼잡' : '정보없음';

  return (
    <View style={[styles.item, isStale && styles.stale]}>
      <View style={styles.topRow}>
        <View style={styles.zoneRow}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.zoneName}>{zone?.name ?? zoneName}</Text>
        </View>
        <Text style={[styles.badge, { color: dotColor, backgroundColor: `${dotColor}1F` }]}>{badgeLabel}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.primaryText}>
          {getWaitLevelLabel(item.waitLevel)}  ·  {vehicleLabel}
        </Text>
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.platformBadge,
              item.platform === 'web' ? styles.webBadge : styles.appBadge,
            ]}
          >
            {item.platform === 'web' ? '웹' : '앱'}
          </Text>
          <Text style={styles.timeText}>{getElapsedText(item.createdAt)}</Text>
        </View>
      </View>
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
  zoneName: { color: Colors.text.primary, ...Typography.heading, fontSize: 18 },
  badge: {
    fontSize: 13,
    fontWeight: '500',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  bottomRow: { marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryText: { color: Colors.text.secondary, ...Typography.body },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  platformBadge: {
    fontSize: 10,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: Colors.text.inverse,
    overflow: 'hidden',
  },
  webBadge: { backgroundColor: '#3B82F6' },
  appBadge: { backgroundColor: '#1D9E75' },
  timeText: { color: Colors.text.tertiary, ...Typography.micro },
  stale: { opacity: 0.45 },
  emptyWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: 10 },
  emptyText: { color: Colors.text.tertiary, ...Typography.body },
});
