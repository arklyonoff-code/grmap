import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import {
  get,
  getDatabase,
  limitToFirst,
  orderByKey,
  push,
  query,
  ref,
  runTransaction,
  set,
  startAfter,
  update,
} from 'firebase/database';
import { BoardComment, BoardPost, PostCategory } from '@grmap/shared/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'MISSING_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'MISSING_AUTH_DOMAIN',
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://example.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'MISSING_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'MISSING_BUCKET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'MISSING_SENDER',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'MISSING_APP_ID',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);
const PAGE_SIZE = 20;

async function getDeviceId() {
  const key = 'grmap_device_id';
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;
  const created = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(key, created);
  return created;
}

export async function fetchPosts(category?: PostCategory, zoneTag?: string, lastKey?: string) {
  const postsRef = ref(db, '/board_posts');
  const base = [orderByKey(), limitToFirst(PAGE_SIZE + 1)] as const;
  const q = lastKey ? query(postsRef, ...base, startAfter(lastKey)) : query(postsRef, ...base);
  const snapshot = await get(q);
  let posts: BoardPost[] = Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({
    id,
    ...(value as Omit<BoardPost, 'id'>),
  }));
  posts = posts.filter((post) => post.status !== 'hidden');
  if (category) posts = posts.filter((post) => post.category === category);
  if (zoneTag && zoneTag !== 'all') posts = posts.filter((post) => post.zoneTag === zoneTag);
  return posts.sort((a, b) => b.createdAt - a.createdAt).slice(0, PAGE_SIZE);
}

export async function fetchPost(postId: string) {
  const snapshot = await get(ref(db, `/board_posts/${postId}`));
  const value = snapshot.val();
  if (!value || value.status === 'hidden') throw new Error('게시글을 찾을 수 없습니다.');
  return { id: postId, ...(value as Omit<BoardPost, 'id'>) };
}

export async function createPost(
  data: Omit<BoardPost, 'id' | 'likes' | 'commentCount' | 'createdAt' | 'status'>
) {
  const postsRef = ref(db, '/board_posts');
  const createdRef = push(postsRef);
  await set(createdRef, {
    ...data,
    deviceId: data.deviceId || (await getDeviceId()),
    likes: 0,
    commentCount: 0,
    createdAt: Date.now(),
    status: 'active',
  });
  return createdRef.key ?? '';
}

export async function fetchComments(postId: string) {
  const snapshot = await get(ref(db, `/board_comments/${postId}`));
  const comments: BoardComment[] = Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({
    id,
    postId,
    ...(value as Omit<BoardComment, 'id' | 'postId'>),
  }));
  return comments.filter((item) => item.status !== 'hidden').sort((a, b) => a.createdAt - b.createdAt);
}

export async function createComment(
  postId: string,
  data: Omit<BoardComment, 'id' | 'postId' | 'createdAt' | 'status'>
) {
  const commentsRef = ref(db, `/board_comments/${postId}`);
  const createdRef = push(commentsRef);
  await set(createdRef, {
    ...data,
    deviceId: data.deviceId || (await getDeviceId()),
    createdAt: Date.now(),
    status: 'active',
  });
  await runTransaction(ref(db, `/board_posts/${postId}/commentCount`), (count) => (count ?? 0) + 1);
}

export async function toggleLike(postId: string) {
  const key = `grmap_liked_${postId}`;
  const liked = (await AsyncStorage.getItem(key)) === '1';
  await runTransaction(ref(db, `/board_posts/${postId}/likes`), (count) => {
    const base = count ?? 0;
    return liked ? Math.max(0, base - 1) : base + 1;
  });
  await AsyncStorage.setItem(key, liked ? '0' : '1');
}

export async function deletePost(postId: string, passwordHash: string) {
  const post = await fetchPost(postId);
  if (post.passwordHash !== passwordHash) throw new Error('비밀번호가 틀렸습니다.');
  await update(ref(db, `/board_posts/${postId}`), { status: 'hidden' });
}

export async function deleteComment(postId: string, commentId: string, passwordHash: string) {
  const snapshot = await get(ref(db, `/board_comments/${postId}/${commentId}`));
  const comment = snapshot.val() as Omit<BoardComment, 'id' | 'postId'> | null;
  if (!comment) throw new Error('댓글을 찾을 수 없습니다.');
  if (comment.passwordHash !== passwordHash) throw new Error('비밀번호가 틀렸습니다.');
  await update(ref(db, `/board_comments/${postId}/${commentId}`), { status: 'hidden' });
  await runTransaction(ref(db, `/board_posts/${postId}/commentCount`), (count) => Math.max(0, (count ?? 0) - 1));
}
