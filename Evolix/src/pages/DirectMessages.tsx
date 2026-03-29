import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DirectMessages() {
  const navigate = useNavigate();
  const [setting, setSetting] = useState('everyone');

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
      <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Direct Messages</h1>
          <p className="text-[13px] text-text-muted">Control who can message you</p>
        </div>
      </div>

      <div className="max-w-[620px]">
        <p className="px-4 py-3 text-sm text-text-muted">Choose who can send you direct messages.</p>

        <div className="border-y border-border">
          {[
            { id: 'everyone', label: 'Everyone', desc: 'Allow all users to message you.' },
            { id: 'following', label: 'People you follow', desc: 'Only people you follow can message you.' },
            { id: 'noone', label: 'No one', desc: 'Disable incoming direct messages.' },
          ].map((opt) => (
            <label key={opt.id} className="flex items-start justify-between gap-4 px-4 py-4 hover:bg-border/50 transition-colors cursor-pointer">
              <div>
                <p className="font-bold text-[15px]">{opt.label}</p>
                <p className="text-sm text-text-muted mt-0.5">{opt.desc}</p>
              </div>
              <input type="radio" name="dm-setting" checked={setting === opt.id} onChange={() => setSetting(opt.id)} className="mt-1" />
            </label>
          ))}
        </div>
      </div>
    </main>
  );
}
