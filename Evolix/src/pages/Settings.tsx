import { useEffect, useState } from 'react';
import { ArrowLeft, Key, Shield, Bell, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab === 'privacy' || tab === 'notifications' ? tab : 'account';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'account' || tab === 'privacy' || tab === 'notifications') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative flex">
      {/* Settings Sidebar */}
      <div className="w-full sm:w-[350px] border-r border-border h-screen sticky top-0 flex flex-col">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors sm:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-extrabold tracking-tight">Settings</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center justify-between p-4 hover:bg-border/50 transition-colors ${activeTab === 'account' ? 'bg-border/50 border-r-4 border-primary' : ''}`}
          >
            <div className="flex items-center gap-4">
              <Key className="w-5 h-5 text-text-muted" />
              <span className="font-bold">Your Account</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </button>
          
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center justify-between p-4 hover:bg-border/50 transition-colors ${activeTab === 'privacy' ? 'bg-border/50 border-r-4 border-primary' : ''}`}
          >
            <div className="flex items-center gap-4">
              <Shield className="w-5 h-5 text-text-muted" />
              <span className="font-bold">Privacy and safety</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </button>
          
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between p-4 hover:bg-border/50 transition-colors ${activeTab === 'notifications' ? 'bg-border/50 border-r-4 border-primary' : ''}`}
          >
            <div className="flex items-center gap-4">
              <Bell className="w-5 h-5 text-text-muted" />
              <span className="font-bold">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="hidden sm:block flex-1 h-screen sticky top-0 overflow-y-auto">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-4">
          <h2 className="text-[20px] font-extrabold tracking-tight">
            {activeTab === 'account' && 'Your Account'}
            {activeTab === 'privacy' && 'Privacy and safety'}
            {activeTab === 'notifications' && 'Notifications'}
          </h2>
        </div>

        <div className="p-4">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <p className="text-text-muted text-sm">See information about your account, download an archive of your data, or learn about your account deactivation options.</p>
              
              <div className="space-y-4">
                <div onClick={() => navigate('/settings/account-info')} className="cursor-pointer hover:bg-border/50 p-4 rounded-xl transition-colors flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold mb-1">Account information</h3>
                    <p className="text-sm text-text-muted">See your account information like your phone number and email address.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
                <div onClick={() => navigate('/settings/change-password')} className="cursor-pointer hover:bg-border/50 p-4 rounded-xl transition-colors flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold mb-1">Change your password</h3>
                    <p className="text-sm text-text-muted">Change your password at any time.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
                <div onClick={() => navigate('/settings/deactivate-account')} className="cursor-pointer hover:bg-border/50 p-4 rounded-xl transition-colors flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold mb-1">Deactivate your account</h3>
                    <p className="text-sm text-text-muted">Find out how you can deactivate your account.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <p className="text-text-muted text-sm">Manage what information you see and share on Evolix.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 hover:bg-border/50 rounded-xl transition-colors cursor-pointer">
                  <div>
                    <h3 className="font-bold mb-1">Protect your posts</h3>
                    <p className="text-sm text-text-muted">Only current followers and people you approve in the future will be able to see your posts.</p>
                  </div>
                  <div className="w-10 h-6 bg-border rounded-full relative">
                    <div className="w-5 h-5 bg-bg-panel rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                  </div>
                </div>
                <div onClick={() => navigate('/settings/direct-messages')} className="flex items-center justify-between p-4 hover:bg-border/50 rounded-xl transition-colors cursor-pointer">
                  <div>
                    <h3 className="font-bold mb-1">Direct Messages</h3>
                    <p className="text-sm text-text-muted">Manage who can message you directly.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <p className="text-text-muted text-sm">Select the kinds of notifications you get about your activities, interests, and recommendations.</p>
              
              <div className="space-y-4">
                <div onClick={() => navigate('/settings/notifications/push')} className="flex items-center justify-between p-4 hover:bg-border/50 rounded-xl transition-colors cursor-pointer">
                  <div>
                    <h3 className="font-bold mb-1">Push notifications</h3>
                    <p className="text-sm text-text-muted">Turn on push notifications to find out what's happening when you're not on Evolix.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
                <div onClick={() => navigate('/settings/notifications/email')} className="flex items-center justify-between p-4 hover:bg-border/50 rounded-xl transition-colors cursor-pointer">
                  <div>
                    <h3 className="font-bold mb-1">Email notifications</h3>
                    <p className="text-sm text-text-muted">Control when and how often Evolix sends emails to you.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
