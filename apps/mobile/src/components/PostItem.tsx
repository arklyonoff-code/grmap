import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_COLORS, CATEGORY_LABELS, URGENT_CATEGORIES, ZONE_LABELS } from '@grmap/shared/constants/board';
import { BoardPost } from '@grmap/shared/types';
import { getElapsedText } from '@grmap/shared/utils/report';

export function PostItem({ post, onPress }: { post: BoardPost; onPress: () => void }) {
  const isDone = post.status === 'done';
  const isUrgent = URGENT_CATEGORIES.includes(post.category as (typeof URGENT_CATEGORIES)[number]);
  return (
    <Pressable style={[styles.item, post.category === 'notice' && styles.notice, isDone && styles.done]} onPress={onPress}>
      <View style={styles.rowTop}>
        <View style={styles.badges}>
          <Text
            style={[
              styles.badge,
              {
                backgroundColor: CATEGORY_COLORS[post.category].bg,
                color: CATEGORY_COLORS[post.category].text,
              },
            ]}
          >
            {isUrgent ? '⚡' : ''}{CATEGORY_LABELS[post.category]}
          </Text>
          <Text style={styles.zoneBadge}>{ZONE_LABELS[post.zoneTag as keyof typeof ZONE_LABELS] ?? '전체'}</Text>
          {isDone && <Text style={styles.doneBadge}>거래완료</Text>}
        </View>
        <Text style={styles.elapsed}>{getElapsedText(post.createdAt)}</Text>
      </View>
      <Text style={[styles.title, isDone && styles.doneTitle]} numberOfLines={2}>
        {post.title}
        {post.category === 'price' && post.priceValue ? (
          <Text style={styles.priceText}>  {post.priceValue.toLocaleString()}원/{post.priceUnit}</Text>
        ) : null}
      </Text>
      <Text style={styles.meta}>
        {post.nickname} · 💬 {post.commentCount} · ♥ {post.likes}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  notice: { backgroundColor: '#FAFAFA' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  zoneBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#666',
    backgroundColor: '#F7F7F7',
  },
  elapsed: { fontSize: 11, color: '#AAA' },
  title: { marginTop: 8, fontSize: 16, fontWeight: '500', color: '#111' },
  meta: { marginTop: 3, fontSize: 13, color: '#999' },
  done: { opacity: 0.45 },
  doneTitle: { textDecorationLine: 'line-through' },
  doneBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
  },
  priceText: { fontSize: 13, color: '#1D9E75' },
});
