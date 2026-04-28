import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BoardComment } from '@grmap/shared/types';
import { getElapsedText } from '@grmap/shared/utils/report';

export function CommentItem({
  comment,
  onDelete,
}: {
  comment: BoardComment;
  onDelete: (commentId: string) => void;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.top}>
        <Text style={styles.nickname}>{comment.nickname}</Text>
        <View style={styles.meta}>
          <Text style={styles.elapsed}>{getElapsedText(comment.createdAt)}</Text>
          <Pressable onPress={() => onDelete(comment.id)}>
            <Text style={styles.delete}>삭제</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.content}>{comment.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nickname: { fontSize: 14, fontWeight: '600', color: '#111' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  elapsed: { fontSize: 11, color: '#AAA' },
  delete: { fontSize: 12, color: '#666' },
  content: { marginTop: 6, fontSize: 14, color: '#333' },
});
