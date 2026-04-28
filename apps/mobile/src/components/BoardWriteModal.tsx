import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { CATEGORY_LABELS, ZONE_LABELS } from '@grmap/shared/constants/board';
import { PostCategory } from '@grmap/shared/types';
import { generateRandomNickname } from '@grmap/shared/utils/nickname';
import { createPost } from '../services/board';

const CATEGORIES: PostCategory[] = ['free', 'info', 'question'];

export function BoardWriteModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [nickname, setNickname] = useState(generateRandomNickname());
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<PostCategory>('free');
  const [zoneTag, setZoneTag] = useState<keyof typeof ZONE_LABELS>('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const zoneOptions = useMemo(
    () => Object.entries(ZONE_LABELS).map(([key, label]) => ({ key, label })),
    []
  );

  const reset = () => {
    setNickname(generateRandomNickname());
    setPassword('');
    setCategory('free');
    setZoneTag('all');
    setTitle('');
    setContent('');
  };

  const handleSubmit = async () => {
    if (!nickname.trim() || !password.trim() || !title.trim() || !content.trim()) {
      return;
    }
    try {
      setSubmitting(true);
      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password.trim()
      );
      await createPost({
        title: title.trim(),
        content: `<p>${content.trim().replace(/\n/g, '<br />')}</p>`,
        nickname: nickname.trim(),
        passwordHash,
        category,
        zoneTag,
        deviceId: '',
      });
      await onCreated();
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>게시글 작성</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>닫기</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={[styles.contentWrap, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.row}>
            <View style={styles.nicknameWrap}>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임"
                maxLength={20}
              />
              <TouchableOpacity style={styles.shuffle} onPress={() => setNickname(generateRandomNickname())}>
                <Text>↻</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.rowInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호"
              secureTextEntry
              maxLength={20}
            />
          </View>

          <View style={styles.catRow}>
            {CATEGORIES.map((item) => (
              <Pressable
                key={item}
                style={[styles.toggleBtn, category === item && styles.toggleSelected]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.toggleText, category === item && styles.toggleTextSelected]}>
                  {CATEGORY_LABELS[item]}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneRow}>
            {zoneOptions.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.zoneChip, zoneTag === item.key && styles.zoneChipSelected]}
                onPress={() => setZoneTag(item.key as keyof typeof ZONE_LABELS)}
              >
                <Text style={[styles.zoneChipText, zoneTag === item.key && styles.zoneChipTextSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목"
            maxLength={100}
          />
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="가락시장 사람들과 공유할 내용을 적어주세요."
            multiline
          />

          <Pressable style={styles.submitBtn} disabled={submitting} onPress={handleSubmit}>
            <Text style={styles.submitText}>{submitting ? '등록 중...' : '등록'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  close: { fontSize: 14, color: '#666' },
  contentWrap: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 8 },
  rowInput: { flex: 1 },
  nicknameWrap: { flex: 1, flexDirection: 'row', gap: 6 },
  shuffle: {
    width: 40,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#FFF',
  },
  catRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSelected: { backgroundColor: '#111', borderColor: '#111' },
  toggleText: { fontSize: 14, color: '#555' },
  toggleTextSelected: { color: '#FFF' },
  zoneRow: { gap: 8 },
  zoneChip: {
    height: 34,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 99,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneChipSelected: { backgroundColor: '#111', borderColor: '#111' },
  zoneChipText: { fontSize: 13, color: '#555' },
  zoneChipTextSelected: { color: '#FFF' },
  contentInput: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
