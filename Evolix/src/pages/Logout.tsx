import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();

  return (
    <main className="flex-1 min-w-0 border-r border-border h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-bg-panel border border-border rounded-2xl p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Log out @janedoe</h1>
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
            onClick={() => navigate('/login')}
            className="flex-1 rounded-full bg-primary text-white py-3 font-bold hover:bg-primary-hover transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
