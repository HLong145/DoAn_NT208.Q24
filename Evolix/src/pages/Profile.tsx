import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, Link as LinkIcon, MoreHorizontal, X, Camera, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Tweet from '../components/Tweet';
import TrendingSidebar from '../components/TrendingSidebar';

export default function Profile() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('tweets');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
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

  // Mock data for different users
  const [mockUsers, setMockUsers] = useState<Record<string, any>>({
    'janedoe': {
      name: 'Jane Doe',
      handle: 'janedoe',
      avatar: 'https://i.pravatar.cc/150?img=11',
      header: 'https://picsum.photos/seed/header/800/200',
      bio: 'Digital architect and content curator. Exploring the intersection of design, technology, and human experience.',
      location: 'San Francisco, CA',
      website: 'janedoe.com',
      joined: 'March 2021',
      following: '1,204',
      followers: '8,492',
      posts: '1,402'
    },
    'techinsider': {
      name: 'Tech Insider',
      handle: 'techinsider',
      avatar: 'https://i.pravatar.cc/150?img=32',
      header: 'https://picsum.photos/seed/tech/800/200',
      bio: 'Bringing you the latest in technology, AI, and software development.',
      location: 'New York, NY',
      website: 'techinsider.io',
      joined: 'January 2018',
      following: '450',
      followers: '125K',
      posts: '8,230'
    },
    'designweekly': {
      name: 'Design Weekly',
      handle: 'designweekly',
      avatar: 'https://i.pravatar.cc/150?img=44',
      header: 'https://picsum.photos/seed/designweekly/800/200',
      bio: 'Weekly inspiration for UI/UX designers and frontend developers.',
      location: 'London, UK',
      website: 'designweekly.co',
      joined: 'August 2019',
      following: '210',
      followers: '45K',
      posts: '3,100'
    }
  });

  const user = mockUsers[handle || 'janedoe'] || mockUsers['janedoe'];
  const isOwnProfile = handle === 'janedoe' || !handle;

  const [editForm, setEditForm] = useState({
    name: user.name,
    bio: user.bio,
    location: user.location,
    website: user.website,
    avatar: user.avatar,
    header: user.header
  });

  // Reset form when user changes
  useEffect(() => {
    setEditForm({
      name: user.name,
      bio: user.bio,
      location: user.location,
      website: user.website,
      avatar: user.avatar,
      header: user.header
    });
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'header') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({
          ...prev,
          [type]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    setMockUsers(prev => ({
      ...prev,
      'janedoe': {
        ...prev['janedoe'],
        ...editForm
      }
    }));
    setIsEditModalOpen(false);
  };

  const mockTweets = [
    {
      id: "1",
      author: {
        name: user.name,
        handle: user.handle,
        avatar: user.avatar
      },
      content: "Just published a new article on the intersection of design and technology. It's fascinating how much typography influences our perception of digital products. #design #tech",
      timestamp: "2h",
      stats: { replies: 12, reposts: 45, likes: 320, views: 1200 },
      isLiked: true,
      media: ["https://picsum.photos/seed/design/800/400"]
    },
    {
      id: "4",
      author: {
        name: user.name,
        handle: user.handle,
        avatar: user.avatar
      },
      content: "Thinking about the role of AI in creative processes. Are we augmenting our creativity or outsourcing it? 🤔",
      timestamp: "Oct 24",
      stats: { replies: 56, reposts: 112, likes: 890, views: 12000 }
    }
  ];

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border px-4 py-2 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] font-extrabold tracking-tight truncate">{user.name}</h1>
            <p className="text-[13px] text-text-muted">{user.posts} Posts</p>
          </div>
        </div>
        
        <div className="relative">
          <div className="h-48 bg-border w-full">
            <img src={user.header} alt="Header" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-0 left-4 border-4 border-bg-base rounded-full z-10">
            <img src={user.avatar} alt="User" className="w-32 h-32 rounded-full object-cover bg-bg-panel" />
          </div>
          <div className="flex justify-end p-4 gap-2 h-16">
            <div className="relative" ref={moreMenuRef}>
              <button 
                className="border border-border p-1.5 rounded-full hover:bg-border/30 transition-colors h-10 w-10 flex items-center justify-center"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
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
                        Mute @{user.handle}
                      </button>
                      <button className="w-full text-left px-4 py-3 hover:bg-border/30 transition-colors font-bold text-[#ff3b30]">
                        Block @{user.handle}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="font-bold py-1.5 px-4 rounded-full border border-border hover:bg-border/30 transition-colors h-10"
              >
                Edit profile
              </button>
            ) : (
              <button 
                onClick={() => setIsFollowing(!isFollowing)}
                className={`font-bold py-1.5 px-4 rounded-full transition-colors h-10 ${
                  isFollowing 
                    ? 'border border-border hover:border-[#ff3b30] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 group' 
                    : 'bg-primary text-white hover:bg-primary-hover group'
                }`}
              >
                <span className="group-hover:hidden">{isFollowing ? 'Following' : 'Follow'}</span>
                <span className="hidden group-hover:inline">Unfollow</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-4 mt-4 mb-4">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-text-muted mb-4">@{user.handle}</p>
          
          <p className="mb-4">{user.bio}</p>
          
          <div className="flex flex-wrap gap-y-2 gap-x-4 text-text-muted text-sm mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {user.location}
            </div>
            <div className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" />
              <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.website}</a>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {user.joined}
            </div>
          </div>
          
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:underline">
              <span className="font-bold text-text-base">{user.following}</span> <span className="text-text-muted">Following</span>
            </a>
            <a href="#" className="hover:underline">
              <span className="font-bold text-text-base">{user.followers}</span> <span className="text-text-muted">Followers</span>
            </a>
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
            mockTweets.map(tweet => (
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
              <p>Nothing to see here yet.</p>
            </div>
          )}
        </div>
      </main>

      <TrendingSidebar />

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-panel rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-bg-panel/90 backdrop-blur-md z-10 p-4 flex justify-between items-center border-b border-border">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-border/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Edit profile</h2>
              </div>
              <button 
                onClick={saveProfile}
                className="bg-primary text-white px-4 py-1.5 rounded-full font-bold hover:bg-primary-hover transition-colors"
              >
                Save
              </button>
            </div>

            <div className="relative">
              <div className="h-48 bg-border w-full relative group">
                <img src={editForm.header} alt="Header" className="w-full h-full object-cover" />
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
                    capture="user"
                    className="hidden" 
                    ref={headerInputRef}
                    onChange={(e) => handleImageUpload(e, 'header')}
                  />
                </div>
              </div>
              <div className="absolute -bottom-16 left-4 border-4 border-bg-base rounded-full z-10 group">
                <img src={editForm.avatar} alt="User" className="w-32 h-32 rounded-full object-cover bg-bg-panel" />
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
                    capture="user"
                    className="hidden" 
                    ref={avatarInputRef}
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 mt-16 space-y-6">
              <div className="relative border border-border rounded-md px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <label className="text-xs text-text-muted">Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full outline-none text-[15px] bg-transparent"
                />
              </div>

              <div className="relative border border-border rounded-md px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <label className="text-xs text-text-muted">Bio</label>
                <textarea 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full outline-none text-[15px] bg-transparent resize-none min-h-[80px]"
                />
              </div>

              <div className="relative border border-border rounded-md px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <label className="text-xs text-text-muted">Location</label>
                <input 
                  type="text" 
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full outline-none text-[15px] bg-transparent"
                />
              </div>

              <div className="relative border border-border rounded-md px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <label className="text-xs text-text-muted">Website</label>
                <input 
                  type="text" 
                  value={editForm.website}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
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
