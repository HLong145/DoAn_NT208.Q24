import { useState } from 'react';
import { Bell, Heart, UserPlus, MessageCircle, Mail, Check, Settings, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrendingSidebar from '../components/TrendingSidebar';
import { type NotificationItem } from '../services/notificationsApi';
import { useNotifications } from '../contexts/NotificationsContext';

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const {
    notifications,
    isLoading,
    errorMessage,
    refreshNotifications,
    markAllAsRead,
    acknowledgeNotification,
  } = useNotifications();

  const handleNotificationClick = (notification: NotificationItem) => {
    acknowledgeNotification(notification.id);

    if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor.handle}`);
      return;
    }

    if (notification.type === 'message') {
      navigate('/messages');
      return;
    }

    if (notification.targetId) {
      navigate(`/tweet/${notification.targetId}`);
    }
  };

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter((notification) => notification.type === 'reply');

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-[20px] font-extrabold tracking-tight">Notifications</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void refreshNotifications()}
                className="p-2 hover:bg-border/50 rounded-full transition-colors text-text-muted hover:text-text-base"
                title="Refresh"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
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
        
                {errorMessage && (
                  <div className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}

        <div className="divide-y divide-border">
                  {isLoading ? (
                    <div className="p-8 text-center text-text-muted">Loading notifications...</div>
                  ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-border/50 transition-colors cursor-pointer flex gap-4 ${notification.isRead ? '' : 'bg-primary/5'}`}
              >
                <div className="flex-shrink-0 flex justify-end w-8">
                          {notification.type === 'like' && <Heart className="w-7 h-7 text-[#f91880] fill-current" />}
                          {notification.type === 'follow' && <UserPlus className="w-7 h-7 text-primary fill-current" />}
                          {notification.type === 'reply' && <MessageCircle className="w-7 h-7 text-primary fill-current" />}
                          {notification.type === 'message' && <Mail className="w-7 h-7 text-primary fill-current" />}
                          {notification.type === 'tweet' && <Bell className="w-7 h-7 text-primary fill-current" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] mb-2">
                            <span
                      className="font-bold hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                                navigate(`/profile/${notification.actor.handle}`);
                      }}
                    >
                              {notification.actor.name}
                    </span>
                            {notification.type === 'like' && ' liked your post'}
                            {notification.type === 'follow' && ' followed you'}
                            {notification.type === 'reply' && ' replied to your post'}
                            {notification.type === 'message' && ' sent you a message'}
                            {notification.type === 'tweet' && ' posted a new tweet'}
                  </div>
                  
                  {notification.content && (
                    <p className="text-text-muted text-[15px]">{notification.content}</p>
                  )}
                          <div className="text-xs text-text-muted mt-2">{notification.timestamp}</div>
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
