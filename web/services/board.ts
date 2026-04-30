import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import type { BoardComment, BoardPost, BoardPostType, PostCategory, PostStatus } from '@grmap/shared/types';
import { db } from '@/lib/firebase';

const PAGE_SIZE = 20;
const COMMENT_PAGE_SIZE = 30;
const POSTS = 'posts';
const COMMENTS = 'comments';
const POSTS_CACHE_TTL_MS = 10000;
const COMMENTS_CACHE_TTL_MS = 10000;
const VIEW_THROTTLE_MS = 60 * 1000;
const LIKE_DEBOUNCE_MS = 400;

const postsCache = new Map<string, { at: number; data: BoardPost[] }>();
const commentsCache = new Map<string, { at: number; data: BoardComment[] }>();
const likeInitialState = new Map<string, boolean>();
const likeTargetState = new Map<string, boolean>();
const likeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

function isIndexError(error: unknown): boolean {
  return (error as FirestoreError | undefined)?.code === 'failed-precondition';
}

function applyPostFilters(posts: BoardPost[], category?: PostCategory, zoneTag?: string): BoardPost[] {
  return posts.filter((post) => {
    if (post.status === 'hidden') return false;
    if (category && post.category !== category) return false;
    if (zoneTag && zoneTag !== 'all' && post.zoneTag !== zoneTag) return false;
    return true;
  });
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const key = 'grmap_device_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
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
  const commentCount = Number(data.commentCount ?? 0);
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
    commentCount,
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

function calculateSignalScore(post: BoardPost): number {
  const ageMs = Date.now() - post.createdAt;
  const within24h = ageMs <= 24 * 60 * 60 * 1000;
  const timeBonus = within24h ? Math.max(0, 24 - Math.floor(ageMs / (60 * 60 * 1000))) : 0;
  const typeBonus = post.type === 'demand' || post.type === 'supply' ? 10 : 0;
  return post.viewCount * 1 + post.commentCount * 3 + post.likeCount * 5 + typeBonus + timeBonus;
}

export function getMarketSignal(posts: BoardPost[]): BoardPost[] {
  return [...posts]
    .filter((post) => post.status === 'active')
    .sort((a, b) => {
      const demandSupplyA = a.type === 'demand' || a.type === 'supply' ? 1 : 0;
      const demandSupplyB = b.type === 'demand' || b.type === 'supply' ? 1 : 0;
      if (demandSupplyA !== demandSupplyB) return demandSupplyB - demandSupplyA;
      return calculateSignalScore(b) - calculateSignalScore(a);
    })
    .slice(0, 5);
}

export function subscribePosts(
  callback: (posts: BoardPost[]) => void,
  category?: PostCategory,
  zoneTag?: string
): () => void {
  const constraints: Array<ReturnType<typeof orderBy> | ReturnType<typeof where> | ReturnType<typeof limit>> = [
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE),
  ];
  if (category) constraints.push(where('category', '==', category));
  if (zoneTag && zoneTag !== 'all') constraints.push(where('zoneTag', '==', zoneTag));
  const primaryQuery = query(collection(db, POSTS), ...constraints);
  let fallbackUnsubscribe: (() => void) | null = null;
  const primaryUnsubscribe = onSnapshot(
    primaryQuery,
    (snap) => {
      const posts = applyPostFilters(
        snap.docs.map((d) => mapPost(d.id, d.data() as Record<string, unknown>)),
        category,
        zoneTag
      );
      callback(posts);
    },
    (error) => {
      if (isIndexError(error) && (category || (zoneTag && zoneTag !== 'all')) && !fallbackUnsubscribe) {
        const fallbackQuery = query(collection(db, POSTS), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
        fallbackUnsubscribe = onSnapshot(fallbackQuery, (snap) => {
          const posts = applyPostFilters(
            snap.docs.map((d) => mapPost(d.id, d.data() as Record<string, unknown>)),
            category,
            zoneTag
          );
          callback(posts);
        });
      }
    }
  );
  return () => {
    primaryUnsubscribe();
    fallbackUnsubscribe?.();
  };
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
  try {
    const snap = await getDocs(query(collection(db, POSTS), ...constraints));
    const posts = applyPostFilters(
      snap.docs.map((d) => mapPost(d.id, d.data() as Record<string, unknown>)),
      category,
      zoneTag
    );
    return { posts, cursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : null };
  } catch (error) {
    if (!isIndexError(error) || (!category && (!zoneTag || zoneTag === 'all'))) {
      throw error;
    }
    const fallbackConstraints: Array<ReturnType<typeof orderBy> | ReturnType<typeof limit> | ReturnType<typeof startAfter>> = [
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    ];
    if (cursor) fallbackConstraints.push(startAfter(cursor));
    const snap = await getDocs(query(collection(db, POSTS), ...fallbackConstraints));
    const posts = applyPostFilters(
      snap.docs.map((d) => mapPost(d.id, d.data() as Record<string, unknown>)),
      category,
      zoneTag
    );
    return { posts, cursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : null };
  }
}

export async function fetchPosts(category?: PostCategory, zoneTag?: string): Promise<BoardPost[]> {
  const key = postsCacheKey(category, zoneTag);
  const cached = postsCache.get(key);
  if (cached && Date.now() - cached.at < POSTS_CACHE_TTL_MS) {
    return cached.data;
  }
  const { posts } = await fetchPostsPage(category, zoneTag);
  postsCache.set(key, { at: Date.now(), data: posts });
  return posts;
}

export async function fetchPost(postId: string): Promise<BoardPost> {
  const snapshot = await getDoc(doc(db, POSTS, postId));
  if (!snapshot.exists()) throw new Error('게시글을 찾을 수 없습니다.');
  const post = mapPost(snapshot.id, snapshot.data() as Record<string, unknown>);
  if (post.status === 'hidden') throw new Error('게시글을 찾을 수 없습니다.');
  return post;
}

export function subscribePost(postId: string, callback: (post: BoardPost | null) => void): () => void {
  return onSnapshot(doc(db, POSTS, postId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(mapPost(snapshot.id, snapshot.data() as Record<string, unknown>));
  });
}

export async function incrementPostView(postId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const key = `grmap_viewed_${postId}`;
  const last = Number(localStorage.getItem(key) ?? '0');
  const now = Date.now();
  if (now - last < VIEW_THROTTLE_MS) return;
  localStorage.setItem(key, String(now));
  await updateDoc(doc(db, POSTS, postId), { viewCount: increment(1) });
}

export async function createPost(
  data: Omit<BoardPost, 'id' | 'likes' | 'likeCount' | 'viewCount' | 'commentCount' | 'createdAt' | 'status' | 'type'>
): Promise<string> {
  console.log('createPost priceItem:', data.priceItem);
  const payload = omitUndefined({
    ...data,
    deviceId: data.deviceId || getDeviceId(),
    type: mapCategoryToType(data.category),
    likes: 0,
    likeCount: 0,
    viewCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    status: 'active',
  });
  const createdRef = await addDoc(collection(db, POSTS), payload);
  postsCache.clear();
  return createdRef.id;
}

export async function fetchComments(postId: string): Promise<BoardComment[]> {
  const cached = commentsCache.get(postId);
  if (cached && Date.now() - cached.at < COMMENTS_CACHE_TTL_MS) {
    return cached.data;
  }
  const q = query(
    collection(db, COMMENTS),
    where('postId', '==', postId),
    orderBy('createdAt', 'desc'),
    limit(COMMENT_PAGE_SIZE)
  );
  const snap = await getDocs(q);
  const comments = snap.docs
    .map((d) => mapComment(d.id, d.data() as Record<string, unknown>))
    .filter((comment) => comment.status !== 'hidden')
    .reverse();
  commentsCache.set(postId, { at: Date.now(), data: comments });
  return comments;
}

export function subscribeComments(postId: string, callback: (comments: BoardComment[]) => void): () => void {
  const primaryQuery = query(
    collection(db, COMMENTS),
    where('postId', '==', postId),
    orderBy('createdAt', 'desc'),
    limit(COMMENT_PAGE_SIZE)
  );
  let fallbackUnsubscribe: (() => void) | null = null;
  const primaryUnsubscribe = onSnapshot(
    primaryQuery,
    (snap) => {
      const comments = snap.docs
        .map((d) => mapComment(d.id, d.data() as Record<string, unknown>))
        .filter((comment) => comment.status !== 'hidden')
        .reverse();
      commentsCache.set(postId, { at: Date.now(), data: comments });
      callback(comments);
    },
    (error) => {
      if (isIndexError(error) && !fallbackUnsubscribe) {
        const fallbackQuery = query(collection(db, COMMENTS), orderBy('createdAt', 'desc'), limit(COMMENT_PAGE_SIZE));
        fallbackUnsubscribe = onSnapshot(fallbackQuery, (snap) => {
          const comments = snap.docs
            .map((d) => mapComment(d.id, d.data() as Record<string, unknown>))
            .filter((comment) => comment.postId === postId && comment.status !== 'hidden')
            .reverse();
          commentsCache.set(postId, { at: Date.now(), data: comments });
          callback(comments);
        });
      }
    }
  );
  return () => {
    primaryUnsubscribe();
    fallbackUnsubscribe?.();
  };
}

export async function createComment(
  postId: string,
  data: Omit<BoardComment, 'id' | 'postId' | 'createdAt' | 'status'>
): Promise<void> {
  const created = doc(collection(db, COMMENTS));
  const batch = writeBatch(db);
  batch.set(created, {
    postId,
    ...data,
    deviceId: data.deviceId || getDeviceId(),
    createdAt: serverTimestamp(),
    status: 'active',
  });
  batch.update(doc(db, POSTS, postId), { commentCount: increment(1) });
  await batch.commit();
  commentsCache.delete(postId);
  postsCache.clear();
}

export async function toggleLike(postId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const key = `grmap_liked_${postId}`;
  const current = likeTargetState.has(postId)
    ? Boolean(likeTargetState.get(postId))
    : localStorage.getItem(key) === '1';

  if (!likeInitialState.has(postId)) {
    likeInitialState.set(postId, current);
  }
  const next = !current;
  likeTargetState.set(postId, next);
  localStorage.setItem(key, next ? '1' : '0');

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

export async function fetchTodayHot(): Promise<BoardPost[]> {
  const todayStart = Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0)));
  const q = query(
    collection(db, POSTS),
    where('status', '==', 'active'),
    where('createdAt', '>=', todayStart),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapPost(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount))
    .slice(0, 3);
}

