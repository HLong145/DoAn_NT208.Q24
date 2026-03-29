import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goToWebsite = () => {
    navigate('/', { replace: true });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    goToWebsite();
  };

  return (
    <div className="min-h-screen bg-bg-base px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-[1120px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:block">
          <div className="w-16 h-16 bg-text-base text-bg-base flex items-center justify-center font-bold text-3xl rounded-md mb-10">
            E
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight leading-[1.05]">Happening now.</h1>
          <p className="text-xl text-text-muted mt-4 max-w-md">Join Evolix and follow what matters.</p>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="lg:hidden w-12 h-12 bg-text-base text-bg-base flex items-center justify-center font-bold text-2xl rounded-md mb-8">
            E
          </div>

          <h2 className="text-[32px] font-extrabold tracking-tight mb-6">Sign in</h2>

          <div className="space-y-3 mb-6">
            <button type="button" onClick={goToWebsite} className="w-full flex items-center justify-center gap-3 border border-border rounded-full py-2.5 hover:bg-border/40 transition-colors font-bold">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
            <button type="button" onClick={goToWebsite} className="w-full flex items-center justify-center gap-3 border border-border rounded-full py-2.5 hover:bg-border/40 transition-colors font-bold">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Sign in with Apple
            </button>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-text-muted text-sm">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email or username"
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

            <button type="submit" className="w-full bg-text-base text-bg-base rounded-full py-2.5 font-bold hover:opacity-85 transition-opacity">
              Log in
            </button>
          </form>

          <div className="mt-6 text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline block mb-2">Forgot password?</Link>
            <p className="text-text-muted">
              Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
