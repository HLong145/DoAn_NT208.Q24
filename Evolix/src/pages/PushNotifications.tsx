import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PUSH_SETTINGS_STORAGE_KEY = 'display_pushNotifications';

type PushSettings = {
  mentions: boolean;
  replies: boolean;
  follows: boolean;
  messages: boolean;
};

function loadPushSettings(): PushSettings {
  if (typeof window === 'undefined') {
    return { mentions: true, replies: true, follows: false, messages: true };
  }

  const rawSettings = window.localStorage.getItem(PUSH_SETTINGS_STORAGE_KEY);
  if (!rawSettings) {
    return { mentions: true, replies: true, follows: false, messages: true };
  }

  try {
    return JSON.parse(rawSettings) as PushSettings;
  } catch {
    return { mentions: true, replies: true, follows: false, messages: true };
  }
}

export default function PushNotifications() {
  const navigate = useNavigate();
  const [mentions, setMentions] = useState(() => loadPushSettings().mentions);
  const [replies, setReplies] = useState(() => loadPushSettings().replies);
  const [follows, setFollows] = useState(() => loadPushSettings().follows);
  const [messages, setMessages] = useState(() => loadPushSettings().messages);

  const persistSettings = (nextSettings: PushSettings) => {
    window.localStorage.setItem(PUSH_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  };

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
      <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Push notifications</h1>
          <p className="text-[13px] text-text-muted">Select what to be notified about</p>
        </div>
      </div>

      <div className="max-w-[620px] border-y border-border">
        <label className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-border/50 transition-colors cursor-pointer">
          <div>
            <div className="font-bold">Mentions</div>
            <div className="text-sm text-text-muted">Notifications when people mention you.</div>
          </div>
          <input type="checkbox" checked={mentions} onChange={(e) => {
            setMentions(e.target.checked);
            persistSettings({ mentions: e.target.checked, replies, follows, messages });
          }} />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-border/50 transition-colors cursor-pointer border-t border-border">
          <div>
            <div className="font-bold">Replies</div>
            <div className="text-sm text-text-muted">Notifications for replies to your posts.</div>
          </div>
          <input type="checkbox" checked={replies} onChange={(e) => {
            setReplies(e.target.checked);
            persistSettings({ mentions, replies: e.target.checked, follows, messages });
          }} />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-border/50 transition-colors cursor-pointer border-t border-border">
          <div>
            <div className="font-bold">New followers</div>
            <div className="text-sm text-text-muted">When someone follows you.</div>
          </div>
          <input type="checkbox" checked={follows} onChange={(e) => {
            setFollows(e.target.checked);
            persistSettings({ mentions, replies, follows: e.target.checked, messages });
          }} />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-border/50 transition-colors cursor-pointer border-t border-border">
          <div>
            <div className="font-bold">Messages</div>
            <div className="text-sm text-text-muted">Message notifications.</div>
          </div>
          <input type="checkbox" checked={messages} onChange={(e) => {
            setMessages(e.target.checked);
            persistSettings({ mentions, replies, follows, messages: e.target.checked });
          }} />
        </label>
      </div>
    </main>
  );
}
