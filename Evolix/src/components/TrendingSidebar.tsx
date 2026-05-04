import { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, Users, MoreHorizontal, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getSuggestions, type UserSummary } from '../services/usersApi';
import { getTrendingTopics } from '../services/tweetsApi';

interface TrendingSidebarProps {
  hideSearch?: boolean;
}

type TrendingTopic = {
  topic: string;
  posts: string;
};

type SearchSuggestion =
  | {
      type: 'user';
      name: string;
      handle: string;
      avatar?: string;
    }
  | {
      type: 'hashtag';
      text: string;
    };

export default function TrendingSidebar({ hideSearch = false }: TrendingSidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [autocompleteUsers, setAutocompleteUsers] = useState<SearchSuggestion[]>([]);
  const [whoToFollow, setWhoToFollow] = useState<Array<UserSummary & { avatarUrl?: string; displayName?: string }>>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [topics, suggestions] = await Promise.all([getTrendingTopics(), getSuggestions()]);
        if (!mounted) return;
        setTrendingTopics(topics ?? []);
        setWhoToFollow(
          suggestions.map((u) => ({
            ...u,
            avatarUrl: (u as UserSummary & { avatarUrl?: string }).avatarUrl ?? undefined,
            displayName: (u as UserSummary & { displayName?: string }).displayName ?? u.username,
          })),
        );
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        if (!searchQuery || searchQuery.trim().length === 0) {
          setAutocompleteUsers([]);
          return;
        }
        const { searchUsers } = await import('../services/usersApi');
        const users = await searchUsers(searchQuery.trim());
        if (!mounted) return;
        setAutocompleteUsers(
          users.map((u) => ({
            type: 'user',
            name: u.username,
            handle: u.username,
            avatar: (u as UserSummary & { avatarUrl?: string }).avatarUrl ?? undefined,
          })),
        );
      } catch {
        setAutocompleteUsers([]);
      }
    })();
    return () => { mounted = false; };
  }, [searchQuery]);

  const filteredSuggestions: SearchSuggestion[] = searchQuery
    ? [...autocompleteUsers, ...trendingTopics.slice(0, 4).map((topic: TrendingTopic): SearchSuggestion => ({ type: 'hashtag', text: topic.topic }))]
    : trendingTopics.slice(0, 4).map((topic: TrendingTopic): SearchSuggestion => ({ type: 'hashtag', text: topic.topic }));

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
    setIsSearchFocused(false);
    navigate(`/explore?q=${encodeURIComponent(text)}`);
  };

  return (
    <aside className="hidden lg:block w-[350px] flex-shrink-0 px-6 py-3 h-screen sticky top-0 overflow-y-auto">
      {!hideSearch && (
        <div className="relative mb-3 sticky top-0 z-20 bg-bg-base py-1" ref={searchRef}>
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
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-white rounded-full p-0.5"
              onClick={() => setSearchQuery('')}
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
                          {suggestion.avatar ? (
                            <img src={suggestion.avatar} alt={suggestion.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{suggestion.name?.charAt(0)?.toUpperCase()}</div>
                          )}
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
      )}

      <div className="bg-bg-base border border-border rounded-2xl overflow-hidden mb-4">
        <h2 className="font-extrabold text-xl px-4 pt-3 pb-2 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          What's happening
        </h2>
        <div>
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic, index) => (
              <div 
                key={`${topic.topic}-${index}`} 
                className="cursor-pointer group flex justify-between items-start px-4 py-3 hover:bg-border transition-colors"
                onClick={() => handleSearch(topic.topic)}
              >
                <div>
                  <p className="text-sm text-text-muted">Trending</p>
                  <p className="font-bold group-hover:text-primary transition-colors">{topic.topic}</p>
                  <p className="text-sm text-text-muted">{topic.posts}</p>
                </div>
                <button className="text-text-muted hover:text-primary p-1 rounded-full hover:bg-primary/10 transition-colors" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-text-muted">No trending topics</div>
          )}
          <button className="w-full text-left px-4 py-3 text-primary hover:bg-border transition-colors text-[15px]">Show more</button>
        </div>
      </div>

      <div className="bg-bg-base border border-border rounded-2xl overflow-hidden">
        <h2 className="font-extrabold text-xl px-4 pt-3 pb-2 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5" />
          Who to follow
        </h2>
        <div>
          {whoToFollow.length > 0 ? (
            whoToFollow.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-border transition-colors">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${u.username}`}>
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.username} className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{u.username?.charAt(0)?.toUpperCase()}</div>
                    )}
                  </Link>
                  <div>
                    <Link to={`/profile/${u.username}`} className="font-bold text-sm hover:underline block">{(u as any).displayName ?? u.username}</Link>
                    <span className="text-text-muted text-sm">@{u.username}</span>
                  </div>
                </div>
                <button className="bg-text-base text-bg-base px-4 py-1.5 rounded-full text-sm font-bold transition-colors opacity-95 hover:opacity-80">
                  Follow
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-text-muted">No suggestions</div>
          )}
          <button className="w-full text-left px-4 py-3 text-primary hover:bg-border transition-colors text-[15px]">Show more</button>
        </div>
      </div>
    </aside>
  );
}