export async function deletePost(postId: string, passwordHash: string): Promise<void> {
  const post = await fetchPost(postId);
  if (passwordHash !== post.passwordHash) throw new Error('비밀번호가 틀렸습니다.');
  await updateDoc(doc(db, POSTS, postId), { status: 'hidden' });
  postsCache.clear();
}

export async function deleteComment(postId: string, commentId: string, passwordHash: string): Promise<void> {
  const snapshot = await getDoc(doc(db, COMMENTS, commentId));
  if (!snapshot.exists()) throw new Error('댓글을 찾을 수 없습니다.');
  const comment = mapComment(snapshot.id, snapshot.data() as Record<string, unknown>);
  if (passwordHash !== comment.passwordHash) throw new Error('비밀번호가 틀렸습니다.');
  const batch = writeBatch(db);
  batch.update(doc(db, COMMENTS, commentId), { status: 'hidden' });
  batch.update(doc(db, POSTS, postId), { commentCount: increment(-1) });
  await batch.commit();
  commentsCache.delete(postId);
  postsCache.clear();
}

export async function updatePostStatus(postId: string, status: PostStatus): Promise<void> {
  const payload: { status: PostStatus; type?: BoardPostType } = { status };
  if (status === 'done') payload.type = 'closed';
  await updateDoc(doc(db, POSTS, postId), payload);
  postsCache.clear();
}
