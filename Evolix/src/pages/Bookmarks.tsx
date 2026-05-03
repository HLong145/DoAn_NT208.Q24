import { useEffect, useState } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import Tweet from '../components/Tweet';
import TrendingSidebar from '../components/TrendingSidebar';
import { getCurrentUser, type AuthUser } from '../services/authApi';
import { getBookmarkedTweets } from '../services/bookmarksApi';
import type { TimelineTweet } from '../services/tweetsApi';

export default function Bookmarks() {
  const [bookmarkedTweets, setBookmarkedTweets] = useState<TimelineTweet[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setErrorMessage('');
        setIsLoading(true);
        const [currentUserResponse, tweets] = await Promise.all([
          getCurrentUser(),
          getBookmarkedTweets(),
        ]);

        setCurrentUser(currentUserResponse.user);
        setBookmarkedTweets(tweets);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load bookmarks.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadBookmarks();
  }, []);

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-4">
          <h1 className="text-[20px] font-extrabold tracking-tight">Bookmarks</h1>
          <p className="text-[13px] text-text-muted">@{currentUser?.handle ?? 'your-account'}</p>
        </div>

        {errorMessage && (
          <div className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="px-4 py-8 text-text-muted">Loading bookmarks...</div>
        ) : bookmarkedTweets.length === 0 ? (
          <div className="px-8 py-14 max-w-[420px]">
            <BookmarkIcon className="w-16 h-16 text-border mb-4" />
            <h2 className="text-[31px] leading-9 font-extrabold tracking-tight mb-2">Save posts for later</h2>
            <p className="text-text-muted text-[15px]">Bookmark posts to easily find them again in the future.</p>
          </div>
        ) : (
          <div>
            <div className="px-4 py-3 border-b border-border text-sm text-text-muted">
              {bookmarkedTweets.length} saved post{bookmarkedTweets.length === 1 ? '' : 's'}
            </div>
            {bookmarkedTweets.map((tweet) => (
              <Tweet
                key={tweet.id}
                {...tweet}
                onBookmarkChange={(tweetId, bookmarked) => {
                  if (!bookmarked) {
                    setBookmarkedTweets((previousTweets) => previousTweets.filter((savedTweet) => savedTweet.id !== tweetId));
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      <TrendingSidebar />
    </>
  );
}
