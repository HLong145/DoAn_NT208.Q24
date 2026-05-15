import { getAuthSession } from './authApi';
import { buildApiUrl, resolveAssetUrl } from './apiConfig';

export type TimelineTweet = {
  id: string;
  author: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  stats: {
    replies: number;
    reposts: number;
    likes: number;
    views: number;
  };
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  media?: string[];
  retweetedBy?: { name: string; handle: string };
};

export type TweetComment = {
  id: string;
  author: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  parentCommentId?: number | null;
  media?: string[];
};

export type TweetDetail = TimelineTweet & {
  originalTweetId?: number | null;
  comments: TweetComment[];
};

export type TweetDetailResponse = {
  tweet: TweetDetail;
};

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('Please sign in to continue.');
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${session.token}`);

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Request failed.');
  }

  return payload as T;
}

export function getTimeline() {
  return apiRequest<TimelineTweet[]>('/tweets/timeline').then((list) =>
    list.map((t) => ({
      ...t,
      media: t.media?.map((m) => resolveAssetUrl(m)),
      author: { ...t.author, avatar: resolveAssetUrl(t.author.avatar) },
    })),
  );
}

export function getFeed(scope: 'forYou' | 'following', { limit, offset }: { limit?: number; offset?: number } = {}) {
  const params = new URLSearchParams({ scope: scope === 'forYou' ? 'for-you' : 'following' });
  if (limit !== undefined) params.set('limit', String(limit));
  if (offset !== undefined && offset > 0) params.set('offset', String(offset));
  return apiRequest<TimelineTweet[]>(`/tweets/feed?${params.toString()}`).then((list) =>
    list.map((t) => ({
      ...t,
      media: t.media?.map((m) => resolveAssetUrl(m)),
      author: { ...t.author, avatar: resolveAssetUrl(t.author.avatar) },
    })),
  );
}

export function getTrendingTopics() {
  return apiRequest<Array<{ topic: string; posts: string }>>('/tweets/trending');
}

export function getLeadStory() {
  return apiRequest<{ title: string; byline?: string; image?: string; tweetId?: number }>('/tweets/lead').then((res) => ({
    ...res,
    image: resolveAssetUrl((res as any).image),
  }));
}

export function searchTweets(query: string, viewerUserId?: string) {
  const queryParams = new URLSearchParams({ q: query });

  if (viewerUserId) {
    queryParams.set('viewerUserId', viewerUserId);
  }

  return apiRequest<TimelineTweet[]>(`/tweets/search?${queryParams.toString()}`);
}

export function getTweetsByUser(userId: number, viewerUserId?: string, offset = 0) {
  const params = new URLSearchParams();
  if (viewerUserId) params.set('viewerUserId', viewerUserId);
  if (offset > 0) params.set('offset', String(offset));
  const qs = params.toString();
  return apiRequest<TimelineTweet[]>(`/tweets/user/${userId}${qs ? `?${qs}` : ''}`).then((list) =>
    list.map((t) => ({
      ...t,
      media: t.media?.map((m) => resolveAssetUrl(m)),
      author: { ...t.author, avatar: resolveAssetUrl(t.author.avatar) },
    })),
  );
}

export function getLikedTweetsByUser(userId: number, offset = 0) {
  const params = new URLSearchParams();
  if (offset > 0) params.set('offset', String(offset));
  const qs = params.toString();
  return apiRequest<TimelineTweet[]>(`/tweets/user/${userId}/likes${qs ? `?${qs}` : ''}`).then((list) =>
    list.map((t) => ({
      ...t,
      media: t.media?.map((m) => resolveAssetUrl(m)),
      author: { ...t.author, avatar: resolveAssetUrl(t.author.avatar) },
    })),
  );
}

export async function createTweet(content: string | undefined, mediaFiles?: File[]) {
  const session = getAuthSession();
  if (!session?.token) throw new Error('Please sign in to continue.');

  const form = new FormData();
  if (content) {
    form.append('content', content);
  }
  mediaFiles?.forEach((f) => form.append('media', f));

  const response = await fetch(buildApiUrl('/tweets'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}` },
    body: form,
  });

  type R = { message: string; tweet: unknown } & { error?: string; message?: string };
  const payload = (await response.json().catch(() => ({}))) as R;
  if (!response.ok) throw new Error(payload.message ?? payload.error ?? 'Request failed.');
  return payload;
}

export function retweetTweet(tweetId: number) {
  return apiRequest<{ message: string; tweet: unknown }>(`/tweets/${tweetId}/retweet`, {
    method: 'POST',
  });
}

export function deleteTweet(tweetId: number) {
  return apiRequest<{ message: string }>(`/tweets/${tweetId}`, {
    method: 'DELETE',
  });
}

export function getTweetDetail(tweetId: number, viewerUserId?: string) {
  const queryParams = viewerUserId ? `?viewerUserId=${encodeURIComponent(viewerUserId)}` : '';
  return apiRequest<TweetDetailResponse>(`/tweets/${tweetId}${queryParams}`).then((res) => {
    const t = res.tweet;
    const tweet: TweetDetail = {
      ...t,
      media: t.media?.map((m) => resolveAssetUrl(m)),
      author: { ...t.author, avatar: resolveAssetUrl(t.author.avatar) },
      comments: t.comments.map((c) => ({
        ...c,
        media: c.media?.map((m) => resolveAssetUrl(m)),
        author: { ...c.author, avatar: resolveAssetUrl(c.author.avatar) },
      })),
    };
    return { tweet };
  });
}