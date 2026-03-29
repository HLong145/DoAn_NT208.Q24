import { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, Users, MoreHorizontal, X, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import TrendingSidebar from '../components/TrendingSidebar';
import Tweet from '../components/Tweet';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');
  
  const [activeTab, setActiveTab] = useState('top');
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
    }
  }, [query]);

  const mockSuggestions = [
    { type: 'user', name: 'Jane Doe', handle: 'janedoe', avatar: 'https://i.pravatar.cc/150?img=11' },
    { type: 'user', name: 'Tech Insider', handle: 'techinsider', avatar: 'https://i.pravatar.cc/150?img=32' },
    { type: 'hashtag', text: '#design' },
    { type: 'hashtag', text: '#AIRevolution' },
    { type: 'query', text: 'variable fonts' },
    { type: 'query', text: 'quantum computing' },
  ];

  const filteredSuggestions = searchQuery 
    ? mockSuggestions.filter(s => {
        if (s.type === 'user') return s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.handle?.toLowerCase().includes(searchQuery.toLowerCase());
        if (s.type === 'hashtag') return s.text?.toLowerCase().includes(searchQuery.toLowerCase());
        return s.text?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : mockSuggestions.slice(0, 4);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setSearchParams({ q: text });
    setIsSearchFocused(false);
  };

  const mockTweets = [
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
      content: "Minimalism isn't dead, it's just evolving. Here are 5 examples of brutalist minimalism in modern web design. #design",
      timestamp: "1d",
      stats: { replies: 5, reposts: 12, likes: 89, views: 450 },
      isBookmarked: true,
      isFollowing: true
    }
  ];

  const searchResults = query 
    ? mockTweets
        .filter(t => t.content.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
          // Sort by following first, then by interactions (likes + reposts)
          if (a.isFollowing && !b.isFollowing) return -1;
          if (!a.isFollowing && b.isFollowing) return 1;
          const aInteractions = a.stats.likes + a.stats.reposts;
          const bInteractions = b.stats.likes + b.stats.reposts;
          return bInteractions - aInteractions;
        })
    : [];

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-20 border-b border-border px-4 pt-2">
          <div className="flex items-center gap-3 pb-3">
            {query && (
              <button 
                onClick={() => {
                  setSearchParams({});
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-border/50 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="relative flex-1" ref={searchRef}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isSearchFocused ? 'text-primary' : 'text-text-muted'}`} />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-border/70 rounded-full py-3 pl-12 pr-10 outline-none border border-transparent focus:bg-bg-panel focus:border-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearch(searchQuery.trim());
                  }
                }}
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white rounded-full p-0.5"
                  onClick={() => {
                    setSearchQuery('');
                    if (query) setSearchParams({});
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-panel rounded-2xl shadow-lg border border-border overflow-hidden z-30">
                  {filteredSuggestions.length > 0 ? (
                    <div className="py-2">
                      {searchQuery && (
                        <div 
                          className="px-4 py-3 hover:bg-border/30 cursor-pointer text-[15px] break-words"
                          onClick={() => handleSearch(searchQuery)}
                        >
                          Search for "{searchQuery}"
                        </div>
                      )}
                      {filteredSuggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="px-4 py-3 hover:bg-border/30 cursor-pointer flex items-center gap-3"
                          onClick={() => {
                            if (suggestion.type === 'user') {
                              navigate(`/profile/${suggestion.handle}`);
                            } else {
                              handleSearch(suggestion.text || '');
                            }
                          }}
                        >
                          {suggestion.type === 'user' ? (
                            <>
                              <img src={suggestion.avatar} alt={suggestion.name} className="w-10 h-10 rounded-full object-cover" />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-[15px] truncate">{suggestion.name}</div>
                                <div className="text-text-muted text-sm truncate">@{suggestion.handle}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center">
                                <Search className="w-5 h-5 text-text-muted" />
                              </div>
                              <div className="flex-1 min-w-0 font-bold text-[15px] truncate">
                                {suggestion.text}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-text-muted">
                      No results for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center cursor-pointer">
            <div className="flex text-[15px] font-bold text-text-muted w-full overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('top')}
                className={`relative min-w-[88px] py-4 whitespace-nowrap transition-colors hover:bg-border/50 ${activeTab === 'top' ? 'text-text-base' : 'hover:text-text-base'}`}
              >
                Top
                {activeTab === 'top' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
              </button>
              <button 
                onClick={() => setActiveTab('latest')}
                className={`relative min-w-[88px] py-4 whitespace-nowrap transition-colors hover:bg-border/50 ${activeTab === 'latest' ? 'text-text-base' : 'hover:text-text-base'}`}
              >
                Latest
                {activeTab === 'latest' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
              </button>
              <button 
                onClick={() => setActiveTab('people')}
                className={`relative min-w-[88px] py-4 whitespace-nowrap transition-colors hover:bg-border/50 ${activeTab === 'people' ? 'text-text-base' : 'hover:text-text-base'}`}
              >
                People
                {activeTab === 'people' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
              </button>
              <button 
                onClick={() => setActiveTab('media')}
                className={`relative min-w-[88px] py-4 whitespace-nowrap transition-colors hover:bg-border/50 ${activeTab === 'media' ? 'text-text-base' : 'hover:text-text-base'}`}
              >
                Media
                {activeTab === 'media' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
              </button>
            </div>
          </div>
        </div>
        
        {query ? (
          <div className="divide-y divide-border">
            {searchResults.length > 0 ? (
              searchResults.map(tweet => (
                <div key={tweet.id}>
                  <Tweet 
                    id={tweet.id}
                    author={tweet.author}
                    content={tweet.content}
                    timestamp={tweet.timestamp}
                    stats={tweet.stats}
                    isLiked={tweet.isLiked}
                    media={tweet.media}
                  />
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted">
                <p className="text-xl font-bold text-text-base mb-2">No results for "{query}"</p>
                <p>Try searching for something else.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'top' ? (
          <>
            <div className="p-4 border-b border-border">
              <h2 className="text-2xl font-serif font-bold mb-2">The Lead Story</h2>
              <div className="aspect-video bg-border rounded-xl mb-4 overflow-hidden relative">
                <img src="https://picsum.photos/seed/explore/800/400" alt="Lead story" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white text-xl font-bold">The Evolution of Digital Typography</h3>
                  <p className="text-white/80 text-sm">By Design Weekly</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Trending Now</h2>
              <div className="space-y-4">
                {[
                  { id: 1, topic: '#design', posts: '120K' },
                  { id: 2, topic: '#AIRevolution', posts: '85K' },
                  { id: 3, topic: 'Web Development', posts: '45K' },
                  { id: 4, topic: 'React 19', posts: '32K' },
                  { id: 5, topic: 'UI/UX', posts: '28K' }
                ].map((item, i) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-start cursor-pointer group"
                    onClick={() => handleSearch(item.topic)}
                  >
                    <div className="flex gap-4">
                      <div className="text-text-muted font-bold text-xl">{i + 1}</div>
                      <div>
                        <p className="text-sm text-text-muted">Trending</p>
                        <p className="font-bold group-hover:text-primary transition-colors">{item.topic}</p>
                        <p className="text-sm text-text-muted">{item.posts} posts</p>
                      </div>
                    </div>
                    <button className="text-text-muted hover:text-primary p-1 rounded-full hover:bg-primary/10 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-text-muted">
            <p>Content for {activeTab} will appear here.</p>
          </div>
        )}
      </main>

      <TrendingSidebar hideSearch={true} />
    </>
  );
}
