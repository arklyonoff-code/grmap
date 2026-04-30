import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { CATEGORY_LABELS, URGENT_CATEGORIES, ZONE_LABELS } from '@grmap/shared/constants/board';
import { BoardPost, PostCategory } from '@grmap/shared/types';
import { BoardWriteModal } from '../components/BoardWriteModal';
import { PostItem } from '../components/PostItem';
import { fetchPostsPage, subscribePosts } from '../services/board';
import { getElapsedText } from '@grmap/shared/utils/report';

const CATEGORY_TABS: Array<{ key: 'all' | PostCategory; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'free', label: CATEGORY_LABELS.free },
  { key: 'info', label: CATEGORY_LABELS.info },
  { key: 'question', label: CATEGORY_LABELS.question },
  { key: 'notice', label: CATEGORY_LABELS.notice },
  { key: 'wanted', label: '⚡ 급구' },
  { key: 'selling', label: '⚡ 급매' },
  { key: 'price', label: CATEGORY_LABELS.price },
];

export function BoardListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [olderPosts, setOlderPosts] = useState<BoardPost[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<'all' | PostCategory>('all');
  const [zoneTag, setZoneTag] = useState<keyof typeof ZONE_LABELS>('all');
  const [loading, setLoading] = useState(false);
  const [writeVisible, setWriteVisible] = useState(false);

  const zoneTabs = useMemo(() => Object.entries(ZONE_LABELS), []);

  useEffect(() => {
    setLoading(true);
    setOlderPosts([]);
    setCursor(null);
    setHasMore(true);
    fetchPostsPage(category === 'all' ? undefined : category, zoneTag)
      .then(({ cursor: nextCursor, posts: first }) => {
        setCursor(nextCursor);
        setHasMore(first.length >= 20);
      })
      .catch(() => undefined);
    const unsubscribe = subscribePosts(
      (loaded) => {
        setPosts(loaded);
        setLoading(false);
      },
      category === 'all' ? undefined : category,
      zoneTag
    );
    return unsubscribe;
  }, [category, zoneTag]);

  const sortedPosts = useMemo(() => {
    const mergedBase = [...posts, ...olderPosts];
    const deduped = Array.from(new Map(mergedBase.map((item) => [item.id, item])).values());
    const notices = deduped.filter((p) => p.category === 'notice').sort((a, b) => b.createdAt - a.createdAt);
    const urgent = deduped
      .filter((p) => URGENT_CATEGORIES.includes(p.category as (typeof URGENT_CATEGORIES)[number]) && p.status !== 'done')
      .sort((a, b) => b.createdAt - a.createdAt);
    const done = deduped.filter((p) => p.status === 'done').sort((a, b) => b.createdAt - a.createdAt);
    const rest = deduped
      .filter((p) => p.category !== 'notice' && !URGENT_CATEGORIES.includes(p.category as (typeof URGENT_CATEGORIES)[number]) && p.status === 'active')
      .sort((a, b) => b.createdAt - a.createdAt);
    return [...notices, ...urgent, ...rest, ...done];
  }, [posts, olderPosts]);

  const pricePosts = sortedPosts.filter((item) => item.category === 'price');
  const activeCategory = category === 'all' ? undefined : category;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
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

      {category === 'price' ? (
        <FlatList
          data={pricePosts}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={() => undefined}
          onEndReachedThreshold={0.5}
          onEndReached={async () => {
            if (!cursor || loadingMore || !hasMore) return;
            setLoadingMore(true);
            try {
              const { posts: next, cursor: nextCursor } = await fetchPostsPage(
                activeCategory,
                zoneTag,
                cursor
              );
              setOlderPosts((prev) => [...prev, ...next]);
              setCursor(nextCursor);
              setHasMore(next.length >= 20);
            } finally {
              setLoadingMore(false);
            }
          }}
          renderItem={({ item }) => <PriceListItem post={item} onPress={() => navigation.navigate('BoardDetail', { postId: item.id })} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>오늘 등록된 시세 정보가 없어요</Text></View>}
          ListFooterComponent={loadingMore ? <Text style={styles.loadingMore}>불러오는 중...</Text> : null}
        />
      ) : (
        <FlatList
          data={sortedPosts}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={() => undefined}
          onEndReachedThreshold={0.5}
          onEndReached={async () => {
            if (!cursor || loadingMore || !hasMore) return;
            setLoadingMore(true);
            try {
              const { posts: next, cursor: nextCursor } = await fetchPostsPage(
                activeCategory,
                zoneTag,
                cursor
              );
              setOlderPosts((prev) => [...prev, ...next]);
              setCursor(nextCursor);
              setHasMore(next.length >= 20);
            } finally {
              setLoadingMore(false);
            }
          }}
          renderItem={({ item }) => (
            <PostItem post={item} onPress={() => navigation.navigate('BoardDetail', { postId: item.id })} />
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>게시글이 없습니다.</Text></View>}
          ListFooterComponent={loadingMore ? <Text style={styles.loadingMore}>불러오는 중...</Text> : null}
        />
      )}

      <Pressable style={styles.fab} onPress={() => setWriteVisible(true)}>
        <Feather name="edit-2" size={20} color="#FFF" />
      </Pressable>

      <BoardWriteModal
        visible={writeVisible}
        onClose={() => setWriteVisible(false)}
        onCreated={async () => undefined}
      />
    </View>
  );
}

function PriceListItem({ post, onPress }: { post: BoardPost; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.priceItem}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600' }}>{post.priceItem || post.title}</Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          {ZONE_LABELS[post.zoneTag as keyof typeof ZONE_LABELS]} · {getElapsedText(post.createdAt)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111' }}>
          {post.priceValue?.toLocaleString()}
          <Text style={{ fontSize: 12, color: '#aaa', fontWeight: '400' }}>{post.priceUnit}</Text>
        </Text>
      </View>
    </Pressable>
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
  priceItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  loadingMore: { textAlign: 'center', color: '#999', padding: 12 },
});
