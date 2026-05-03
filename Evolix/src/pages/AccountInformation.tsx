import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, type AuthUser } from '../services/authApi';

export default function AccountInformation() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await getCurrentUser();
        setCurrentUser(response.user);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load account information.');
      }
    };

    void loadCurrentUser();
  }, []);

  const rows = [
    { label: 'Username', value: currentUser?.handle ?? 'Not available' },
    { label: 'Email', value: currentUser?.email ?? 'Not available' },
    { label: 'Display name', value: currentUser?.name ?? 'Not available' },
    { label: 'Account creation', value: currentUser ? new Date(currentUser.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'Not available' },
    { label: 'Phone', value: 'Not connected' },
  ];

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
      <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Account information</h1>
          <p className="text-[13px] text-text-muted">See your account details</p>
        </div>
      </div>

      <div className="max-w-[620px]">
        <p className="px-4 py-3 text-sm text-text-muted">
          Review and update the information associated with your account.
        </p>

        {errorMessage && <div className="px-4 pb-3 text-sm text-red-500">{errorMessage}</div>}

        <div className="border-y border-border">
          {rows.map((row) => (
            <button
              key={row.label}
              className="w-full px-4 py-4 hover:bg-border/50 transition-colors flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm text-text-muted">{row.label}</p>
                <p className="text-[15px] text-text-base mt-0.5">{row.value}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted" />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
