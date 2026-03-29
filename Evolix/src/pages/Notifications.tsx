import { useState } from 'react';
import { Bell, Heart, UserPlus, MessageCircle, Check, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrendingSidebar from '../components/TrendingSidebar';

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "like",
      users: [
        { name: "Sarah Jenkins", avatar: "https://i.pravatar.cc/150?img=33", handle: "sarahj" }
      ],
      content: '"The intersection of design and technology is where the magic happens. We need to focus more on the human element."',
      timestamp: "2h",
      isRead: false,
      targetId: "1" // Tweet ID
    },
    {
      id: "2",
      type: "follow",
      users: [
        { name: "Alex Morgan", avatar: "https://i.pravatar.cc/150?img=12", handle: "alexm" },
        { name: "Another User", avatar: "https://i.pravatar.cc/150?img=13", handle: "another" },
        { name: "Third User", avatar: "https://i.pravatar.cc/150?img=14", handle: "third" }
      ],
      content: "",
      timestamp: "5h",
      isRead: true,
      targetId: "alexm" // User handle
    },
    {
      id: "3",
      type: "reply",
      users: [
        { name: "Design Weekly", avatar: "https://i.pravatar.cc/150?img=44", handle: "designweekly" }
      ],
      content: "@janedoe Couldn't agree more! Have you seen the latest updates to Figma?",
      timestamp: "1d",
      isRead: false,
      targetId: "3" // Tweet ID
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    setNotifications(notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    
    // Navigate
    if (notification.type === 'follow') {
      navigate(`/profile/${notification.targetId}`);
    } else {
      navigate(`/tweet/${notification.targetId}`);
    }
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === 'mention' || n.type === 'reply');

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-[20px] font-extrabold tracking-tight">Notifications</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={markAllAsRead}
                className="p-2 hover:bg-border/50 rounded-full transition-colors text-text-muted hover:text-text-base"
                title="Mark all as read"
              >
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/settings?tab=notifications')} className="p-2 hover:bg-border/50 rounded-full transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center cursor-pointer">
            <div className="flex text-[15px] font-bold text-text-muted w-full">
              <button 
                onClick={() => setActiveTab('all')}
                className={`relative flex-1 py-4 transition-colors hover:bg-border/50 ${activeTab === 'all' ? 'text-text-base' : 'hover:text-text-base'}`}
              >
                All
                {activeTab === 'all' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
              </button>
              <button 
                onClick={() => setActiveTab('mentions')}
                className={`relative flex-1 py-4 transition-colors hover:bg-border/50 ${activeTab === 'mentions' ? 'text-text-base' : 'hover:text-text-base'}`}
              >
                Mentions
                {activeTab === 'mentions' && <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-primary"></span>}
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-border">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-border/50 transition-colors cursor-pointer flex gap-4 ${!notification.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className="flex-shrink-0 flex justify-end w-8">
                  {notification.type === 'like' && <Heart className="w-7 h-7 text-[#f91880] fill-current" />}
                  {notification.type === 'follow' && <UserPlus className="w-7 h-7 text-primary fill-current" />}
                  {(notification.type === 'mention' || notification.type === 'reply') && <MessageCircle className="w-7 h-7 text-primary fill-current" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 mb-2">
                    {notification.users.map((user, idx) => (
                      <img 
                        key={idx} 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${user.handle}`);
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="text-[15px] mb-2">
                    <span 
                      className="font-bold hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${notification.users[0].handle}`);
                      }}
                    >
                      {notification.users[0].name}
                    </span>
                    {notification.users.length > 1 && ` and ${notification.users.length - 1} others`}
                    {notification.type === 'like' && ' liked your post'}
                    {notification.type === 'follow' && ' followed you'}
                    {notification.type === 'mention' && ' mentioned you'}
                    {notification.type === 'reply' && ' replied to your post'}
                  </div>
                  
                  {notification.content && (
                    <p className="text-text-muted text-[15px]">{notification.content}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted">
              No notifications here yet.
            </div>
          )}
        </div>
      </main>

      <TrendingSidebar />
    </>
  );
}
