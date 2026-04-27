import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_ZONES } from '../constants/mockZones';
import { Colors } from '../constants/colors';
import { Radius, Spacing, Typography } from '../constants/typography';
import { submitWaitReport } from '../services/firebase';
import { VehicleSize, WaitLevel } from '@grmap/shared/types';
import { getCongestionLevel } from '@grmap/shared/utils/report';
import { useAppStore } from '../stores/useAppStore';

interface Props {
  visible: boolean;
  initialZoneId?: string;
  onClose: () => void;
}

const WAIT_OPTIONS: { label: string; value: WaitLevel }[] = [
  { label: '없음', value: 'none' },
  { label: '10분↓', value: 'under10' },
  { label: '30분↓', value: 'under30' },
  { label: '1시간↑', value: 'over60' },
];

const VEHICLE_OPTIONS: { label: string; value: VehicleSize }[] = [
  { label: '1톤', value: '1ton' },
  { label: '5톤', value: '5ton' },
  { label: '11톤 이상', value: '11ton_plus' },
];

export function WaitTimeInputModal({ visible, initialZoneId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const zones = useAppStore((state) => state.zones);
  const activeReports = useAppStore((state) => state.activeReports);
  const [zoneId, setZoneId] = useState<string | undefined>(initialZoneId);
  const [waitLevel, setWaitLevel] = useState<WaitLevel | undefined>();
  const [vehicleSize, setVehicleSize] = useState<VehicleSize | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'done'>('idle');

  const zoneList = zones.length ? zones : MOCK_ZONES;
  const zoneStatus = useMemo(() => {
    const map = new Map<string, 'green' | 'yellow' | 'red' | 'unknown'>();
    zoneList.forEach((zone) => {
      const latest = activeReports
        .filter((report) => report.zoneId === zone.id)
        .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
      map.set(zone.id, getCongestionLevel(latest));
    });
    return map;
  }, [zoneList, activeReports]);

  const canSubmit = useMemo(
    () => Boolean(zoneId && waitLevel && submitState === 'idle'),
    [zoneId, waitLevel, submitState]
  );

  useEffect(() => {
    if (visible) {
      setZoneId(initialZoneId);
    }
  }, [initialZoneId, visible]);

  const closeAndReset = () => {
    setZoneId(initialZoneId);
    setWaitLevel(undefined);
    setVehicleSize(null);
    setSubmitState('idle');
    onClose();
  };

  const handleSubmit = async () => {
    if (!zoneId || !waitLevel || submitState !== 'idle') return;
    setSubmitState('loading');
    let isDone = false;
    try {
      await submitWaitReport(zoneId, waitLevel, vehicleSize);
      setSubmitState('done');
      isDone = true;
      setTimeout(() => closeAndReset(), 1200);
    } finally {
      if (!isDone) setSubmitState('idle');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeAndReset}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeAndReset} />
        <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.handle} />

          <Text style={styles.sectionTitle}>어느 구역이에요?</Text>
          <View style={styles.zoneGrid}>
            {zoneList.map((zone) => (
              <SelectButton
                key={zone.id}
                label={zone.name}
                selected={zone.id === zoneId}
                tone={zoneId === zone.id ? zoneStatus.get(zone.id) : undefined}
                onPress={() => setZoneId(zone.id)}
              />
            ))}
          </View>

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>지금 대기 얼마나 돼요?</Text>
          <View style={styles.waitRow}>
            {WAIT_OPTIONS.map((option) => (
              <SelectButton
                key={option.value}
                label={option.label}
                selected={option.value === waitLevel}
                compact
                tone={
                  option.value === 'none' || option.value === 'under10'
                    ? 'green'
                    : option.value === 'under30'
                      ? 'yellow'
                      : 'red'
                }
                onPress={() => setWaitLevel(option.value)}
              />
            ))}
          </View>

          <View style={[styles.row, styles.sectionSpacing]}>
            <Text style={styles.sectionTitle}>차량 크기 (선택)</Text>
            <Text style={styles.optionalHint}>안 해도 돼요</Text>
          </View>
          <View style={styles.vehicleRow}>
            {VEHICLE_OPTIONS.map((option) => (
              <SelectButton
                key={option.value}
                label={option.label}
                selected={option.value === vehicleSize}
                compact
                onPress={() => setVehicleSize(option.value)}
              />
            ))}
          </View>

          <Pressable
            style={[styles.submitButton, !canSubmit && styles.disabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            {submitState === 'loading' ? (
              <ActivityIndicator color={Colors.action.primaryFg} />
            ) : (
              <Text style={styles.submitText}>{submitState === 'done' ? '공유 완료' : '공유하기'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SelectButton({
  label,
  selected,
  compact,
  tone,
  onPress,
}: {
  label: string;
  selected: boolean;
  compact?: boolean;
  tone?: 'green' | 'yellow' | 'red' | 'unknown';
  onPress: () => void;
}) {
  const toneColor =
    tone === 'green'
      ? Colors.status.clear
      : tone === 'yellow'
        ? Colors.status.caution
        : tone === 'red'
          ? Colors.status.congested
          : Colors.text.primary;

  return (
    <Pressable
      style={[
        styles.optionButton,
        compact && styles.compactButton,
        selected && { borderColor: toneColor, backgroundColor: `${toneColor}1F` },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && { color: toneColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.bg.overlay },
  container: {
    backgroundColor: Colors.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
    marginTop: 12,
    marginBottom: 20,
  },
  sectionTitle: { color: Colors.text.primary, ...Typography.body, fontWeight: '600' },
  optionalHint: { color: Colors.text.tertiary, ...Typography.caption },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionSpacing: { marginTop: 20 },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  waitRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  vehicleRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  optionButton: {
    minHeight: 44,
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.bg.base,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    flexBasis: '48%',
  },
  compactButton: { flexBasis: undefined },
  optionText: { color: Colors.text.secondary, fontSize: 14, fontWeight: '500' },
  submitButton: {
    marginTop: 24,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: Colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  submitText: { color: Colors.action.primaryFg, ...Typography.body, fontWeight: '600' },
});
