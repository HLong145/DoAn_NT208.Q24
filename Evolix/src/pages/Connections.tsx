import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import TrendingSidebar from '../components/TrendingSidebar';
import { useAuth } from '../contexts/AuthContext';
import { toggleFollow, getFollowingIds } from '../services/followsApi';
import { getFollowers, getFollowing, type UserSummary } from '../services/usersApi';

const FOLLOW_TABS = ['verified', 'followers', 'following'] as const;
type FollowTab = typeof FOLLOW_TABS[number];

export default function Connections() {
  const { handle } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isFollowersRoute = location.pathname.startsWith('/followers');
  const isVerifiedRoute = location.pathname.startsWith('/verified_followers');
  const isFollowingRoute = location.pathname.startsWith('/following');
  const [activeTab, setActiveTab] = useState<FollowTab>(isFollowersRoute ? 'followers' : isVerifiedRoute ? 'verified' : 'following');
  const [profileName, setProfileName] = useState<string>(handle ?? 'Profile');
  const [followersList, setFollowersList] = useState<UserSummary[]>([]);
  const [followingList, setFollowingList] = useState<UserSummary[]>([]);
  const [localFollowState, setLocalFollowState] = useState<Record<number, boolean>>({});
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [inProgress, setInProgress] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hoveringUserId, setHoveringUserId] = useState<number | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; username: string } | null>(null);

  const currentHandle = useMemo(() => handle ?? currentUser?.handle ?? '', [handle, currentUser?.handle]);
  const isOwnProfile = Boolean(currentUser?.handle && currentHandle && currentUser.handle === currentHandle);

  useEffect(() => {
    setActiveTab(isFollowersRoute ? 'followers' : isVerifiedRoute ? 'verified' : isFollowingRoute ? 'following' : 'following');
  }, [isFollowersRoute, isVerifiedRoute, isFollowingRoute]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ids = await getFollowingIds();
        if (!mounted) return;
        setFollowingIds(new Set(ids));
      } catch {
        if (!mounted) return;
        setFollowingIds(new Set());
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentHandle) return;

    let mounted = true;
    setIsLoading(true);

    void (async () => {
      try {
        const [followers, following] = await Promise.all([
          getFollowers(currentHandle),
          getFollowing(currentHandle),
        ]);

        if (!mounted) return;
        setFollowersList(followers);
        setFollowingList(following);
        setProfileName(currentHandle);
      } catch {
        if (!mounted) return;
        setFollowersList([]);
        setFollowingList([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentHandle]);

  // Initialize local follow state for each listed user whenever lists or followingIds change
  useEffect(() => {
    const map: Record<number, boolean> = {};
    for (const u of followersList) {
      map[u.id] = followingIds.has(u.id);
    }
    for (const u of followingList) {
      map[u.id] = followingIds.has(u.id);
    }
    setLocalFollowState(map);
  }, [followersList, followingList, followingIds]);

  const handleFollowToggle = async (userId: number) => {
    if (inProgress.has(userId)) return;

    setInProgress((prev) => new Set(prev).add(userId));

    // Optimistically toggle local state
    setLocalFollowState((prev) => {
      const current = prev[userId] ?? followingIds.has(userId);
      return { ...prev, [userId]: !current };
    });

    try {
      const result = await toggleFollow(userId);

      // Ensure canonical sets reflect server result
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (result.isFollowing) next.add(userId);
        else next.delete(userId);
        return next;
      });

      setLocalFollowState((prev) => ({ ...prev, [userId]: result.isFollowing }));
    } catch {
      // Revert optimistic change on failure
      setLocalFollowState((prev) => ({ ...prev, [userId]: followingIds.has(userId) }));
    } finally {
      setInProgress((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const openUnfollowConfirm = (userId: number, username?: string) => {
    setConfirmTarget({ id: userId, username: username ?? '' });
    setConfirmModalOpen(true);
  };

  const closeUnfollowConfirm = () => {
    setConfirmModalOpen(false);
    setConfirmTarget(null);
  };

  const confirmUnfollow = async () => {
    if (!confirmTarget) return;
    const userId = confirmTarget.id;
    // call the same toggle function; it handles optimistic update and API call
    await handleFollowToggle(userId);
    closeUnfollowConfirm();
  };

  const list = activeTab === 'followers'
    ? followersList
    : activeTab === 'following'
      ? followingList
      : followersList.filter((user) => user.isVerified);

  const goToTab = (tab: FollowTab) => {
    if (tab === 'verified') {
      navigate(currentHandle ? `/verified_followers/${currentHandle}` : '/verified_followers');
      return;
    }
    if (tab === 'followers') {
      navigate(currentHandle ? `/followers/${currentHandle}` : '/followers');
      return;
    }
    navigate(currentHandle ? `/following/${currentHandle}` : '/following');
  };

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/90 backdrop-blur-xl z-10 border-b border-border px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-extrabold tracking-tight truncate">
              {isFollowersRoute ? 'Followers' : isVerifiedRoute ? 'Verified followers' : 'Following'}
            </h1>
            <p className="text-[13px] text-text-muted truncate">@{profileName}</p>
          </div>
        </div>

        <div className="flex border-b border-border text-[15px] font-bold sticky top-[57px] bg-bg-base/90 backdrop-blur-xl z-10">
          <button
            onClick={() => goToTab('verified')}
            className={`flex-1 py-4 hover:bg-border/50 transition-colors relative ${activeTab === 'verified' ? 'text-text-base' : 'text-text-muted'}`}
          >
            Verified followers
            {activeTab === 'verified' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full"></div>}
          </button>
          <button
            onClick={() => goToTab('followers')}
            className={`flex-1 py-4 hover:bg-border/50 transition-colors relative ${activeTab === 'followers' ? 'text-text-base' : 'text-text-muted'}`}
          >
            Followers
            {activeTab === 'followers' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full"></div>}
          </button>
          <button
            onClick={() => goToTab('following')}
            className={`flex-1 py-4 hover:bg-border/50 transition-colors relative ${activeTab === 'following' ? 'text-text-base' : 'text-text-muted'}`}
          >
            Following
            {activeTab === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full"></div>}
          </button>
        </div>

        <div className="border-b border-border px-4 py-4">
          <h2 className="text-[31px] leading-9 font-extrabold tracking-tight">
            {isFollowersRoute ? 'Followers' : isVerifiedRoute ? 'Verified followers' : isFollowingRoute ? 'Following' : activeTab === 'verified' ? 'Verified followers' : activeTab === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {isFollowersRoute
              ? 'People who follow this profile.'
              : isVerifiedRoute
                ? 'Verified followers for this profile.'
                : isFollowingRoute
                  ? 'Accounts this profile follows.'
              : activeTab === 'verified'
                ? 'Verified followers for this profile.'
                : activeTab === 'followers'
                  ? 'All followers for this profile.'
                  : 'Accounts this profile follows.'}
          </p>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : list.length > 0 ? (
            list.map((user) => (
              <div key={user.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-border/35 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName ?? user.username} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">
                      {user.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-extrabold text-[15px] truncate">{user.displayName ?? user.username}</span>
                      {user.isVerified ? <Check className="w-4 h-4 text-primary shrink-0" /> : null}
                    </div>
                    <div className="text-sm text-text-muted truncate">@{user.username}</div>
                  </div>
                </div>

                {currentUser?.id !== user.id && (
                  <button
                    onMouseEnter={() => setHoveringUserId(user.id)}
                    onMouseLeave={() => setHoveringUserId((h) => (h === user.id ? null : h))}
                    onClick={() => {
                      const isFollowing = localFollowState[user.id] ?? followingIds.has(user.id);
                      if (isFollowing) {
                        openUnfollowConfirm(user.id, user.username);
                      } else {
                        void handleFollowToggle(user.id);
                      }
                    }}
                    disabled={inProgress.has(user.id)}
                    className={`px-5 py-1.5 rounded-full text-[15px] font-bold transition-colors disabled:opacity-50 ${((localFollowState[user.id] ?? followingIds.has(user.id))
                      ? (hoveringUserId === user.id ? 'bg-transparent border border-red-400 text-red-400' : 'bg-transparent border border-border text-text-base')
                      : 'bg-text-base text-bg-base hover:opacity-80')}`}
                  >
                    {inProgress.has(user.id)
                      ? '...'
                      : (localFollowState[user.id] ?? followingIds.has(user.id))
                        ? (hoveringUserId === user.id ? 'Unfollow' : 'Following')
                        : 'Follow'
                    }
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted">No users found.</div>
          )}
        </div>
      </main>

      {confirmModalOpen && confirmTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeUnfollowConfirm} />
          <div className="relative bg-bg-base border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold">Unfollow @{confirmTarget.username}?</h3>
            <p className="mt-2 text-sm text-text-muted">Their posts will no longer show up in your Following timeline.</p>
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={closeUnfollowConfirm}
                className="px-4 py-2 rounded-md bg-border text-text-base hover:opacity-90"
              >
                Cancel
              </button>
              <button
                onClick={async () => { await confirmUnfollow(); }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:opacity-90"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <TrendingSidebar />
    </>
  );
}
