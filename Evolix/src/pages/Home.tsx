import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Smile, ListTodo, Calendar, MapPin, X } from 'lucide-react';
import Tweet from '../components/Tweet';
import TrendingSidebar from '../components/TrendingSidebar';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [tweetText, setTweetText] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const emojiPickerRef = useRef<HTMLDivElement>(null);
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

  const [tweets, setTweets] = useState([
    {
      id: "1",
      author: {
        name: "Jane Doe",
        handle: "janedoe",
        avatar: "https://i.pravatar.cc/150?img=11"
      },
      content: "Just published a new article on the intersection of design and technology. It's fascinating how much typography influences our perception of digital products. #design #tech",
      timestamp: "2h",
      stats: { replies: 12, reposts: 45, likes: 320, views: 1200 },
      isLiked: true,
      media: ["https://picsum.photos/seed/design/800/400"],
      isFollowing: false
    },
    {
      id: "2",
      author: {
        name: "Tech Insider",
        handle: "techinsider",
        avatar: "https://i.pravatar.cc/150?img=32"
      },
      content: "Breaking: The new AI model just dropped and it's changing everything we know about automated content generation. What are your thoughts on this? @janedoe #AIRevolution",
      timestamp: "5h",
      stats: { replies: 89, reposts: 210, likes: 1500, views: 8500 },
      isReposted: true,
      isFollowing: true
    },
    {
      id: "3",
      author: {
        name: "Design Weekly",
        handle: "designweekly",
        avatar: "https://i.pravatar.cc/150?img=44"
      },
      content: "Minimalism isn't dead, it's just evolving. Here are 5 examples of brutalist minimalism in modern web design.",
      timestamp: "1d",
      stats: { replies: 5, reposts: 12, likes: 89, views: 450 },
      isBookmarked: true,
      isFollowing: true
    }
  ]);

  const handlePost = () => {
    if (tweetText.trim() === '' && !showPoll) return;

    let finalContent = tweetText;
    if (location) {
      finalContent += `\n\n📍 ${location}`;
    }

    const newTweet = {
      id: Date.now().toString(),
      author: {
        name: "Jane Doe",
        handle: "janedoe",
        avatar: "https://i.pravatar.cc/150?img=11"
      },
      content: finalContent,
      timestamp: "Just now",
      stats: { replies: 0, reposts: 0, likes: 0, views: 0 },
      isFollowing: false
    };

    setTweets([newTweet, ...tweets]);
    setTweetText('');
    setShowPoll(false);
    setLocation(null);
  };

  const handleEmojiClick = (emoji: string) => {
    setTweetText(prev => prev + emoji);
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
        (position) => {
          // In a real app, we would reverse geocode the lat/lng.
          // For this demo, we'll mock the city based on successful location access.
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

  const baseTweets = activeTab === 'forYou' ? tweets : tweets.filter(t => t.isFollowing || t.author.handle === 'janedoe');
  const displayedTweets = baseTweets;

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
        
        {/* Compose Box */}
        <div className="px-4 py-3 border-b border-border flex gap-3">
          <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1 relative">
            <textarea 
              placeholder="What's happening?" 
              className="w-full bg-transparent resize-none outline-none text-[20px] leading-7 placeholder:text-text-muted min-h-[52px] overflow-hidden"
              value={tweetText}
              onChange={(e) => {
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

            <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
              <div className="flex gap-1 text-primary">
                <button className="p-2 rounded-full hover:bg-primary/10 transition-colors" title="Media">
                  <ImageIcon className="w-5 h-5" />
                </button>
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
                  className={`bg-primary text-white px-5 py-2 rounded-full font-bold text-[15px] transition-colors ${tweetText.length === 0 && !showPoll && !location ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
                  disabled={tweetText.length === 0 && !showPoll && !location}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="divide-y divide-border">
          {displayedTweets.map(tweet => (
            <Tweet key={tweet.id} {...tweet} />
          ))}
        </div>
      </main>

      <TrendingSidebar />
    </>
  );
}

