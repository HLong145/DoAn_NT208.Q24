import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Calendar, MapPin, Link as LinkIcon, MoreHorizontal, X, Camera, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Tweet from '../components/Tweet';
import TrendingSidebar from '../components/TrendingSidebar';
import { useAuth } from '../contexts/AuthContext';
import { toggleFollow } from '../services/followsApi';
import { getTweetsByUser, type TimelineTweet } from '../services/tweetsApi';
import { getUserProfile, updateMyProfile, uploadProfileImage, type UpdateProfilePayload, type UserProfile } from '../services/usersApi';
import { getAuthSession, saveAuthSession } from '../services/authApi';

export default function Profile() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileTweets, setProfileTweets] = useState<TimelineTweet[]>([]);
  const [activeTab, setActiveTab] = useState<'tweets' | 'replies' | 'media' | 'likes'>('tweets');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingTweets, setIsLoadingTweets] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfilePayload>({});
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      let resolvedHandle = handle ?? currentUser?.handle;

      if (!resolvedHandle) {
        setErrorMessage('Profile handle is missing.');
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        setErrorMessage('');
        const response = await getUserProfile(resolvedHandle);
        setProfile(response);
        setEditForm({
          name: response.user.name,
          bio: response.user.bio,
          location: response.user.location,
          website: response.user.website,
          avatarUrl: response.user.avatarUrl,
          headerUrl: response.user.headerUrl,
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load profile.');
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();
  }, [handle, currentUser?.handle]);

  useEffect(() => {
    const loadProfileTweets = async () => {
      if (!profile?.user.id) {
        setProfileTweets([]);
        return;
      }

      try {
        setIsLoadingTweets(true);
        const tweets = await getTweetsByUser(profile.user.id);
        setProfileTweets(tweets);
      } catch (error) {
        console.error('Could not load profile tweets:', error);
        setProfileTweets([]);
      } finally {
        setIsLoadingTweets(false);
      }
    };

    void loadProfileTweets();
  }, [profile?.user.id]);

  const isOwnProfile = Boolean(currentUser?.handle && profile?.user.handle === currentUser.handle);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, type: 'avatarUrl' | 'headerUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadProfileImage(file);
      setEditForm((previous) => ({ ...previous, [type]: url }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not upload image.');
    }
  };

  const openEditModal = () => {
    if (!profile) {
      return;
    }

    setEditForm({
      name: profile.user.name,
      bio: profile.user.bio,
      location: profile.user.location,
      website: profile.user.website,
      avatarUrl: profile.user.avatarUrl,
      headerUrl: profile.user.headerUrl,
    });
    setIsEditModalOpen(true);
  };

  const saveProfile = async () => {
    try {
      setIsSavingProfile(true);
      setErrorMessage('');
      const response = await updateMyProfile(editForm);
      setProfile(response);
      setEditForm({
        name: response.user.name,
        bio: response.user.bio,
        location: response.user.location,
        website: response.user.website,
        avatarUrl: response.user.avatarUrl,
        headerUrl: response.user.headerUrl,
      });

      // Sync updated name/avatar vào localStorage để AuthContext + toàn bộ UI reload
      const existingSession = getAuthSession();
      if (existingSession) {
        saveAuthSession({
          ...existingSession,
          user: {
            ...existingSession.user,
            name: response.user.name,
            avatarUrl: response.user.avatarUrl,
          },
        });
      }

      setIsEditModalOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || isOwnProfile || isUpdatingFollow) {
      return;
    }

    try {
      setIsUpdatingFollow(true);
      const result = await toggleFollow(profile.user.id);
      setProfile((previous) => previous ? {
        ...previous,
        user: {
          ...previous.user,
          isFollowing: result.isFollowing,
          followersCount: result.isFollowing ? previous.user.followersCount + 1 : previous.user.followersCount - 1,
        },
      } : previous);
    } catch (error) {
      console.error('Could not toggle follow state:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Could not toggle follow state.');
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const profileUser = profile?.user;
  const avatarUrl = editForm.avatarUrl || profileUser?.avatarUrl || undefined;
  const headerUrl = editForm.headerUrl || profileUser?.headerUrl || undefined;

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border px-4 py-2 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-extrabold tracking-tight truncate">
              {isLoadingProfile ? 'Loading profile...' : profileUser?.name ?? 'Profile'}
            </h1>
            <p className="text-[13px] text-text-muted">
              {profileUser ? `${profileUser.postsCount} Posts` : 'Profile information'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {isLoadingProfile || !profileUser ? (
          <div className="p-8 text-center text-text-muted">Loading profile...</div>
        ) : (
          <>
            <div className="relative">
              <div className="h-48 bg-border w-full">
                  {headerUrl ? (
                    <img src={headerUrl} alt="Header" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-border to-bg-panel flex items-center justify-center text-text-muted">No header image</div>
                  )}
                </div>
              <div className="absolute bottom-0 left-4 border-4 border-bg-base rounded-full z-10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profileUser.name} className="w-32 h-32 rounded-full object-cover bg-bg-panel" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-border/50 flex items-center justify-center font-bold text-2xl text-text-base">{profileUser.name?.charAt(0)?.toUpperCase()}</div>
                )}
              </div>
              <div className="flex justify-end p-4 gap-2 h-16">
                <div className="relative" ref={moreMenuRef}>
                  <button
                    className="border border-border p-1.5 rounded-full hover:bg-border/30 transition-colors h-10 w-10 flex items-center justify-center"
                    onClick={() => setIsMoreMenuOpen((current) => !current)}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-bg-panel rounded-xl shadow-lg border border-border overflow-hidden z-50 py-2">
                      <button className="w-full text-left px-4 py-3 hover:bg-border/30 transition-colors font-bold">
                        Share profile
                      </button>
                      {!isOwnProfile && (
                        <>
                          <button className="w-full text-left px-4 py-3 hover:bg-border/30 transition-colors font-bold">
                            Mute @{profileUser.handle}
                          </button>
                          <button className="w-full text-left px-4 py-3 hover:bg-border/30 transition-colors font-bold text-[#ff3b30]">
                            Block @{profileUser.handle}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isOwnProfile ? (
                  <button
                    onClick={openEditModal}
                    className="font-bold py-1.5 px-4 rounded-full border border-border hover:bg-border/30 transition-colors h-10"
                  >
                    Edit profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isUpdatingFollow}
                    className={`font-bold py-1.5 px-4 rounded-full transition-colors h-10 ${
                      profileUser.isFollowing
                        ? 'border border-border hover:border-[#ff3b30] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 group'
                        : 'bg-primary text-white hover:bg-primary-hover group'
                    }`}
                  >
                    {isUpdatingFollow ? 'Saving...' : (
                      <>
                        <span className="group-hover:hidden">{profileUser.isFollowing ? 'Following' : 'Follow'}</span>
                        <span className="hidden group-hover:inline">Unfollow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 mt-4 mb-4">
              <h2 className="text-2xl font-bold">{profileUser.name}</h2>
              <p className="text-text-muted mb-4">@{profileUser.handle}</p>

              <p className="mb-4 whitespace-pre-wrap">
                {profileUser.bio || 'No bio yet.'}
              </p>

              <div className="flex flex-wrap gap-y-2 gap-x-4 text-text-muted text-sm mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profileUser.location || 'No location set'}
                </div>
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  {profileUser.website ? (
                    <a href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {profileUser.website}
                    </a>
                  ) : (
                    <span>No website set</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {profileUser.joined}
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <span>
                  <span className="font-bold text-text-base">{profileUser.followingCount}</span> <span className="text-text-muted">Following</span>
                </span>
                <span>
                  <span className="font-bold text-text-base">{profileUser.followersCount}</span> <span className="text-text-muted">Followers</span>
                </span>
              </div>
            </div>

            <div className="flex border-b border-border text-[15px] font-bold">
              <button
                onClick={() => setActiveTab('tweets')}
                className={`flex-1 py-4 hover:bg-border/50 transition-colors relative ${activeTab === 'tweets' ? 'text-text-base' : 'text-text-muted'}`}
              >
                Posts
                {activeTab === 'tweets' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full"></div>}
              </button>
              <button
                onClick={() => setActiveTab('replies')}
                className={`flex-1 py-4 hover:bg-border/50 transition-colors relative ${activeTab === 'replies' ? 'text-text-base' : 'text-text-muted'}`}
              >
                Replies
                {activeTab === 'replies' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full"></div>}
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-4 hover:bg-border/50 transition-colors relative ${activeTab === 'media' ? 'text-text-base' : 'text-text-muted'}`}
              >
                Media
                {activeTab === 'media' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full"></div>}
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`flex-1 py-4 hover:bg-border/50 transition-colors relative ${activeTab === 'likes' ? 'text-text-base' : 'text-text-muted'}`}
              >
                Likes
                {activeTab === 'likes' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full"></div>}
              </button>
            </div>

            <div className="divide-y divide-border">
              {activeTab === 'tweets' ? (
                isLoadingTweets ? (
                  <div className="p-8 text-center text-text-muted">Loading posts...</div>
                ) : profileTweets.length > 0 ? (
                  profileTweets.map((tweet) => (
                    <div key={tweet.id}>
                      <Tweet
                        id={tweet.id}
                        author={tweet.author}
                        content={tweet.content}
                        timestamp={tweet.timestamp}
                        stats={tweet.stats}
                        isLiked={tweet.isLiked}
                        isReposted={tweet.isReposted}
                        media={tweet.media}
                        isBookmarked={tweet.isBookmarked}
                      />
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-text-muted">
                    <p>No posts yet.</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-text-muted">
                  <p>Nothing to see here yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <TrendingSidebar />

      {isEditModalOpen && profileUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-panel rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-bg-panel/90 backdrop-blur-md z-10 p-4 flex justify-between items-center border-b border-border">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setErrorMessage('');
                    if (profile) {
                      setEditForm({
                        name: profile.user.name,
                        bio: profile.user.bio,
                        location: profile.user.location,
                        website: profile.user.website,
                        avatarUrl: profile.user.avatarUrl,
                        headerUrl: profile.user.headerUrl,
                      });
                    }
                  }}
                  className="p-2 hover:bg-border/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Edit profile</h2>
              </div>
              <button
                onClick={() => void saveProfile()}
                disabled={isSavingProfile}
                className="bg-primary text-white px-4 py-1.5 rounded-full font-bold hover:bg-primary-hover transition-colors disabled:opacity-60"
              >
                {isSavingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
            {errorMessage && (
              <div className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="relative">
              <div className="h-48 bg-border w-full relative group">
                <img src={editForm.headerUrl || profileUser.headerUrl} alt="Header" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => headerInputRef.current?.click()}
                    className="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={headerInputRef}
                    onChange={(event) => void handleImageUpload(event, 'headerUrl')}
                  />
                </div>
              </div>
              <div className="absolute -bottom-16 left-4 border-4 border-bg-base rounded-full z-10 group">
                <img src={editForm.avatarUrl || profileUser.avatarUrl} alt="User" className="w-32 h-32 rounded-full object-cover bg-bg-panel" />
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={avatarInputRef}
                    onChange={(event) => void handleImageUpload(event, 'avatarUrl')}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 mt-16 space-y-6">
              <div className="relative border border-border rounded-md px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <label className="text-xs text-text-muted">Name</label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, name: event.target.value }))}
                  className="w-full outline-none text-[15px] bg-transparent"
                />
              </div>

              <div className="relative border border-border rounded-md px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <label className="text-xs text-text-muted">Bio</label>
                <textarea
                  value={editForm.bio ?? ''}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, bio: event.target.value }))}
                  className="w-full outline-none text-[15px] bg-transparent resize-none min-h-[80px]"
                />
              </div>

              <div className="relative border border-border rounded-md px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <label className="text-xs text-text-muted">Location</label>
                <input
                  type="text"
                  value={editForm.location ?? ''}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, location: event.target.value }))}
                  className="w-full outline-none text-[15px] bg-transparent"
                />
              </div>

              <div className="relative border border-border rounded-md px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <label className="text-xs text-text-muted">Website</label>
                <input
                  type="text"
                  value={editForm.website ?? ''}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, website: event.target.value }))}
                  className="w-full outline-none text-[15px] bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
