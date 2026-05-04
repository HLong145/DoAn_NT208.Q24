import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GoogleAuthModal from '../components/GoogleAuthModal';
import { registerUser, saveAuthSession, type AuthSession } from '../services/authApi';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);

  const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const finishAuth = () => {
    navigate(redirectPath, { replace: true });
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await registerUser(username, email, password);
      saveAuthSession(session);
      finishAuth();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = (session: AuthSession) => {
    saveAuthSession(session);
    finishAuth();
  };

  return (
    <div className="min-h-screen bg-bg-base px-6 py-10 sm:py-16">
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        mode="register"
        onClose={() => setIsGoogleAuthOpen(false)}
        onAuthenticated={handleGoogleSuccess}
      />

      <div className="mx-auto max-w-[1120px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:block">
          <div className="w-16 h-16 bg-text-base text-bg-base flex items-center justify-center font-bold text-3xl rounded-md mb-10">
            E
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight leading-[1.05]">Join today.</h1>
          <p className="text-xl text-text-muted mt-4 max-w-md">Create your account and start posting in minutes.</p>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="lg:hidden w-12 h-12 bg-text-base text-bg-base flex items-center justify-center font-bold text-2xl rounded-md mb-8">
            E
          </div>

          <h2 className="text-[32px] font-extrabold tracking-tight mb-6">Create your account</h2>

          <div className="space-y-3 mb-6">
            <button type="button" onClick={() => { setErrorMessage(''); setIsGoogleAuthOpen(true); }} className="w-full flex items-center justify-center gap-3 border border-border rounded-full py-2.5 hover:bg-border/40 transition-colors font-bold">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign up with Google
            </button>
            <button type="button" onClick={() => setErrorMessage('Apple sign-up is not configured in this demo.')} className="w-full flex items-center justify-center gap-3 border border-border rounded-full py-2.5 hover:bg-border/40 transition-colors font-bold">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Sign up with Apple
            </button>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-text-muted text-sm">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {errorMessage ? (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            ) : null}
            <input
              type="text"
              placeholder="Username"
              className="w-full border border-border rounded-md px-4 py-3 outline-none focus:border-primary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
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
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-sm space-y-2">
            <p className="text-text-muted">
              By signing up, you agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
            <p className="text-text-muted mt-3">
              Already have an account? <Link to="/login" state={location.state} className="text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
