import {
  get,
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
import type { BoardComment, BoardPost, PostCategory } from '@grmap/shared/types';
import { db } from './firebase';

const PAGE_SIZE = 20;

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const key = 'grmap_device_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

function parsePosts(raw: Record<string, Omit<BoardPost, 'id'>>): BoardPost[] {
  return Object.entries(raw ?? {}).map(([id, value]) => ({ id, ...value }));
}

function parseComments(postId: string, raw: Record<string, Omit<BoardComment, 'id' | 'postId'>>): BoardComment[] {
  return Object.entries(raw ?? {}).map(([id, value]) => ({ id, postId, ...value }));
}

export async function fetchPosts(category?: PostCategory, zoneTag?: string, lastKey?: string): Promise<BoardPost[]> {
  const postsRef = ref(db, '/board_posts');
  const constraints = [orderByKey(), limitToFirst(PAGE_SIZE + 1)] as const;
  const q = lastKey ? query(postsRef, ...constraints, startAfter(lastKey)) : query(postsRef, ...constraints);
  const snapshot = await get(q);
  const raw = snapshot.val() ?? {};
  let posts = parsePosts(raw)
    .filter((post) => post.status !== 'hidden')
    .sort((a, b) => b.createdAt - a.createdAt);
  if (category) posts = posts.filter((post) => post.category === category);
  if (zoneTag && zoneTag !== 'all') posts = posts.filter((post) => post.zoneTag === zoneTag);
  return posts.slice(0, PAGE_SIZE);
}

export async function fetchPost(postId: string): Promise<BoardPost> {
  const snapshot = await get(ref(db, `/board_posts/${postId}`));
  const data = snapshot.val();
  if (!data || data.status === 'hidden') throw new Error('게시글을 찾을 수 없습니다.');
  return { id: postId, ...(data as Omit<BoardPost, 'id'>) };
}

export async function createPost(
  data: Omit<BoardPost, 'id' | 'likes' | 'commentCount' | 'createdAt' | 'status'>
): Promise<string> {
  const postsRef = ref(db, '/board_posts');
  const createdRef = push(postsRef);
  if (!createdRef.key) throw new Error('게시글 생성에 실패했습니다.');

  await set(createdRef, {
    ...data,
    deviceId: data.deviceId || getDeviceId(),
    likes: 0,
    commentCount: 0,
    createdAt: Date.now(),
    status: 'active',
  });
  return createdRef.key;
}

export async function fetchComments(postId: string): Promise<BoardComment[]> {
  const snapshot = await get(ref(db, `/board_comments/${postId}`));
  return parseComments(postId, snapshot.val() ?? {})
    .filter((comment) => comment.status !== 'hidden')
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function createComment(
  postId: string,
  data: Omit<BoardComment, 'id' | 'postId' | 'createdAt' | 'status'>
): Promise<void> {
  const commentsRef = ref(db, `/board_comments/${postId}`);
  const createdRef = push(commentsRef);
  await set(createdRef, {
    ...data,
    deviceId: data.deviceId || getDeviceId(),
    createdAt: Date.now(),
    status: 'active',
  });
  await runTransaction(ref(db, `/board_posts/${postId}/commentCount`), (count) => (count ?? 0) + 1);
}

export async function toggleLike(postId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const key = `grmap_liked_${postId}`;
  const isLiked = localStorage.getItem(key) === '1';
  await runTransaction(ref(db, `/board_posts/${postId}/likes`), (likes) => {
    const current = likes ?? 0;
    return isLiked ? Math.max(0, current - 1) : current + 1;
  });
  localStorage.setItem(key, isLiked ? '0' : '1');
}

export async function deletePost(postId: string, passwordHash: string): Promise<void> {
  const post = await fetchPost(postId);
  if (passwordHash !== post.passwordHash) throw new Error('비밀번호가 틀렸습니다.');
  await update(ref(db, `/board_posts/${postId}`), { status: 'hidden' });
}

export async function deleteComment(postId: string, commentId: string, passwordHash: string): Promise<void> {
  const snapshot = await get(ref(db, `/board_comments/${postId}/${commentId}`));
  const comment = snapshot.val() as Omit<BoardComment, 'id' | 'postId'> | null;
  if (!comment) throw new Error('댓글을 찾을 수 없습니다.');
  if (passwordHash !== comment.passwordHash) throw new Error('비밀번호가 틀렸습니다.');
  await update(ref(db, `/board_comments/${postId}/${commentId}`), { status: 'hidden' });
  await runTransaction(ref(db, `/board_posts/${postId}/commentCount`), (count) => Math.max(0, (count ?? 0) - 1));
}
