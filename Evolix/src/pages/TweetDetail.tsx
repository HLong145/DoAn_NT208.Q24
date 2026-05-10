import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ArrowLeft, MessageCircle, Repeat2, Heart, Share, Bookmark, MoreHorizontal, Image as ImageIcon, Smile, ListTodo, Calendar, MapPin } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TrendingSidebar from '../components/TrendingSidebar';
import { toggleBookmark } from '../services/bookmarksApi';
import { createComment, getComments } from '../services/commentsApi';
import { getCurrentUser, type AuthUser } from '../services/authApi';
import { getUserProfile } from '../services/usersApi';
import { getTweetDetail, retweetTweet, type TweetDetail as TweetDetailType, type TweetComment } from '../services/tweetsApi';
import { toggleLike } from '../services/likesApi';

const EMOJI_LIST = ['😀','😂','🥹','😍','🥰','😎','🤔','😭','😤','😡','👍','👎','❤️','🔥','💯','✨','🎉','🙏','👏','💪','👀','💀','🥺','😢','🤣','🎊','⭐','💫','🎯','🫡','😴','🤯','🥳','😇','🤩','😬','🫶','💔','🖤','🫠'];


export default function TweetDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const tweetId = Number(id);
  const [replyText, setReplyText] = useState('');
  const [tweet, setTweet] = useState<TweetDetailType | null>(null);
  const [comments, setComments] = useState<TweetComment[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [repostsCount, setRepostsCount] = useState(0);
  const [repliesCount, setRepliesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const likingRef = useRef(false);
  const repostingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [isInlineSubmitting, setIsInlineSubmitting] = useState(false);
  const [replyMediaFiles, setReplyMediaFiles] = useState<File[]>([]);
  const replyMediaInputRef = useRef<HTMLInputElement>(null);
  const [inlineReplyMediaFiles, setInlineReplyMediaFiles] = useState<File[]>([]);
  const inlineReplyMediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadTweetDetail = async () => {
      if (!Number.isFinite(tweetId)) {
        setErrorMessage('Invalid tweet id.');
        setIsLoading(false);
        return;
      }

      try {
        setErrorMessage('');
        setIsLoading(true);
        const response = await getTweetDetail(tweetId, currentUser?.id);
        setTweet(response.tweet);
        setComments(response.tweet.comments ?? []);
        setIsLiked(response.tweet.isLiked ?? false);
        setIsReposted(response.tweet.isReposted ?? false);
        setLikesCount(response.tweet.stats.likes);
        setRepostsCount(response.tweet.stats.reposts);
        setRepliesCount(response.tweet.stats.replies);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load tweet detail.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadTweetDetail();
  }, [tweetId, currentUser?.id]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await getCurrentUser();
        setCurrentUser(response.user);
        try {
          const profile = await getUserProfile(response.user.handle);
          setCurrentUserAvatar(profile.user.avatarUrl ?? undefined);
        } catch (err) {
          setCurrentUserAvatar(undefined);
        }
      } catch (error) {
        console.error('Could not load current user:', error);
        setCurrentUser(null);
      }
    };

    void loadCurrentUser();
  }, []);

  const renderContentWithLinks = (text: string) => {
    const parts = text.split(/(@\w+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return (
          <span key={index} className="text-primary hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleReplyChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  const handleLikeToggle = async () => {
    if (likingRef.current) return;
    likingRef.current = true;
    setIsLiking(true);
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => nextLiked ? prev + 1 : Math.max(0, prev - 1));
    try {
      await toggleLike(tweetId);
    } catch {
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => nextLiked ? Math.max(0, prev - 1) : prev + 1);
    } finally {
      likingRef.current = false;
      setIsLiking(false);
    }
  };

  const handleRepostToggle = async () => {
    if (repostingRef.current) return;
    repostingRef.current = true;
    setIsReposting(true);
    const nextReposted = !isReposted;
    setIsReposted(nextReposted);
    setRepostsCount((prev) => nextReposted ? prev + 1 : Math.max(0, prev - 1));
    try {
      await retweetTweet(tweetId);
    } catch {
      setIsReposted((prev) => !prev);
      setRepostsCount((prev) => nextReposted ? Math.max(0, prev - 1) : prev + 1);
    } finally {
      repostingRef.current = false;
      setIsReposting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const insertEmoji = (emoji: string) => {
    const textarea = replyTextareaRef.current;
    if (!textarea) {
      setReplyText((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart ?? replyText.length;
    const end = textarea.selectionEnd ?? replyText.length;
    const next = replyText.slice(0, start) + emoji + replyText.slice(end);
    setReplyText(next);
    setTimeout(() => {
      textarea.selectionStart = start + emoji.length;
      textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
    setShowEmojiPicker(false);
  };

  const buildCommentTree = (allComments: TweetComment[]) => {
    const idSet = new Set(allComments.map((c) => c.id));
    const authorHandles = new Set(allComments.map((c) => c.author.handle));
    const replyIds = new Set<string>();
    const parentMap = new Map<string, string>();

    for (let i = 0; i < allComments.length; i++) {
      const comment = allComments[i];
      // Prefer DB parentCommentId when available and refers to a known comment
      if (comment.parentCommentId != null) {
        const parentStrId = comment.parentCommentId.toString();
        if (idSet.has(parentStrId)) {
          parentMap.set(comment.id, parentStrId);
          replyIds.add(comment.id);
          continue;
        }
      }
      // Fallback: @mention heuristic
      const match = comment.content.match(/^@(\w+)/);
      if (match && authorHandles.has(match[1])) {
        for (let j = i - 1; j >= 0; j--) {
          if (allComments[j].author.handle === match[1] && !replyIds.has(allComments[j].id)) {
            parentMap.set(comment.id, allComments[j].id);
            replyIds.add(comment.id);
            break;
          }
        }
      }
    }

    const nodeMap = new Map<string, { comment: TweetComment; replies: TweetComment[] }>();
    const roots: { comment: TweetComment; replies: TweetComment[] }[] = [];

    for (const comment of allComments) {
      if (!replyIds.has(comment.id)) {
        const node = { comment, replies: [] as TweetComment[] };
        nodeMap.set(comment.id, node);
        roots.push(node);
      }
    }
    for (const comment of allComments) {
      if (replyIds.has(comment.id)) {
        const parentId = parentMap.get(comment.id);
        const parentNode = parentId ? nodeMap.get(parentId) : undefined;
        if (parentNode) parentNode.replies.push(comment);
        else roots.push({ comment, replies: [] });
      }
    }
    return roots;
  };

  const syncCommentsAfterPost = (expectedMinCount: number) => {
    const delays = [2000, 4000, 7000];
    let attempt = 0;
    const poll = async () => {
      if (attempt >= delays.length) return;
      await new Promise((r) => setTimeout(r, delays[attempt++]));
      try {
        const fresh = await getComments(tweetId);
        if (fresh.length >= expectedMinCount) {
          setComments(fresh);
          setRepliesCount(fresh.length);
          return;
        }
      } catch { /* ignore */ }
      poll();
    };
    poll();
  };

  const buildOptimisticComment = (text: string, mediaFiles?: File[]): TweetComment => ({
    id: `temp-${Date.now()}`,
    author: {
      id: Number(currentUser?.id),
      name: currentUser?.name ?? '',
      handle: currentUser?.handle ?? '',
      avatar: currentUserAvatar ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(currentUser?.handle ?? '')}`,
    },
    content: text,
    timestamp: '0s',
    media: mediaFiles?.length ? mediaFiles.map((f) => URL.createObjectURL(f)) : undefined,
  });

  const handleReplySubmit = async () => {
    if (!Number.isFinite(tweetId) || (replyText.trim() === '' && replyMediaFiles.length === 0) || !currentUser) return;
    const trimmedText = replyText.trim();
    const mediaSnapshot = [...replyMediaFiles];
    const optimistic = buildOptimisticComment(trimmedText, mediaSnapshot);
    const prevCount = comments.length;
    setComments((prev) => [...prev, optimistic]);
    setRepliesCount((prev) => prev + 1);
    setReplyText('');
    setReplyMediaFiles([]);
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await createComment(tweetId, trimmedText, undefined, mediaSnapshot.length ? mediaSnapshot : undefined);
      syncCommentsAfterPost(prevCount + 1);
    } catch (error) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setRepliesCount((prev) => Math.max(0, prev - 1));
      setReplyText(trimmedText);
      setReplyMediaFiles(mediaSnapshot);
      setErrorMessage(error instanceof Error ? error.message : 'Could not post reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineReplySubmit = async (commentId: string, commentHandle: string) => {
    if (!Number.isFinite(tweetId) || (inlineReplyText.trim() === '' && inlineReplyMediaFiles.length === 0) || !currentUser) return;
    const trimmedText = inlineReplyText.trim();
    const fullText = trimmedText ? `@${commentHandle} ${trimmedText}` : `@${commentHandle}`;
    const mediaSnapshot = [...inlineReplyMediaFiles];
    const optimistic = buildOptimisticComment(fullText, mediaSnapshot);
    const prevCount = comments.length;
    setInlineReplyText('');
    setInlineReplyMediaFiles([]);
    setActiveReplyCommentId(null);
    setComments((prev) => {
      const parentIdx = prev.findIndex((c) => c.id === commentId);
      if (parentIdx === -1) return [...prev, optimistic];
      return [...prev.slice(0, parentIdx + 1), optimistic, ...prev.slice(parentIdx + 1)];
    });
    setRepliesCount((prev) => prev + 1);
    try {
      setIsInlineSubmitting(true);
      const numericParentId = commentId.startsWith('temp-') ? undefined : Number(commentId);
      await createComment(tweetId, fullText, numericParentId, mediaSnapshot.length ? mediaSnapshot : undefined);
      syncCommentsAfterPost(prevCount + 1);
    } catch (error) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setRepliesCount((prev) => Math.max(0, prev - 1));
      setInlineReplyText(trimmedText);
      setInlineReplyMediaFiles(mediaSnapshot);
      setActiveReplyCommentId(commentId);
      setErrorMessage(error instanceof Error ? error.message : 'Could not post reply.');
    } finally {
      setIsInlineSubmitting(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!Number.isFinite(tweetId) || !tweet || isBookmarking) {
      return;
    }

    const nextBookmarked = !tweet.isBookmarked;
    setTweet((previousTweet) => previousTweet ? { ...previousTweet, isBookmarked: nextBookmarked } : previousTweet);

    try {
      setIsBookmarking(true);
      const response = await toggleBookmark(tweetId);
      setTweet((previousTweet) => previousTweet ? { ...previousTweet, isBookmarked: response.bookmarked } : previousTweet);
    } catch (error) {
      console.error('Could not toggle bookmark:', error);
      setTweet((previousTweet) => previousTweet ? { ...previousTweet, isBookmarked: !nextBookmarked } : previousTweet);
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-extrabold tracking-tight">Post</h1>
        </div>

        {errorMessage && (
          <div className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {isLoading || !tweet ? (
          <div className="px-4 py-8 text-text-muted">Loading post...</div>
        ) : (
          <>
            <article className="p-4 border-b border-border">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${tweet.author.handle}`}>
                    <img src={tweet.author.avatar} alt={tweet.author.name} className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity" />
                  </Link>
                  <div>
                    <Link to={`/profile/${tweet.author.handle}`} className="font-bold hover:underline block leading-tight">
                      {tweet.author.name}
                    </Link>
                    <span className="text-text-muted text-sm">@{tweet.author.handle}</span>
                  </div>
                </div>
                <button className="text-text-muted hover:text-text-base hover:bg-border/50 p-2 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[23px] leading-8 whitespace-pre-wrap break-words mb-4 tracking-tight">
                {renderContentWithLinks(tweet.content)}
              </p>

              {tweet.media && tweet.media.length > 0 && (
                <div className={`mb-4 grid gap-2 ${tweet.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} rounded-2xl overflow-hidden border border-border`}>
                  {tweet.media.map((url, index) => {
                    const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url);
                    return isVideo ? (
                      <video key={index} src={url} controls className="w-full max-h-[400px] object-contain bg-black" />
                    ) : (
                      <img key={index} src={url} alt="Tweet media" className="w-full h-auto" />
                    );
                  })}
                </div>
              )}

              <div className="text-text-muted text-[15px] mb-4 hover:underline cursor-pointer">
                {tweet.timestamp} · <span className="font-bold text-text-base">{tweet.stats.views}</span> Views
              </div>

              <div className="border-y border-border py-3 flex gap-6 text-[15px]">
                <button className="hover:underline"><span className="font-bold text-text-base">{repostsCount}</span> <span className="text-text-muted">Reposts</span></button>
                <button className="hover:underline"><span className="font-bold text-text-base">{likesCount}</span> <span className="text-text-muted">Likes</span></button>
                <button className="hover:underline"><span className="font-bold text-text-base">{repliesCount}</span> <span className="text-text-muted">Replies</span></button>
              </div>

              <div className="flex justify-around items-center py-2 text-text-muted border-b border-border">
                <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  className={`p-2 rounded-full transition-colors ${isReposted ? 'text-[#00ba7c] bg-[#00ba7c]/10' : 'hover:bg-[#00ba7c]/10 hover:text-[#00ba7c]'} ${isReposting ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={handleRepostToggle}
                  disabled={isReposting}
                >
                  <Repeat2 className="w-6 h-6" />
                </button>
                <button
                  className={`p-2 rounded-full transition-colors ${isLiked ? 'text-[#f91880] bg-[#f91880]/10' : 'hover:bg-[#f91880]/10 hover:text-[#f91880]'} ${isLiking ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button className={`p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors ${tweet.isBookmarked ? 'text-primary bg-primary/10' : ''} ${isBookmarking ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={handleBookmarkToggle} disabled={isBookmarking}>
                  <Bookmark className="w-6 h-6" />
                </button>
                <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <Share className="w-6 h-6" />
                </button>
              </div>
            </article>

            <div className="p-4 border-b border-border flex gap-4">
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt={currentUser?.name ?? 'User'} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}</div>
              )}
              <div className="flex-1">
                <div className="text-text-muted text-sm mb-1">
                  Replying to <span className="text-primary">@{tweet.author.handle}</span>
                </div>
                <textarea
                  ref={replyTextareaRef}
                  placeholder="Post your reply"
                  className="w-full bg-transparent resize-none outline-none text-[20px] placeholder:text-text-muted min-h-[50px] overflow-hidden"
                  value={replyText}
                  onChange={handleReplyChange}
                />

                {replyMediaFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 mb-1">
                    {replyMediaFiles.map((f, i) => (
                      <div key={i} className="relative group">
                        <img src={URL.createObjectURL(f)} alt="" className="w-20 h-20 object-cover rounded-xl border border-border" />
                        <button
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setReplyMediaFiles((prev) => prev.filter((_, j) => j !== i))}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={replyMediaInputRef}
                  type="file"
                  accept="image/*,video/*,.gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setReplyMediaFiles((prev) => [...prev, ...files].slice(0, 4));
                    e.target.value = '';
                  }}
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1 text-primary relative">
                    <button
                      className={`p-2 rounded-full hover:bg-primary/10 transition-colors ${replyMediaFiles.length >= 4 ? 'opacity-40 cursor-not-allowed' : ''}`}
                      title="Add image"
                      disabled={replyMediaFiles.length >= 4}
                      onClick={() => replyMediaInputRef.current?.click()}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors opacity-40 cursor-not-allowed" title="Poll coming soon">
                      <ListTodo className="w-5 h-5" />
                    </button>
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        title="Emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-10 left-0 z-50 bg-bg-panel border border-border rounded-2xl shadow-xl p-3 w-72 grid grid-cols-8 gap-1">
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              className="text-xl hover:bg-border/40 rounded-lg p-1 transition-colors"
                              onClick={() => insertEmoji(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors opacity-40 cursor-not-allowed hidden sm:block" title="Location coming soon">
                      <MapPin className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors opacity-40 cursor-not-allowed hidden sm:block" title="Schedule coming soon">
                      <Calendar className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    className={`bg-primary text-white px-5 py-1.5 rounded-full font-bold transition-colors ${(replyText.trim().length === 0 && replyMediaFiles.length === 0) || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
                    disabled={(replyText.trim().length === 0 && replyMediaFiles.length === 0) || isSubmitting}
                    onClick={handleReplySubmit}
                  >
                    {isSubmitting ? 'Replying...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {comments.length === 0 ? (
                <div className="px-4 py-8 text-text-muted">No replies yet.</div>
              ) : (
                buildCommentTree(comments).map(({ comment, replies }) => (
                  <div key={comment.id} className="border-b border-border">
                    {/* Top-level comment */}
                    <article className="px-4 py-4 flex gap-3 hover:bg-border/20 transition-colors group">
                      <Link to={`/profile/${comment.author.handle}`} onClick={(e) => e.stopPropagation()}>
                        <img src={comment.author.avatar} alt={comment.author.name} className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                          <Link to={`/profile/${comment.author.handle}`} className="font-bold text-text-base hover:underline">{comment.author.name}</Link>
                          <span>@{comment.author.handle}</span>
                          <span>·</span>
                          <span>{comment.timestamp}</span>
                        </div>
                        {comment.content && <p className="mt-1 text-[15px] leading-6 whitespace-pre-wrap break-words">{comment.content}</p>}
                        {comment.media && comment.media.length > 0 && (
                          <div className={`mt-2 grid gap-1 rounded-xl overflow-hidden border border-border ${comment.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {comment.media.map((url, idx) => {
                              const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url);
                              return isVideo
                                ? <video key={idx} src={url} controls className="w-full max-h-48 object-contain bg-black" />
                                : <img key={idx} src={url} alt="media" className="w-full h-auto max-h-48 object-cover" />;
                            })}
                          </div>
                        )}
                        {currentUser && (
                          <button
                            className="mt-1.5 text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              setActiveReplyCommentId((prev) => prev === comment.id ? null : comment.id);
                              setInlineReplyText('');
                              setInlineReplyMediaFiles([]);
                            }}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {activeReplyCommentId === comment.id
                              ? 'Cancel'
                              : replies.length > 0
                                ? `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
                                : 'Reply'}
                          </button>
                        )}
                      </div>
                    </article>

                    {/* Toggle section: existing replies + compose box */}
                    {activeReplyCommentId === comment.id && (
                      <div className="border-l-2 border-border ml-12 mb-2">
                        {/* Existing replies */}
                        {replies.map((reply) => (
                          <article key={reply.id} className="px-4 py-3 flex gap-3 hover:bg-border/20 transition-colors">
                            <Link to={`/profile/${reply.author.handle}`} onClick={(e) => e.stopPropagation()}>
                              <img src={reply.author.avatar} alt={reply.author.name} className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity" />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-text-muted">
                                <Link to={`/profile/${reply.author.handle}`} className="font-bold text-text-base hover:underline text-sm">{reply.author.name}</Link>
                                <span>@{reply.author.handle}</span>
                                <span>·</span>
                                <span>{reply.timestamp}</span>
                              </div>
                              {reply.content && <p className="mt-0.5 text-[14px] leading-5 whitespace-pre-wrap break-words">{reply.content}</p>}
                              {reply.media && reply.media.length > 0 && (
                                <div className={`mt-2 grid gap-1 rounded-xl overflow-hidden border border-border ${reply.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                  {reply.media.map((url, idx) => {
                                    const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url);
                                    return isVideo
                                      ? <video key={idx} src={url} controls className="w-full max-h-40 object-contain bg-black" />
                                      : <img key={idx} src={url} alt="media" className="w-full h-auto max-h-40 object-cover" />;
                                  })}
                                </div>
                              )}
                            </div>
                          </article>
                        ))}

                        {/* Compose box */}
                        <div className="px-4 py-3 flex gap-3">
                          {currentUserAvatar ? (
                            <img src={currentUserAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-border/50 flex items-center justify-center text-xs font-bold flex-shrink-0">{currentUser?.name?.charAt(0)?.toUpperCase()}</div>
                          )}
                          <div className="flex-1">
                            <div className="text-xs text-text-muted mb-1">Replying to <span className="text-primary">@{comment.author.handle}</span></div>
                            <textarea
                              autoFocus
                              placeholder={`Reply to @${comment.author.handle}...`}
                              className="w-full bg-transparent resize-none outline-none text-[15px] placeholder:text-text-muted min-h-[36px] overflow-hidden"
                              value={inlineReplyText}
                              onChange={(e) => {
                                setInlineReplyText(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                  handleInlineReplySubmit(comment.id, comment.author.handle);
                                }
                              }}
                            />
                            {inlineReplyMediaFiles.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {inlineReplyMediaFiles.map((f, i) => (
                                  <div key={i} className="relative group">
                                    <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 object-cover rounded-lg border border-border" />
                                    <button
                                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => setInlineReplyMediaFiles((prev) => prev.filter((_, j) => j !== i))}
                                    >×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <input
                              ref={inlineReplyMediaInputRef}
                              type="file"
                              accept="image/*,video/*,.gif"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                setInlineReplyMediaFiles((prev) => [...prev, ...files].slice(0, 4));
                                e.target.value = '';
                              }}
                            />
                            <div className="flex justify-between items-center mt-1">
                              <button
                                className={`p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors ${inlineReplyMediaFiles.length >= 4 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                disabled={inlineReplyMediaFiles.length >= 4}
                                onClick={() => inlineReplyMediaInputRef.current?.click()}
                                title="Add image"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                              <button
                                className={`bg-primary text-white px-4 py-1 rounded-full text-sm font-bold transition-colors ${(inlineReplyText.trim().length === 0 && inlineReplyMediaFiles.length === 0) || isInlineSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
                                disabled={(inlineReplyText.trim().length === 0 && inlineReplyMediaFiles.length === 0) || isInlineSubmitting}
                                onClick={() => handleInlineReplySubmit(comment.id, comment.author.handle)}
                              >
                                {isInlineSubmitting ? 'Replying...' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      <TrendingSidebar />
    </>
  );
}
