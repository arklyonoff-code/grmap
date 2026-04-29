import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { BoardComment, BoardPost, BoardPostType, PostCategory, PostStatus } from '@grmap/shared/types';
import { db } from './firebase';
const PAGE_SIZE = 20;
const POSTS = 'posts';
const COMMENTS = 'comments';
const COMMENT_PAGE_SIZE = 30;
const VIEW_THROTTLE_MS = 60 * 1000;
const LIKE_DEBOUNCE_MS = 400;
const postsCache = new Map<string, { at: number; data: BoardPost[] }>();
const commentsCache = new Map<string, { at: number; data: BoardComment[] }>();
const likeInitialState = new Map<string, boolean>();
const likeTargetState = new Map<string, boolean>();
const likeTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function getDeviceId() {
  const key = 'grmap_device_id';
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;
  const created = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(key, created);
  return created;
}

function mapCategoryToType(category: PostCategory): BoardPostType {
  if (category === 'wanted') return 'demand';
  if (category === 'selling') return 'supply';
  if (category === 'price') return 'price_signal';
  return 'info';
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

function mapPost(id: string, data: Record<string, unknown>): BoardPost {
  const likeCount = Number(data.likeCount ?? data.likes ?? 0);
  return {
    id,
    title: String(data.title ?? ''),
    content: String(data.content ?? ''),
    nickname: String(data.nickname ?? ''),
    passwordHash: String(data.passwordHash ?? ''),
    type: (data.type as BoardPostType) ?? 'info',
    category: (data.category as PostCategory) ?? 'free',
    zoneTag: String(data.zoneTag ?? 'all'),
    deviceId: String(data.deviceId ?? ''),
    viewCount: Number(data.viewCount ?? 0),
    likeCount,
    likes: likeCount,
    commentCount: Number(data.commentCount ?? 0),
    createdAt: toMillis(data.createdAt),
    status: (data.status as PostStatus) ?? 'active',
    priceItem: data.priceItem ? String(data.priceItem) : undefined,
    priceValue: typeof data.priceValue === 'number' ? data.priceValue : undefined,
    priceUnit: data.priceUnit ? String(data.priceUnit) : undefined,
    priceYesterday: typeof data.priceYesterday === 'number' ? data.priceYesterday : undefined,
  };
}

function mapComment(id: string, data: Record<string, unknown>): BoardComment {
  return {
    id,
    postId: String(data.postId ?? ''),
    content: String(data.content ?? ''),
    nickname: String(data.nickname ?? ''),
    passwordHash: String(data.passwordHash ?? ''),
    deviceId: String(data.deviceId ?? ''),
    createdAt: toMillis(data.createdAt),
    status: (data.status as PostStatus) ?? 'active',
  };
}

export function subscribePosts(callback: (posts: BoardPost[]) => void, category?: PostCategory, zoneTag?: string) {
  const constraints: Array<ReturnType<typeof orderBy> | ReturnType<typeof where> | ReturnType<typeof limit>> = [
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE),
  ];
  if (category) constraints.push(where('category', '==', category));
  if (zoneTag && zoneTag !== 'all') constraints.push(where('zoneTag', '==', zoneTag));
  const q = query(collection(db, POSTS), ...constraints);
  return onSnapshot(q, (snapshot) => {
    let posts = snapshot.docs.map((item) => mapPost(item.id, item.data() as Record<string, unknown>));
    posts = posts.filter((post) => post.status !== 'hidden');
    callback(posts);
  });
}

function postsCacheKey(category?: PostCategory, zoneTag?: string) {
  return `${category ?? 'all'}:${zoneTag ?? 'all'}`;
}

export async function fetchPostsPage(
  category?: PostCategory,
  zoneTag?: string,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: BoardPost[]; cursor: QueryDocumentSnapshot<DocumentData> | null }> {
  const constraints: Array<
    ReturnType<typeof orderBy> | ReturnType<typeof where> | ReturnType<typeof limit> | ReturnType<typeof startAfter>
  > = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
  if (category) constraints.push(where('category', '==', category));
  if (zoneTag && zoneTag !== 'all') constraints.push(where('zoneTag', '==', zoneTag));
  if (cursor) constraints.push(startAfter(cursor));
  const snapshot = await getDocs(query(collection(db, POSTS), ...constraints));
  let posts = snapshot.docs.map((item) => mapPost(item.id, item.data() as Record<string, unknown>));
  posts = posts.filter((post) => post.status !== 'hidden');
  return { posts, cursor: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null };
}

export async function fetchPosts(category?: PostCategory, zoneTag?: string) {
  const key = postsCacheKey(category, zoneTag);
  const cached = postsCache.get(key);
  if (cached && Date.now() - cached.at < 10000) return cached.data;
  const { posts } = await fetchPostsPage(category, zoneTag);
  postsCache.set(key, { at: Date.now(), data: posts });
  return posts;
}

export async function fetchPost(postId: string) {
  const snapshot = await getDoc(doc(db, POSTS, postId));
  if (!snapshot.exists()) throw new Error('게시글을 찾을 수 없습니다.');
  const post = mapPost(snapshot.id, snapshot.data() as Record<string, unknown>);
  if (post.status === 'hidden') throw new Error('게시글을 찾을 수 없습니다.');
  return post;
}

