'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import {
  fetchPost,
  fetchComments,
  toggleLike,
  deletePost,
  createComment,
  deleteComment,
} from '@/services/board';
import { BoardPost, BoardComment } from '@grmap/shared/types';
import { CATEGORY_LABELS, CATEGORY_COLORS, ZONE_LABELS } from '@grmap/shared/constants/board';
import { generateRandomNickname } from '@grmap/shared/utils/nickname';
import { sha256 } from '@/utils/hash';
import { getElapsedText } from '@grmap/shared/utils/report';

export default function BoardDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>불러오는 중...</div>}>
      <BoardDetailContent />
    </Suspense>
  );
}

function BoardDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const postId = searchParams.get('id');

  const [post, setPost] = useState<BoardPost | null>(null);
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cNick, setCNick] = useState(generateRandomNickname());
  const [cPwd, setCPwd] = useState('');
  const [cContent, setCContent] = useState('');
  const [cLoading, setCLoading] = useState(false);

  useEffect(() => {
    if (!postId) {
      router.replace('/board');
      return;
    }
    const wasLiked = localStorage.getItem(`grmap_liked_${postId}`) === '1';
    setLiked(wasLiked);
    Promise.all([fetchPost(postId), fetchComments(postId)])
      .then(([p, c]) => {
        setPost(p);
        setComments(c);
      })
      .catch(() => setError('게시글을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [postId, router]);

  if (loading) return <div style={styles.center}>불러오는 중...</div>;
  if (error || !post) return <div style={styles.center}>{error || '게시글 없음'}</div>;

  const catColor = CATEGORY_COLORS[post.category];

  const handleLike = async () => {
    await toggleLike(post.id);
    const newLiked = !liked;
    setLiked(newLiked);
    localStorage.setItem(`grmap_liked_${post.id}`, newLiked ? '1' : '0');
    setPost((p) => (p ? { ...p, likes: p.likes + (newLiked ? 1 : -1) } : p));
  };

  const handleDeletePost = async () => {
    const pwd = prompt('비밀번호를 입력하세요');
    if (!pwd) return;
    const hash = await sha256(pwd);
    try {
      await deletePost(post.id, hash);
      router.replace('/board');
    } catch {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleComment = async () => {
    if (!cNick.trim() || !cPwd.trim() || !cContent.trim()) {
      alert('닉네임, 비밀번호, 내용을 모두 입력하세요.');
      return;
    }
    setCLoading(true);
    const hash = await sha256(cPwd);
    const deviceId = localStorage.getItem('grmap_device_id') || crypto.randomUUID();
    localStorage.setItem('grmap_device_id', deviceId);
    await createComment(post.id, {
      content: cContent,
      nickname: cNick,
      passwordHash: hash,
      deviceId,
    });
    const updated = await fetchComments(post.id);
    setComments(updated);
    setCContent('');
    setCPwd('');
    setCLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const pwd = prompt('댓글 비밀번호를 입력하세요');
    if (!pwd) return;
    const hash = await sha256(pwd);
    try {
      await deleteComment(post.id, commentId, hash);
      setComments((c) => c.filter((x) => x.id !== commentId));
    } catch {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <span style={{ ...styles.badge, background: catColor.bg, color: catColor.text }}>
            {CATEGORY_LABELS[post.category]}
          </span>
          {post.zoneTag !== 'all' && (
            <span style={{ ...styles.badge, background: '#F1F1F1', color: '#555' }}>
              {ZONE_LABELS[post.zoneTag as keyof typeof ZONE_LABELS]}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.4, marginBottom: 10 }}>{post.title}</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#999' }}>
            {post.nickname} · {getElapsedText(post.createdAt)}
          </span>
          <button onClick={handleDeletePost} style={styles.deleteBtn}>
            삭제
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: '#EEEEEE', margin: '16px 0' }} />

      <div
        style={{ padding: '0 16px', lineHeight: 1.8, fontSize: 16 }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <button
          onClick={handleLike}
          style={{
            fontSize: 28,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: liked ? '#E24B4A' : '#CCC',
          }}
        >
          ♥
        </button>
        <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>{post.likes}</div>
      </div>

      <div style={{ borderTop: '1px solid #EEEEEE', padding: '0 16px' }}>
        <div style={{ padding: '16px 0', fontWeight: 500 }}>댓글 {comments.length}개</div>
        {comments.map((c) => (
          <div key={c.id} style={{ padding: '12px 0', borderBottom: '0.5px solid #EEEEEE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{c.nickname}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#aaa' }}>{getElapsedText(c.createdAt)}</span>
                <button onClick={() => handleDeleteComment(c.id)} style={styles.deleteBtn}>
                  삭제
                </button>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{c.content}</p>
          </div>
        ))}

        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={cNick}
              onChange={(e) => setCNick(e.target.value)}
              placeholder="닉네임"
              maxLength={20}
              style={{ ...styles.input, flex: 1 }}
            />
            <input
              value={cPwd}
              onChange={(e) => setCPwd(e.target.value)}
              type="password"
              placeholder="비밀번호"
              maxLength={20}
              style={{ ...styles.input, flex: 1 }}
            />
          </div>
          <textarea
            value={cContent}
            onChange={(e) => setCContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            maxLength={500}
            rows={3}
            style={{ ...styles.input, width: '100%', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={handleComment} disabled={cLoading} style={styles.submitBtn}>
              {cLoading ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        <button onClick={() => router.push('/board')} style={styles.backBtn}>
          ← 목록으로
        </button>
      </div>
    </div>
  );
}

const styles = {
  center: { padding: 40, textAlign: 'center' as const, color: '#999' },
  badge: { fontSize: 12, padding: '3px 8px', borderRadius: 99, fontWeight: 500 },
  deleteBtn: {
    fontSize: 12,
    color: '#999',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #EEEEEE',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
  backBtn: {
    fontSize: 14,
    color: '#555',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
};
