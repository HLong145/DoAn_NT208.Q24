import { useState, useEffect } from 'react';
import { Settings, MoreHorizontal } from 'lucide-react';
import TrendingSidebar from '../components/TrendingSidebar';
import { getSuggestions, type UserSummary } from '../services/usersApi';
import { toggleFollow, getFollowingIds } from '../services/followsApi';

export default function Follow() {
  const [activeTab, setActiveTab] = useState<'follow' | 'creators'>('follow');
  const [suggestions, setSuggestions] = useState<UserSummary[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [res, ids] = await Promise.all([getSuggestions(), getFollowingIds()]);
        if (!mounted) return;
        setSuggestions(res);
        setFollowingIds(new Set(ids));
      } catch (err) {
        setSuggestions([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleFollow = async (userId: number) => {
    if (followingInProgress.has(userId)) return;
    setFollowingInProgress((prev) => new Set(prev).add(userId));
    try {
      const result = await toggleFollow(userId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        result.isFollowing ? next.add(userId) : next.delete(userId);
        return next;
      });
    } catch {
      // ignore
    } finally {
      setFollowingInProgress((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/90 backdrop-blur-xl z-10 border-b border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-[20px] font-extrabold tracking-tight">Follow</h1>
            <button className="p-2 rounded-full hover:bg-border/50 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex text-[15px] font-bold text-text-muted">
            <button
              onClick={() => setActiveTab('follow')}
              className={`relative flex-1 py-4 hover:bg-border/50 transition-colors ${activeTab === 'follow' ? 'text-text-base' : ''}`}
            >
              Who to follow
              {activeTab === 'follow' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
            </button>
            <button
              onClick={() => setActiveTab('creators')}
              className={`relative flex-1 py-4 hover:bg-border/50 transition-colors ${activeTab === 'creators' ? 'text-text-base' : ''}`}
            >
              Creators for you
              {activeTab === 'creators' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
            </button>
          </div>
        </div>

        <div className="border-b border-border px-4 py-4">
          <h2 className="text-[31px] leading-9 font-extrabold tracking-tight">Suggested for you</h2>
        </div>

        <div>
          {suggestions.map((user) => (
            <div key={user.id} className="px-4 py-3 border-b border-border hover:bg-border/35 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div>
                    {(user as any).avatarUrl ? (
                      <img src={(user as any).avatarUrl} alt={(user as any).displayName ?? user.username} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{user.username?.charAt(0)?.toUpperCase()}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-[15px] truncate">{(user as any).displayName ?? user.username}</p>
                    <p className="text-sm text-text-muted truncate">@{user.username}</p>
                    <p className="text-[15px] mt-1 leading-5 text-text-base">{(user as any).bio ?? ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleFollow(user.id)}
                    disabled={followingInProgress.has(user.id)}
                    className={`px-5 py-1.5 rounded-full text-[15px] font-bold transition-colors disabled:opacity-50 ${followingIds.has(user.id) ? 'bg-transparent border border-border text-text-base hover:border-red-400 hover:text-red-400' : 'bg-text-base text-bg-base hover:opacity-80'}`}
                  >
                    {followingInProgress.has(user.id) ? '...' : followingIds.has(user.id) ? 'Following' : 'Follow'}
                  </button>
                  <button className="text-text-muted p-1 rounded-full hover:bg-border/50">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <TrendingSidebar />
    </>
  );
}