export function subscribePost(postId: string, callback: (post: BoardPost | null) => void) {
  return onSnapshot(doc(db, POSTS, postId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(mapPost(snapshot.id, snapshot.data() as Record<string, unknown>));
  });
}

export async function incrementPostView(postId: string) {
  const key = `grmap_viewed_${postId}`;
  const last = Number((await AsyncStorage.getItem(key)) ?? '0');
  const now = Date.now();
  if (now - last < VIEW_THROTTLE_MS) return;
  await AsyncStorage.setItem(key, String(now));
  await updateDoc(doc(db, POSTS, postId), { viewCount: increment(1) });
}

export async function createPost(
  data: Omit<BoardPost, 'id' | 'likes' | 'likeCount' | 'viewCount' | 'commentCount' | 'createdAt' | 'status' | 'type'>
) {
  const createdRef = await addDoc(collection(db, POSTS), {
    ...data,
    deviceId: data.deviceId || (await getDeviceId()),
    type: mapCategoryToType(data.category),
    likes: 0,
    likeCount: 0,
    viewCount: 0,
    commentCount: 0,
    signalScore: 0,
    createdAt: serverTimestamp(),
    status: 'active',
  });
  postsCache.clear();
  return createdRef.id;
}

export async function fetchComments(postId: string) {
  const cached = commentsCache.get(postId);
  if (cached && Date.now() - cached.at < 10000) return cached.data;
  const q = query(collection(db, COMMENTS), where('postId', '==', postId), orderBy('createdAt', 'desc'), limit(COMMENT_PAGE_SIZE));
  const snapshot = await getDocs(q);
  const comments = snapshot.docs
    .map((item) => mapComment(item.id, item.data() as Record<string, unknown>))
    .filter((item) => item.status !== 'hidden')
    .reverse();
  commentsCache.set(postId, { at: Date.now(), data: comments });
  return comments;
}

export function subscribeComments(postId: string, callback: (comments: BoardComment[]) => void) {
  const q = query(collection(db, COMMENTS), where('postId', '==', postId), orderBy('createdAt', 'desc'), limit(COMMENT_PAGE_SIZE));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs
      .map((item) => mapComment(item.id, item.data() as Record<string, unknown>))
      .filter((item) => item.status !== 'hidden')
      .reverse();
    commentsCache.set(postId, { at: Date.now(), data: comments });
    callback(comments);
  });
}

export async function createComment(
  postId: string,
  data: Omit<BoardComment, 'id' | 'postId' | 'createdAt' | 'status'>
) {
  const created = doc(collection(db, COMMENTS));
  const batch = writeBatch(db);
  batch.set(created, {
    postId,
    ...data,
    deviceId: data.deviceId || (await getDeviceId()),
    createdAt: serverTimestamp(),
    status: 'active',
  });
  batch.update(doc(db, POSTS, postId), { commentCount: increment(1) });
  await batch.commit();
  commentsCache.delete(postId);
  postsCache.clear();
}

export async function toggleLike(postId: string) {
  const key = `grmap_liked_${postId}`;
  const current = likeTargetState.has(postId)
    ? Boolean(likeTargetState.get(postId))
    : (await AsyncStorage.getItem(key)) === '1';
  if (!likeInitialState.has(postId)) likeInitialState.set(postId, current);
  const next = !current;
  likeTargetState.set(postId, next);
  await AsyncStorage.setItem(key, next ? '1' : '0');

  const prevTimer = likeTimers.get(postId);
  if (prevTimer) clearTimeout(prevTimer);
  const timer = setTimeout(async () => {
    const initial = Boolean(likeInitialState.get(postId));
    const target = Boolean(likeTargetState.get(postId));
    if (initial !== target) {
      const delta = target ? 1 : -1;
      await updateDoc(doc(db, POSTS, postId), {
        likes: increment(delta),
        likeCount: increment(delta),
      });
    }
    likeInitialState.delete(postId);
    likeTargetState.delete(postId);
    likeTimers.delete(postId);
    postsCache.clear();
  }, LIKE_DEBOUNCE_MS);
  likeTimers.set(postId, timer);
}

export async function deletePost(postId: string, passwordHash: string) {
  const post = await fetchPost(postId);
  if (post.passwordHash !== passwordHash) throw new Error('비밀번호가 틀렸습니다.');
  await updateDoc(doc(db, POSTS, postId), { status: 'hidden' });
  postsCache.clear();
}

export async function deleteComment(postId: string, commentId: string, passwordHash: string) {
  const snapshot = await getDoc(doc(db, COMMENTS, commentId));
  if (!snapshot.exists()) throw new Error('댓글을 찾을 수 없습니다.');
  const comment = mapComment(snapshot.id, snapshot.data() as Record<string, unknown>);
  if (comment.passwordHash !== passwordHash) throw new Error('비밀번호가 틀렸습니다.');
  const batch = writeBatch(db);
  batch.update(doc(db, COMMENTS, commentId), { status: 'hidden' });
  batch.update(doc(db, POSTS, postId), { commentCount: increment(-1) });
  await batch.commit();
  commentsCache.delete(postId);
  postsCache.clear();
}

export async function updatePostStatus(postId: string, status: PostStatus) {
  const payload: { status: PostStatus; type?: BoardPostType } = { status };
  if (status === 'done') payload.type = 'closed';
  await updateDoc(doc(db, POSTS, postId), payload);
  postsCache.clear();
}
