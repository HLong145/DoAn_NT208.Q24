import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GoogleAuthModal from '../components/GoogleAuthModal';
import { loginUser, saveAuthSession } from '../services/authApi';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);

  const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const finishAuth = () => {
    navigate(redirectPath, { replace: true });
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await loginUser(email, password);
      saveAuthSession(session);
      finishAuth();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = (session: Awaited<ReturnType<typeof loginUser>>) => {
    saveAuthSession(session);
    finishAuth();
  };

  return (
    <div className="min-h-screen bg-bg-base px-6 py-10 sm:py-16">
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        mode="login"
        onClose={() => setIsGoogleAuthOpen(false)}
        onAuthenticated={handleGoogleSuccess}
      />

      <div className="mx-auto max-w-[1120px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:block">
          <img src="/images/web_logo.jpg" alt="Evolix" className="w-16 h-16 object-contain rounded-xl mb-10" />
          <h1 className="text-6xl font-extrabold tracking-tight leading-[1.05]">Happening now.</h1>
          <p className="text-xl text-text-muted mt-4 max-w-md">Join Evolix and follow what matters.</p>
        </div>

        <div className="w-full max-w-[420px]">
          <img src="/images/web_logo.jpg" alt="Evolix" className="lg:hidden w-12 h-12 object-contain rounded-xl mb-8" />

          <h2 className="text-[32px] font-extrabold tracking-tight mb-6">Sign in</h2>

          <div className="space-y-3 mb-6">
            <button type="button" onClick={() => { setErrorMessage(''); setIsGoogleAuthOpen(true); }} className="w-full flex items-center justify-center gap-3 border border-border rounded-full py-2.5 hover:bg-border/40 transition-colors font-bold">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-text-muted text-sm">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage ? (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            ) : null}
            <input
              type="email"
              placeholder="Email"
              className="w-full border border-border rounded-md px-4 py-3 outline-none focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-border rounded-md px-4 py-3 outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-text-base text-bg-base rounded-full py-2.5 font-bold hover:opacity-85 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 text-sm">
            <Link to="/forgot-password" state={location.state} className="text-primary hover:underline block mb-2">Forgot password?</Link>
            <p className="text-text-muted">
              Don't have an account? <Link to="/register" state={location.state} className="text-primary hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
