import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EMAIL_SETTINGS_STORAGE_KEY = 'display_emailNotifications';

type EmailSettings = {
  weekly: boolean;
  product: boolean;
  security: boolean;
};

function loadEmailSettings(): EmailSettings {
  if (typeof window === 'undefined') {
    return { weekly: true, product: false, security: true };
  }

  const rawSettings = window.localStorage.getItem(EMAIL_SETTINGS_STORAGE_KEY);
  if (!rawSettings) {
    return { weekly: true, product: false, security: true };
  }

  try {
    return JSON.parse(rawSettings) as EmailSettings;
  } catch {
    return { weekly: true, product: false, security: true };
  }
}

export default function EmailNotifications() {
  const navigate = useNavigate();
  const [weekly, setWeekly] = useState(() => loadEmailSettings().weekly);
  const [product, setProduct] = useState(() => loadEmailSettings().product);
  const [security, setSecurity] = useState(() => loadEmailSettings().security);

  const persistSettings = (nextSettings: EmailSettings) => {
    window.localStorage.setItem(EMAIL_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  };

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
      <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Email notifications</h1>
          <p className="text-[13px] text-text-muted">Control your email inbox</p>
        </div>
      </div>

      <div className="max-w-[620px] border-y border-border">
        <label className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-border/50 transition-colors cursor-pointer">
          <div>
            <div className="font-bold">Weekly summary</div>
            <div className="text-sm text-text-muted">Get a weekly digest of activity.</div>
          </div>
          <input type="checkbox" checked={weekly} onChange={(e) => {
            setWeekly(e.target.checked);
            persistSettings({ weekly: e.target.checked, product, security });
          }} />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-border/50 transition-colors cursor-pointer border-t border-border">
          <div>
            <div className="font-bold">Product updates</div>
            <div className="text-sm text-text-muted">News about product features.</div>
          </div>
          <input type="checkbox" checked={product} onChange={(e) => {
            setProduct(e.target.checked);
            persistSettings({ weekly, product: e.target.checked, security });
          }} />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-border/50 transition-colors cursor-pointer border-t border-border">
          <div>
            <div className="font-bold">Security alerts</div>
            <div className="text-sm text-text-muted">Important security-related messages.</div>
          </div>
          <input type="checkbox" checked={security} onChange={(e) => {
            setSecurity(e.target.checked);
            persistSettings({ weekly, product, security: e.target.checked });
          }} />
        </label>
      </div>
    </main>
  );
}
