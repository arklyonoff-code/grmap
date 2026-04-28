import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CATEGORY_LABELS, ZONE_LABELS } from '@grmap/shared/constants/board';
import { BoardPost, PostCategory } from '@grmap/shared/types';
import { BoardWriteModal } from '../components/BoardWriteModal';
import { PostItem } from '../components/PostItem';
import { fetchPosts } from '../services/board';

const CATEGORY_TABS: Array<{ key: 'all' | PostCategory; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'free', label: CATEGORY_LABELS.free },
  { key: 'info', label: CATEGORY_LABELS.info },
  { key: 'question', label: CATEGORY_LABELS.question },
  { key: 'notice', label: CATEGORY_LABELS.notice },
];

export function BoardListScreen() {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [category, setCategory] = useState<'all' | PostCategory>('all');
  const [zoneTag, setZoneTag] = useState<keyof typeof ZONE_LABELS>('all');
  const [loading, setLoading] = useState(false);
  const [writeVisible, setWriteVisible] = useState(false);

  const zoneTabs = useMemo(() => Object.entries(ZONE_LABELS), []);

  const load = async () => {
    setLoading(true);
    try {
      const loaded = await fetchPosts(category === 'all' ? undefined : category, zoneTag);
      setPosts(loaded);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category, zoneTag]);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {CATEGORY_TABS.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.chip, category === item.key && styles.chipSelected]}
            onPress={() => setCategory(item.key)}
          >
            <Text style={[styles.chipText, category === item.key && styles.chipTextSelected]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {zoneTabs.map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.chip, zoneTag === key && styles.chipSelected]}
            onPress={() => setZoneTag(key as keyof typeof ZONE_LABELS)}
          >
            <Text style={[styles.chipText, zoneTag === key && styles.chipTextSelected]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <PostItem post={item} onPress={() => navigation.navigate('BoardDetail', { postId: item.id })} />
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>게시글이 없습니다.</Text></View>}
      />

      <Pressable style={styles.fab} onPress={() => setWriteVisible(true)}>
        <Feather name="edit-2" size={20} color="#FFF" />
      </Pressable>

      <BoardWriteModal
        visible={writeVisible}
        onClose={() => setWriteVisible(false)}
        onCreated={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  chipRow: { gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  chip: {
    height: 34,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 14, color: '#555' },
  chipTextSelected: { color: '#FFF' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#999' },
});
