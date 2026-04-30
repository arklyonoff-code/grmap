import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BADGES } from '@grmap/shared/constants/mission';
import type { MissionStamp, TodayMissions } from '@grmap/shared/types';
import { useAppStore } from '../stores/useAppStore';
import {
  fetchMyMissionStamp,
  fetchWeeklyRanking,
  getOrCreateMissionDeviceId,
  handleCheckinApp,
  loadTodayMissions,
} from '../services/mission';

type MissionCardProps = {
  icon: string;
  title: string;
  desc: string;
  reward: number;
  done: boolean;
  onPress: () => void;
};

function MissionCard({ icon, title, desc, reward, done, onPress }: MissionCardProps) {
  return (
    <TouchableOpacity
      onPress={done ? undefined : onPress}
      activeOpacity={done ? 1 : 0.7}
      style={[styles.card, done && styles.cardDone]}
    >
      <View style={[styles.cardIcon, done && styles.cardIconDone]}>
        <Text style={{ fontSize: 22 }}>{done ? '✅' : icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
      <View style={[styles.rewardBadge, done && styles.rewardBadgeDone]}>
        <Text style={[styles.rewardText, done && styles.rewardTextDone]}>{done ? '완료' : `+${reward}🪙`}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function MissionScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const openWaitModal = useAppStore((state) => state.openWaitModal);
  const [missions, setMissions] = useState<TodayMissions>({
    checkin: false,
    waittime: false,
    price: false,
    date: '',
  });
  const [totalStamps, setTotalStamps] = useState(0);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [rankings, setRankings] = useState<MissionStamp[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [nickname, setNickname] = useState('익명');

  const refresh = async () => {
    const id = await getOrCreateMissionDeviceId();
    const nick = (await AsyncStorage.getItem('grmap_nickname')) || '익명';
    const loadedMissions = await loadTodayMissions();
    const mine = await fetchMyMissionStamp(id);
    const weekly = await fetchWeeklyRanking();
    setDeviceId(id);
    setNickname(nick);
    setMissions(loadedMissions);
    setTotalStamps(mine.totalStamps);
    setConsecutiveDays(mine.consecutiveDays);
    setBadges(mine.badges);
    setRankings(weekly);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh().catch(() => undefined);
    }, [])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: Math.max(100, insets.bottom + 72) }}
    >
      <View style={styles.header}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </Text>
        <View style={styles.headerRow}>
          <Text style={styles.title}>오늘 미션</Text>
          <View style={styles.stampBadge}>
            <Text style={styles.stampNum}>{totalStamps}</Text>
            <Text style={styles.stampLabel}> 스탬프</Text>
          </View>
        </View>
      </View>

      <View style={[styles.streak, consecutiveDays >= 3 && styles.streakHot]}>
        <Text style={{ fontSize: 28 }}>{consecutiveDays === 0 ? '📅' : consecutiveDays >= 7 ? '🔥' : '✅'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakTitle}>
            {consecutiveDays === 0 ? '오늘 첫 체크인 해보세요' : `${consecutiveDays}일 연속 출석 중!`}
          </Text>
          <Text style={styles.streakSub}>
            {consecutiveDays >= 7
              ? '🏆 7일 개근 달성!'
              : `7일 연속이면 ⭐ 뱃지 획득 (${Math.max(0, 7 - consecutiveDays)}일 남음)`}
          </Text>
        </View>
      </View>

      {loading ? <ActivityIndicator style={{ margin: 20 }} /> : null}
      <MissionCard
        icon="📍"
        title="현장 체크인"
        desc="가락시장 근처에서 위치 인증"
        reward={3}
        done={missions.checkin}
        onPress={async () => {
          try {
            setLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('위치 권한 필요', '체크인을 위해 위치 권한을 허용해주세요.');
              return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const result = await handleCheckinApp(loc.coords.latitude, loc.coords.longitude, deviceId, nickname);
            Alert.alert(result.success ? '✅ 체크인 완료!' : '위치 확인', result.message);
            await refresh();
          } finally {
            setLoading(false);
          }
        }}
      />
      <MissionCard
        icon="🚛"
        title="대기시간 공유"
        desc="현재 구역 대기시간 알려주기"
        reward={2}
        done={missions.waittime}
        onPress={async () => {
          openWaitModal();
          navigation.navigate('지도');
        }}
      />
      <MissionCard
        icon="💰"
        title="오늘 시세 제보"
        desc="품목 가격 정보 공유하기"
        reward={2}
        done={missions.price}
        onPress={() => navigation.navigate('게시판')}
      />

      <Text style={styles.sectionTitle}>이번 주 랭킹 🏆</Text>
      {rankings.map((user, i) => (
        <View key={user.deviceId} style={styles.rankItem}>
          <Text style={styles.rankEmoji}>
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
          </Text>
          <Text style={{ flex: 1, fontSize: 14 }}>{user.nickname}</Text>
          <Text style={styles.rankStamp}>{user.weeklyStamps}🪙</Text>
        </View>
      ))}
      {!rankings.length && <Text style={styles.emptyRank}>아직 랭킹 데이터가 없어요</Text>}

      <Text style={styles.sectionTitle}>내 뱃지</Text>
      <View style={styles.badgeWrap}>
        {Object.entries(BADGES).map(([key, badge]) => {
          const earned = badges.includes(key);
          return (
            <View key={key} style={[styles.badgeItem, earned ? styles.badgeEarned : styles.badgeLocked]}>
              <Text style={{ fontSize: 24 }}>{badge.emoji}</Text>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={async () => {
          const weekly = await fetchWeeklyRanking();
          setRankings(weekly);
        }}
      >
        <Text style={styles.refreshText}>랭킹 새로고침</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F4F0' },
  header: { padding: 20, paddingBottom: 0 },
  dateText: { fontSize: 12, color: '#999' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  stampBadge: { flexDirection: 'row', alignItems: 'baseline' },
  stampNum: { fontSize: 24, fontWeight: '700', color: '#1D9E75' },
  stampLabel: { fontSize: 14, color: '#999' },
  streak: {
    margin: 16,
    padding: 14,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakHot: { backgroundColor: '#FEF9EC' },
  streakTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  streakSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardDone: { borderColor: '#1D9E75', borderWidth: 1.5 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconDone: { backgroundColor: '#E1F5EE' },
  cardTitle: { fontSize: 15, fontWeight: '500', color: '#111' },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#999' },
  cardDesc: { fontSize: 12, color: '#aaa', marginTop: 2 },
  rewardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: '#FEF9EC' },
  rewardBadgeDone: { backgroundColor: '#E1F5EE' },
  rewardText: { fontSize: 13, fontWeight: '600', color: '#EF9F27' },
  rewardTextDone: { color: '#1D9E75' },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginHorizontal: 16, marginTop: 14, marginBottom: 8, color: '#111' },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
    gap: 12,
  },
  rankEmoji: { fontSize: 16, width: 28, textAlign: 'center' },
  rankStamp: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
  emptyRank: { marginHorizontal: 16, color: '#999', marginTop: 4 },
  badgeWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginHorizontal: 16 },
  badgeItem: { padding: 8, borderRadius: 10, borderWidth: 0.5, minWidth: 76, alignItems: 'center' },
  badgeEarned: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', opacity: 1 },
  badgeLocked: { backgroundColor: '#F5F5F5', borderColor: '#EEEEEE', opacity: 0.4 },
  badgeLabel: { fontSize: 11, color: '#555', marginTop: 4 },
  refreshButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshText: { color: '#666', fontSize: 13, fontWeight: '600' },
});
