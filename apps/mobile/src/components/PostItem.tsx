import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_COLORS, CATEGORY_LABELS, ZONE_LABELS } from '@grmap/shared/constants/board';
import { BoardPost } from '@grmap/shared/types';
import { getElapsedText } from '@grmap/shared/utils/report';

export function PostItem({ post, onPress }: { post: BoardPost; onPress: () => void }) {
  return (
    <Pressable style={[styles.item, post.category === 'notice' && styles.notice]} onPress={onPress}>
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
            {CATEGORY_LABELS[post.category]}
          </Text>
          <Text style={styles.zoneBadge}>{ZONE_LABELS[post.zoneTag as keyof typeof ZONE_LABELS] ?? '전체'}</Text>
        </View>
        <Text style={styles.elapsed}>{getElapsedText(post.createdAt)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {post.title}
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
});
