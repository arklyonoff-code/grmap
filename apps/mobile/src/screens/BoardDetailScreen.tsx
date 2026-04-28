import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Crypto from 'expo-crypto';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CATEGORY_COLORS, CATEGORY_LABELS, ZONE_LABELS } from '@grmap/shared/constants/board';
import { BoardComment, BoardPost } from '@grmap/shared/types';
import { generateRandomNickname } from '@grmap/shared/utils/nickname';
import { getElapsedText } from '@grmap/shared/utils/report';
import { CommentItem } from '../components/CommentItem';
import {
  createComment,
  deleteComment,
  deletePost,
  fetchComments,
  fetchPost,
  toggleLike,
} from '../services/board';

export function BoardDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const postId = route.params?.postId as string;
  const [post, setPost] = useState<BoardPost | null>(null);
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState(generateRandomNickname());
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [webHeight, setWebHeight] = useState(120);

  const createdLabel = useMemo(
    () => (post ? new Date(post.createdAt).toLocaleString('ko-KR') : ''),
    [post]
  );

  const askPassword = () =>
    new Promise<string | null>((resolve) => {
      if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
        Alert.prompt('비밀번호 입력', '', [
          { text: '취소', style: 'cancel', onPress: () => resolve(null) },
          { text: '확인', onPress: (value?: string) => resolve(value ?? null) },
        ], 'secure-text');
        return;
      }
      Alert.alert('안내', '현재 기기에서는 삭제 비밀번호 입력창을 준비 중입니다.');
      resolve(null);
    });

  const load = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchPost(postId), fetchComments(postId)]);
      setPost(p);
      setComments(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  if (!post) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{loading ? '불러오는 중...' : '게시글이 없습니다.'}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← 목록으로</Text>
        </Pressable>
        <View style={styles.badges}>
          <Text style={[styles.badge, { backgroundColor: CATEGORY_COLORS[post.category].bg, color: CATEGORY_COLORS[post.category].text }]}>
            {CATEGORY_LABELS[post.category]}
          </Text>
          <Text style={styles.zoneBadge}>{ZONE_LABELS[post.zoneTag as keyof typeof ZONE_LABELS] ?? '전체'}</Text>
        </View>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.meta}>{post.nickname} · {createdLabel}</Text>
        <View style={styles.actionRow}>
          <Pressable
            onPress={async () => {
              await toggleLike(post.id);
              await load();
            }}
          >
            <Text style={styles.like}>♥ {post.likes}</Text>
          </Pressable>
          <Text style={styles.meta}>💬 {comments.length}</Text>
          <Pressable
            onPress={async () => {
              const input = await askPassword();
              if (!input) return;
              const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
              try {
                await deletePost(post.id, hash);
                navigation.goBack();
              } catch (error) {
                alert(error instanceof Error ? error.message : '삭제 실패');
              }
            }}
          >
            <Text style={styles.delete}>삭제</Text>
          </Pressable>
        </View>

        <WebView
          source={{
            html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;padding:8px;font-size:15px;color:#222;">${post.content}</body></html>`,
          }}
          style={{ height: webHeight }}
          scrollEnabled={false}
          injectedJavaScript={`
            setTimeout(() => {
              window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
            }, 100);
            true;
          `}
          onMessage={(event) => {
            const h = Number(event.nativeEvent.data);
            if (h > 40) setWebHeight(h + 20);
          }}
        />

        <View style={styles.separator} />
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={async (commentId) => {
              const input = await askPassword();
              if (!input) return;
              const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
              try {
                await deleteComment(post.id, commentId, hash);
                await load();
              } catch (error) {
                alert(error instanceof Error ? error.message : '삭제 실패');
              }
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.commentInputWrap}>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} value={nickname} onChangeText={setNickname} placeholder="닉네임" />
          <Pressable style={styles.shuffle} onPress={() => setNickname(generateRandomNickname())}>
            <Text>↻</Text>
          </Pressable>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="비밀번호"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={content}
            onChangeText={setContent}
            placeholder="댓글"
            multiline
            maxLength={500}
          />
          <Pressable
            style={styles.submit}
            onPress={async () => {
              if (!nickname.trim() || !password.trim() || !content.trim()) return;
              const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password.trim());
              await createComment(post.id, {
                content: content.trim(),
                nickname: nickname.trim(),
                passwordHash: hash,
                deviceId: '',
              });
              setContent('');
              setPassword('');
              await load();
            }}
          >
            <Text style={styles.submitText}>등록</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 16, paddingBottom: 120 },
  back: { color: '#666' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
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
  title: { marginTop: 10, fontSize: 22, fontWeight: '500', color: '#111' },
  meta: { marginTop: 4, color: '#999', fontSize: 13 },
  actionRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'flex-end' },
  like: { color: '#E24B4A', fontWeight: '600' },
  delete: { color: '#666', fontSize: 13 },
  separator: { marginTop: 12, height: 1, backgroundColor: '#EEE' },
  commentInputWrap: {
    borderTopWidth: 0.5,
    borderTopColor: '#EEE',
    padding: 12,
    backgroundColor: '#FFF',
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: '#FFF',
  },
  shuffle: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: { flex: 1, minHeight: 44, maxHeight: 84, textAlignVertical: 'top', paddingTop: 10 },
  submit: {
    width: 56,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#FFF', fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999' },
});
