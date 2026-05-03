import { getAuthSession } from './authApi';
import { buildApiUrl } from './apiConfig';

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
  return apiRequest<TimelineTweet[]>('/tweets/timeline');
}

export function getFeed(scope: 'forYou' | 'following') {
  const queryScope = scope === 'forYou' ? 'for-you' : 'following';
  return apiRequest<TimelineTweet[]>(`/tweets/feed?scope=${encodeURIComponent(queryScope)}`);
}

export function getTrendingTopics() {
  return apiRequest<Array<{ topic: string; posts: string }>>('/tweets/trending');
}

export function getLeadStory() {
  return apiRequest<{ title: string; byline?: string; image?: string; tweetId?: number }>('/tweets/lead');
}

export function searchTweets(query: string, viewerUserId?: string) {
  const queryParams = new URLSearchParams({ q: query });

  if (viewerUserId) {
    queryParams.set('viewerUserId', viewerUserId);
  }

  return apiRequest<TimelineTweet[]>(`/tweets/search?${queryParams.toString()}`);
}

export function getTweetsByUser(userId: number, viewerUserId?: string) {
  const queryParams = viewerUserId ? `?viewerUserId=${encodeURIComponent(viewerUserId)}` : '';
  return apiRequest<TimelineTweet[]>(`/tweets/user/${userId}${queryParams}`);
}

export function createTweet(content: string) {
  return apiRequest<{ message: string; tweet: unknown }>('/tweets', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function retweetTweet(tweetId: number) {
  return apiRequest<{ message: string; tweet: unknown }>(`/tweets/${tweetId}/retweet`, {
    method: 'POST',
  });
}

export function getTweetDetail(tweetId: number, viewerUserId?: string) {
  const queryParams = viewerUserId ? `?viewerUserId=${encodeURIComponent(viewerUserId)}` : '';
  return apiRequest<TweetDetailResponse>(`/tweets/${tweetId}${queryParams}`);
}