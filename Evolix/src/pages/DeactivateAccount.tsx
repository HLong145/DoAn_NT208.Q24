import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeactivateAccount() {
  const navigate = useNavigate();
  const [deactivated, setDeactivated] = useState(false);

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
      <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Deactivate your account</h1>
          <p className="text-[13px] text-text-muted">Temporarily disable your profile</p>
        </div>
      </div>

      <div className="max-w-[620px] p-4 sm:p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 mb-5">
          <h2 className="font-bold mb-2">What happens when you deactivate</h2>
          <ul className="text-sm text-text-muted space-y-1 list-disc pl-5">
            <li>Your profile, posts, and likes are hidden.</li>
            <li>You can reactivate by logging back in.</li>
            <li>Some account data may still be retained for legal reasons.</li>
          </ul>
        </div>

        {deactivated ? (
          <div className="text-primary font-bold">Your account has been deactivated.</div>
        ) : (
          <div className="flex gap-3 items-center">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to deactivate your account?')) {
                  setDeactivated(true);
                }
              }}
              className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 transition-colors"
            >
              Deactivate
            </button>
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-full border border-border text-text-muted hover:bg-border/40 transition-colors">Cancel</button>
          </div>
        )}
      </div>
    </main>
  );
}
