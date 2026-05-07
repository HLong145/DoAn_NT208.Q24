import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { changeHandle, getAuthSession, saveAuthSession } from '../services/authApi';

export default function ChangeUsername() {
  const navigate = useNavigate();
  const [newHandle, setNewHandle] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentHandle = getAuthSession()?.user.handle ?? '';

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!newHandle.trim()) {
      setError('Please enter a new username.');
      return;
    }
    if (newHandle === currentHandle) {
      setError('New username is the same as your current username.');
      return;
    }
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(newHandle)) {
      setError('Username can only contain letters, numbers, and underscores (max 15 characters).');
      return;
    }
    if (!currentPassword) {
      setError('Please enter your current password to confirm.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newSession = await changeHandle(newHandle, currentPassword);
      saveAuthSession(newSession);
      setSuccess(true);
      setNewHandle('');
      setCurrentPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update username.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
      <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Change username</h1>
          <p className="text-[13px] text-text-muted">Update your @handle</p>
        </div>
      </div>

      <div className="max-w-[620px] p-4 sm:p-6">
        {error && <div className="mb-4 text-sm text-red-500">{error}</div>}
        {success && <div className="mb-4 text-sm text-primary">Username updated successfully.</div>}

        <p className="text-sm text-text-muted mb-4">
          Current username: <span className="text-text-base font-medium">@{currentHandle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-bg-panel">
              <label className="text-sm text-text-muted block mb-1">New username</label>
              <input
                type="text"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                maxLength={15}
                className="w-full bg-transparent outline-none text-[15px]"
                placeholder="Letters, numbers, underscores only"
              />
            </div>
            <div className="px-4 py-3 bg-bg-panel">
              <label className="text-sm text-text-muted block mb-1">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-[15px]"
                placeholder="Confirm with your password"
              />
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Your username appears in your profile URL and @mentions. It must be unique.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary-hover transition-colors ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </main>
  );
}