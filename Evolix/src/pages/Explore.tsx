import { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, Users, MoreHorizontal, X, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import TrendingSidebar from '../components/TrendingSidebar';
import Tweet from '../components/Tweet';
import { searchTweets, type TimelineTweet } from '../services/tweetsApi';
import { searchUsers, type UserSummary } from '../services/usersApi';

type ExploreSuggestion =
  | {
      type: 'user';
      name: string;
      handle: string;
      avatar?: string;
    }
  | {
      type: 'hashtag' | 'query';
      text: string;
    };

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');
  
  const [activeTab, setActiveTab] = useState('top');
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [tweetResults, setTweetResults] = useState<TimelineTweet[]>([]);
  const [userResults, setUserResults] = useState<UserSummary[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [trendingTopics, setTrendingTopics] = useState<Array<{ topic: string; posts: string }>>([]);
  const [leadStory, setLeadStory] = useState<{ title: string; byline?: string; image?: string; tweetId?: number } | null>(null);

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
    }
  }, [query]);

  useEffect(() => {
    const loadResults = async () => {
      const trimmedQuery = searchQuery.trim();

      if (!trimmedQuery) {
        setTweetResults([]);
        setUserResults([]);
        return;
      }

      try {
        setIsLoadingResults(true);
        const [tweets, users] = await Promise.all([
          searchTweets(trimmedQuery),
          searchUsers(trimmedQuery),
        ]);
        setTweetResults(tweets);
        setUserResults(users);
      } catch (error) {
        console.error('Could not load explore results:', error);
        setTweetResults([]);
        setUserResults([]);
      } finally {
        setIsLoadingResults(false);
      }
    };

    void loadResults();
  }, [searchQuery]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const api = await import('../services/tweetsApi');
        const [res, lead] = await Promise.all([api.getTrendingTopics(), api.getLeadStory()]);
        if (!mounted) return;
        setTrendingTopics(res ?? []);
        setLeadStory(lead ?? null);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const mockSuggestions: ExploreSuggestion[] = trendingTopics.length > 0
    ? trendingTopics.slice(0, 4).map((topic): ExploreSuggestion => ({ type: 'hashtag', text: topic.topic }))
    : [
        { type: 'hashtag', text: '#design' },
        { type: 'hashtag', text: '#AIRevolution' },
        { type: 'query', text: 'variable fonts' },
        { type: 'query', text: 'quantum computing' },
      ];

  const userSuggestions: ExploreSuggestion[] = userResults.map((user) => ({
    type: 'user' as const,
    name: user.username,
    handle: user.username,
    avatar: user.avatarUrl ?? undefined,
  }));

  const filteredSuggestions: ExploreSuggestion[] = searchQuery 
    ? [...userSuggestions, ...mockSuggestions].filter((suggestion) => {
        if (suggestion.type === 'user') return suggestion.name.toLowerCase().includes(searchQuery.toLowerCase()) || suggestion.handle.toLowerCase().includes(searchQuery.toLowerCase());
        return suggestion.text.toLowerCase().includes(searchQuery.toLowerCase());
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

  const searchResults = query ? tweetResults : [];

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
                      {filteredSuggestions.map((suggestion: ExploreSuggestion, index: number) => (
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
            {isLoadingResults ? (
              <div className="p-8 text-center text-text-muted">Searching...</div>
            ) : searchResults.length > 0 ? (
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
                {leadStory?.image ? (
                  <img src={leadStory.image} alt="Lead story" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-border to-bg-panel flex items-center justify-center text-text-muted">No image available</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white text-xl font-bold">{leadStory?.title ?? 'The Evolution of Digital Typography'}</h3>
                  <p className="text-white/80 text-sm">{leadStory?.byline ?? 'By Design Weekly'}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Trending Now</h2>
              <div className="space-y-4">
                {trendingTopics.length > 0 ? (
                  trendingTopics.map((item, i) => (
                    <div 
                      key={`${item.topic}-${i}`} 
                      className="flex justify-between items-start cursor-pointer group"
                      onClick={() => handleSearch(item.topic)}
                    >
                      <div className="flex gap-4">
                        <div className="text-text-muted font-bold text-xl">{i + 1}</div>
                        <div>
                          <p className="text-sm text-text-muted">Trending</p>
                          <p className="font-bold group-hover:text-primary transition-colors">{item.topic}</p>
                          <p className="text-sm text-text-muted">{item.posts}</p>
                        </div>
                      </div>
                      <button className="text-text-muted hover:text-primary p-1 rounded-full hover:bg-primary/10 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-text-muted">No trending topics</div>
                )}
              </div>
            </div>
          </>
        ) : activeTab === 'people' ? (
          <div className="divide-y divide-border">
                {userResults.length > 0 ? userResults.map((user) => (
              <div key={user.id} className="px-4 py-4 flex items-center justify-between hover:bg-border/20 transition-colors">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0">
                  {(user as any).avatarUrl ? (
                    <img src={(user as any).avatarUrl} alt={user.username} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{user.username?.charAt(0)?.toUpperCase()}</div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold truncate">{user.username}</div>
                    <div className="text-sm text-text-muted truncate">{user.email}</div>
                  </div>
                </Link>
                <button className="px-4 py-1.5 rounded-full bg-text-base text-bg-base font-bold text-sm">
                  View
                </button>
              </div>
            )) : (
              <div className="p-8 text-center text-text-muted">
                <p>Search for people to see matching accounts.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-text-muted">
            <p>Media search is coming next.</p>
          </div>
        )}
      </main>

      <TrendingSidebar hideSearch={true} />
    </>
  );
}
