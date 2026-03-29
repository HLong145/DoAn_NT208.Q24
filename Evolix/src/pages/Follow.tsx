import { useState } from 'react';
import { Settings, MoreHorizontal } from 'lucide-react';
import TrendingSidebar from '../components/TrendingSidebar';

export default function Follow() {
  const [activeTab, setActiveTab] = useState<'follow' | 'creators'>('follow');

  const suggestions = [
    {
      name: 'Josh Hawley',
      handle: '@HawleyMO',
      avatar: 'https://i.pravatar.cc/150?img=52',
      bio: 'Follower of Jesus, constitutional lawyer, husband to Erin, Dad to Elijah, Blaise and Abigail, U.S. Senator for Missouri'
    },
    {
      name: 'Byron Donalds',
      handle: '@ByronDonalds',
      avatar: 'https://i.pravatar.cc/150?img=59',
      bio: 'Trump-Endorsed Republican for Governor of Florida, Congressman, Husband, Father, and follower of Christ Proudly Serving SWFL.'
    },
    {
      name: 'Matt Gaetz',
      handle: '@mattgaetz',
      avatar: 'https://i.pravatar.cc/150?img=60',
      bio: 'Florida Man'
    },
    {
      name: 'Stephen Miller',
      handle: '@StephenM',
      avatar: 'https://i.pravatar.cc/150?img=61',
      bio: 'Deputy Chief of Staff for Policy and Homeland Security'
    }
  ];

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
            <div key={user.handle} className="px-4 py-3 border-b border-border hover:bg-border/35 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="font-extrabold text-[15px] truncate">{user.name}</p>
                    <p className="text-sm text-text-muted truncate">{user.handle}</p>
                    <p className="text-[15px] mt-1 leading-5 text-text-base">{user.bio}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-text-base text-bg-base px-5 py-1.5 rounded-full text-[15px] font-bold hover:opacity-80 transition-opacity">
                    Follow
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
