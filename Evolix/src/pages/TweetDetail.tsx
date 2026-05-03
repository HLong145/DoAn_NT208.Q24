import { useEffect, useState, type ChangeEvent } from 'react';
import { ArrowLeft, MessageCircle, Repeat2, Heart, BarChart2, Share, Bookmark, MoreHorizontal, Image as ImageIcon, Smile, ListTodo, Calendar, MapPin } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TrendingSidebar from '../components/TrendingSidebar';
import { toggleBookmark } from '../services/bookmarksApi';
import { createComment } from '../services/commentsApi';
import { getCurrentUser, type AuthUser } from '../services/authApi';
import { getUserProfile } from '../services/usersApi';
import { getTweetDetail, type TweetDetail as TweetDetailType, type TweetComment } from '../services/tweetsApi';

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
  const [errorMessage, setErrorMessage] = useState('');

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

  const refreshComments = async () => {
    if (!Number.isFinite(tweetId)) {
      return;
    }

    const response = await getTweetDetail(tweetId, currentUser?.id);
    setTweet(response.tweet);
    setComments(response.tweet.comments ?? []);
  };

  const handleReplySubmit = async () => {
    if (!Number.isFinite(tweetId) || replyText.trim() === '') {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await createComment(tweetId, replyText.trim());
      setReplyText('');
      await refreshComments();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not post reply.');
    } finally {
      setIsSubmitting(false);
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
                <div className="mb-4 rounded-2xl overflow-hidden border border-border">
                  {tweet.media.map((url, index) => (
                    <img key={index} src={url} alt="Tweet media" className="w-full h-auto" />
                  ))}
                </div>
              )}

              <div className="text-text-muted text-[15px] mb-4 hover:underline cursor-pointer">
                {tweet.timestamp} · <span className="font-bold text-text-base">{tweet.stats.views}</span> Views
              </div>

              <div className="border-y border-border py-3 flex gap-6 text-[15px]">
                <button className="hover:underline"><span className="font-bold text-text-base">{tweet.stats.reposts}</span> <span className="text-text-muted">Reposts</span></button>
                <button className="hover:underline"><span className="font-bold text-text-base">{tweet.stats.likes}</span> <span className="text-text-muted">Likes</span></button>
                <button className="hover:underline"><span className="font-bold text-text-base">{tweet.stats.replies}</span> <span className="text-text-muted">Replies</span></button>
              </div>

              <div className="flex justify-around items-center py-2 text-text-muted border-b border-border">
                <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="p-2 rounded-full hover:bg-[#00ba7c]/10 hover:text-[#00ba7c] transition-colors">
                  <Repeat2 className="w-6 h-6" />
                </button>
                <button className="p-2 rounded-full hover:bg-[#f91880]/10 hover:text-[#f91880] transition-colors">
                  <Heart className="w-6 h-6" />
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
                <div className="text-text-muted text-sm mb-1">Replying to <span className="text-primary">@{tweet.author.handle}</span></div>
                <textarea
                  placeholder="Post your reply"
                  className="w-full bg-transparent resize-none outline-none text-[20px] placeholder:text-text-muted min-h-[50px] overflow-hidden"
                  value={replyText}
                  onChange={handleReplyChange}
                />

                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1 text-primary">
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                      <ListTodo className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors hidden sm:block">
                      <MapPin className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors hidden sm:block">
                      <Calendar className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    className={`bg-primary text-white px-5 py-1.5 rounded-full font-bold transition-colors ${replyText.trim().length === 0 || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
                    disabled={replyText.trim().length === 0 || isSubmitting}
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
                comments.map((comment) => (
                  <article key={comment.id} className="px-4 py-4 flex gap-3 hover:bg-border/20 transition-colors">
                    <img src={comment.author.avatar} alt={comment.author.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span className="font-bold text-text-base">{comment.author.name}</span>
                        <span>@{comment.author.handle}</span>
                        <span>·</span>
                        <span>{comment.timestamp}</span>
                      </div>
                      <p className="mt-1 text-[15px] leading-6 whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>
                  </article>
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
