import BottomSheet from '@gorhom/bottom-sheet';
import React, { useMemo } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { buildKakaoNaviDeeplink } from '../constants/mockZones';
import { Colors } from '../constants/colors';
import { Radius, Spacing, Typography } from '../constants/typography';
import { useAppStore } from '../stores/useAppStore';
import { ZoneWithStatus } from '@grmap/shared/types';
import { getElapsedMinutes, getElapsedText, getWaitLevelLabel } from '@grmap/shared/utils/report';

interface Props {
  zone: ZoneWithStatus;
  onClose: () => void;
}

export function PointDetailSheet({ zone, onClose }: Props) {
  const openWaitModal = useAppStore((state) => state.openWaitModal);
  const snapPoints = useMemo(() => ['48%'], []);
  const latestReport = zone.latestReport;
  const stale = latestReport ? getElapsedMinutes(latestReport.createdAt) >= 30 : false;

  const waitInfo = latestReport ? getWaitLevelLabel(latestReport.waitLevel) : '정보 없음';

  const level = zone.congestionLevel;
  const statusColor =
    level === 'green'
      ? Colors.status.clear
      : level === 'yellow'
        ? Colors.status.caution
        : level === 'red'
          ? Colors.status.congested
          : Colors.status.unknown;
  const statusLabel =
    level === 'green' ? '원활' : level === 'yellow' ? '보통' : level === 'red' ? '혼잡' : '정보 없음';
  const waitColor = latestReport
    ? latestReport.waitLevel === 'under30'
      ? Colors.status.caution
      : latestReport.waitLevel === 'over60'
        ? Colors.status.congested
        : Colors.status.clear
    : Colors.text.tertiary;

  return (
    <BottomSheet
      index={0}
      enablePanDownToClose
      onClose={onClose}
      snapPoints={snapPoints}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      enableContentPanningGesture={false}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.zoneTitle}>{zone.name}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${statusColor}1F` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={[styles.waitBlock, stale && styles.stale]}>
          <View style={styles.waitTopRow}>
            <Text style={styles.waitLabel}>현재 대기</Text>
            <Text style={styles.updatedAt}>
              {latestReport ? `${getElapsedText(latestReport.createdAt)}` : '업데이트 없음'}
            </Text>
          </View>
          <Text style={[styles.waitValue, { color: waitColor }]}>{waitInfo}</Text>
        </View>

        <View style={styles.divider} />
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Feather name="navigation" size={16} color={Colors.text.tertiary} />
            <Text style={styles.description}>{zone.dockDescription}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="info" size={16} color={Colors.text.tertiary} />
            <Text style={styles.subDescription}>{zone.entryNote ?? '진입 참고 정보 없음'}</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              const url = buildKakaoNaviDeeplink(zone.lat, zone.lng);
              try {
                await Linking.openURL(url);
              } catch {
                Alert.alert('앱 실행 실패', '카카오맵을 설치해주세요.');
              }
            }}
          >
            <Text style={styles.buttonText}>차량 경로 안내</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => openWaitModal(zone.id)}>
            <Text style={styles.ghostButtonText}>대기시간 직접 알려주기</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: Colors.bg.surface, borderRadius: 24 },
  handle: { backgroundColor: Colors.divider, width: 36, height: 4 },
  content: { flex: 1, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: Radius.pill },
  zoneTitle: { color: Colors.text.primary, ...Typography.heading },
  badge: {
    marginRight: 20,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 13, fontWeight: '500' },
  waitBlock: { marginTop: 20, paddingHorizontal: 20 },
  waitTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waitLabel: { color: Colors.text.secondary, ...Typography.caption },
  waitValue: { marginTop: 4, ...Typography.display },
  updatedAt: { color: Colors.text.tertiary, ...Typography.micro },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 16 },
  infoSection: { paddingHorizontal: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  description: { color: Colors.text.primary, ...Typography.body, flex: 1 },
  subDescription: { color: Colors.text.secondary, ...Typography.caption, flex: 1 },
  buttonRow: { marginTop: 'auto', gap: 8, paddingHorizontal: 20 },
  primaryButton: {
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.action.ghost,
    borderWidth: 1,
    borderColor: Colors.action.ghostBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: Colors.action.primaryFg, ...Typography.body, fontWeight: '600' },
  ghostButtonText: { color: Colors.text.primary, ...Typography.body, fontWeight: '600' },
  stale: { opacity: 0.45 },
});
