import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { type AuthSession } from '../services/authApi';
import { continueWithGoogle, getSavedGoogleAccounts, inferGoogleDisplayName, type GoogleAccountOption } from '../services/socialAuth';

type GoogleAuthModalProps = {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onAuthenticated: (session: AuthSession) => void;
};

export default function GoogleAuthModal({ isOpen, mode, onClose, onAuthenticated }: GoogleAuthModalProps) {
  const [accounts, setAccounts] = useState<GoogleAccountOption[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const savedAccounts = getSavedGoogleAccounts();
    const firstAccount = savedAccounts[0];

    setAccounts(savedAccounts);
    setShowAccountForm(savedAccounts.length === 0);
    setEmail(firstAccount?.email ?? '');
    setDisplayName(firstAccount?.name ?? '');
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const title = mode === 'login' ? 'Continue with Google' : 'Sign up with Google';
  const subtitle = mode === 'login'
    ? 'Pick a saved account or continue with another email to sign in.'
    : 'Pick a saved account or use another email to create a Google-style session.';
  const actionLabel = mode === 'login' ? 'Continue' : 'Create account';

  const handleAuthenticate = async (nextEmail: string, nextDisplayName: string) => {
    setErrorMessage('');

    try {
      setIsSubmitting(true);
      const session = await continueWithGoogle({
        email: nextEmail,
        name: nextDisplayName || inferGoogleDisplayName(nextEmail),
      });
      onAuthenticated(session);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not continue with Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountSelect = async (account: GoogleAccountOption) => {
    await handleAuthenticate(account.email, account.name);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleAuthenticate(email, displayName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <button type="button" aria-label="Close Google dialog" className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[540px] overflow-hidden rounded-[28px] border border-border bg-bg-panel shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-white/10 to-white/5">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-text-muted">Google account chooser</p>
              <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:bg-border/30 hover:text-text-base"
            aria-label="Close Google dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm text-text-muted">{subtitle}</p>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {accounts.length > 0 && !showAccountForm ? (
            <div className="space-y-3">
              <div className="text-sm font-bold text-text-muted">Saved accounts on this browser</div>
              {accounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleAccountSelect(account)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3 text-left transition-colors hover:bg-border/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-bold tracking-tight">{account.name}</div>
                      <div className="truncate text-sm text-text-muted">{account.email}</div>
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0 text-text-muted" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setShowAccountForm(true);
                  setEmail('');
                  setDisplayName('');
                  setErrorMessage('');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border px-4 py-3 text-sm font-bold text-text-muted transition-colors hover:bg-border/20 hover:text-text-base"
              >
                Use another account
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Google email"
                required
                className="w-full rounded-2xl border border-border bg-bg-base px-4 py-3 outline-none transition-colors focus:border-primary"
              />

              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name (optional)"
                className="w-full rounded-2xl border border-border bg-bg-base px-4 py-3 outline-none transition-colors focus:border-primary"
              />

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-5 py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Working...' : actionLabel}
                </button>

                {accounts.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAccountForm(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-5 py-3 font-bold transition-colors hover:bg-border/30"
                  >
                    Back to saved accounts
                  </button>
                ) : null}
              </div>
            </form>
          )}

          <p className="text-xs leading-5 text-text-muted">
            This local demo stores a Google-style session in your browser so the app can open with a real token.
          </p>
        </div>
      </div>
    </div>
  );
}