import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Image as ImageIcon, Smile, ListTodo, Calendar, MapPin, X } from 'lucide-react';
import Tweet from '../components/Tweet';
import TrendingSidebar from '../components/TrendingSidebar';
import { createTweet, getFeed, type TimelineTweet } from '../services/tweetsApi';
import { createRealtimeSocket } from '../services/realtimeClient';
import { getCurrentUser, type AuthUser } from '../services/authApi';
import { getUserProfile } from '../services/usersApi';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [tweetText, setTweetText] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [tweets, setTweets] = useState<TimelineTweet[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTabRef = useRef(activeTab);
  const maxChars = 280;
  const charsLeft = maxChars - tweetText.length;

  const popularEmojis = ['😂', '😭', '🥺', '✨', '❤️', '🔥', '👍', '👏', '🙏', '🤔', '💀', '💯', '🥰', '😊', '👀'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const refreshTimeline = async (scope: 'forYou' | 'following' = activeTabRef.current) => {
    try {
      setErrorMessage('');
      setIsLoading(true);
      const feed = await getFeed(scope);
      setTweets(feed);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load timeline.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshTimeline(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const session = await getCurrentUser();
        setCurrentUser(session.user);
        try {
          const profile = await getUserProfile(session.user.handle);
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

  useEffect(() => {
    const socket = createRealtimeSocket();

    if (!socket) {
      return;
    }

    const handleRealtimeUpdate = () => {
      void refreshTimeline(activeTabRef.current);
    };

    socket.on('new_tweet', handleRealtimeUpdate);
    socket.on('user.followed', handleRealtimeUpdate);
    socket.on('connected', () => {
      // Connection acknowledged by backend gateway.
    });

    return () => {
      socket.off('new_tweet', handleRealtimeUpdate);
      socket.off('user.followed', handleRealtimeUpdate);
      socket.disconnect();
    };
  }, []);

  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).slice(0, 4);
    setMediaFiles(selected);
    setMediaPreviews(selected.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removeMedia = (idx: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
    setMediaPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handlePost = async () => {
    if (tweetText.trim() === '' && !showPoll && mediaFiles.length === 0) return;

    let finalContent = tweetText;
    if (location) {
      finalContent += `\n\n📍 ${location}`;
    }

    try {
      setIsPosting(true);
      setErrorMessage('');
      await createTweet(finalContent, mediaFiles.length > 0 ? mediaFiles : undefined);
      setTweetText('');
      setShowPoll(false);
      setLocation(null);
      mediaPreviews.forEach((url) => URL.revokeObjectURL(url));
      setMediaFiles([]);
      setMediaPreviews([]);
      await refreshTimeline();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not publish tweet.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setTweetText((prev: string) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleLocationClick = () => {
    if (location) {
      setLocation(null);
      return;
    }
    
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (_position) => {
          setLocation("San Francisco, CA");
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please check your permissions.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const displayedTweets = tweets;

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border">
          <div className="px-4 pt-3 pb-2 flex items-center gap-3">
            <h1 className="text-[20px] font-extrabold tracking-tight">Home</h1>
          </div>
          <div className="flex items-center text-[15px] font-bold text-text-muted">
            <button
              onClick={() => setActiveTab('forYou')}
              className={`relative flex-1 py-4 hover:bg-border/50 transition-colors ${activeTab === 'forYou' ? 'text-text-base' : 'hover:text-text-base'}`}
            >
              For you
              {activeTab === 'forYou' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`relative flex-1 py-4 hover:bg-border/50 transition-colors ${activeTab === 'following' ? 'text-text-base' : 'hover:text-text-base'}`}
            >
              Following
              {activeTab === 'following' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        
        {/* Compose Box */}
        <div className="px-4 py-3 border-b border-border flex gap-3">
          {currentUserAvatar ? (
            <img src={currentUserAvatar} alt={currentUser?.name ?? 'User'} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}</div>
          )}
          <div className="flex-1 relative">
            <textarea 
              placeholder="What's happening?" 
              className="w-full bg-transparent resize-none outline-none text-[20px] leading-7 placeholder:text-text-muted min-h-[52px] overflow-hidden"
              value={tweetText}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                setTweetText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              maxLength={maxChars}
            />
            
            {location && (
              <div className="flex items-center gap-1 text-primary text-sm font-bold mb-3">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
                <button onClick={() => setLocation(null)} className="hover:bg-primary/10 rounded-full p-0.5 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {showPoll && (
              <div className="border border-border rounded-2xl p-4 mb-4">
                <div className="space-y-3">
                  <input type="text" placeholder="Choice 1" className="w-full border border-border rounded-md p-2 outline-none focus:border-primary" />
                  <input type="text" placeholder="Choice 2" className="w-full border border-border rounded-md p-2 outline-none focus:border-primary" />
                  <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors w-full text-left">
                    + Add choice
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-sm text-text-muted">Poll length: 1 day</span>
                  <button onClick={() => setShowPoll(false)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors text-sm">
                    Remove poll
                  </button>
                </div>
              </div>
            )}

            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute top-full left-0 mt-2 bg-bg-panel border border-border rounded-2xl shadow-lg p-3 w-64 z-20"
              >
                <div className="text-sm font-bold text-text-muted mb-2 px-1">Popular Emojis</div>
                <div className="grid grid-cols-5 gap-2">
                  {popularEmojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-2xl hover:bg-border/50 rounded-lg p-1 transition-colors flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mediaPreviews.length > 0 && (
              <div className={`grid gap-2 mb-3 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {mediaPreviews.map((src, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden aspect-video bg-border/30">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
              <div className="flex gap-1 text-primary">
                <button
                  className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                  title="Media"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaFiles.length >= 4}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaChange}
                />
                <button 
                  className={`p-2 rounded-full hover:bg-primary/10 transition-colors ${showPoll ? 'bg-primary/10' : ''}`}
                  onClick={() => setShowPoll(!showPoll)}
                  title="Poll"
                >
                  <ListTodo className="w-5 h-5" />
                </button>
                <button 
                  className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/10' : 'hover:bg-primary/10'}`}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-primary/10 transition-colors hidden sm:block" title="Schedule">
                  <Calendar className="w-5 h-5" />
                </button>
                <button 
                  className={`p-2 rounded-full transition-colors hidden sm:block ${location ? 'bg-primary/10' : 'hover:bg-primary/10'} ${isLocating ? 'animate-pulse' : ''}`}
                  onClick={handleLocationClick}
                  title="Location"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                {(tweetText.length > 0 || showPoll || location) && (
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${charsLeft <= 20 ? 'text-[#ff3b30]' : 'text-text-muted'}`}>
                      {charsLeft}
                    </span>
                    <div className="w-[1px] h-6 bg-border"></div>
                    <button className="text-primary font-bold text-sm hover:underline">Drafts</button>
                  </div>
                )}
                <button
                  onClick={handlePost}
                  className={`bg-primary text-white px-5 py-2 rounded-full font-bold text-[15px] transition-colors ${tweetText.length === 0 && !showPoll && !location && mediaFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover'} ${isPosting ? 'opacity-70 cursor-wait' : ''}`}
                  disabled={(tweetText.length === 0 && !showPoll && !location && mediaFiles.length === 0) || isPosting}
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="px-4 py-8 text-text-muted">Loading timeline...</div>
          ) : displayedTweets.length === 0 ? (
            <div className="px-4 py-8 text-text-muted">No tweets yet.</div>
          ) : (
            displayedTweets.map((tweet) => (
              <Tweet key={tweet.id} {...tweet} />
            ))
          )}
        </div>
      </main>

      <TrendingSidebar />
    </>
  );
}

