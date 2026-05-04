import { useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../services/authApi';

export default function Logout() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const userLabel = session?.user.handle ? `@${session.user.handle}` : 'your account';

  return (
    <main className="flex-1 min-w-0 border-r border-border h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-bg-panel border border-border rounded-2xl p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Log out {userLabel}</h1>
        <p className="text-text-muted mb-6">You can always log back in at any time.</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-full border border-border py-3 font-bold hover:bg-border/40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuthSession();
              navigate('/login', { replace: true });
            }}
            className="flex-1 rounded-full bg-primary text-white py-3 font-bold hover:bg-primary-hover transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
