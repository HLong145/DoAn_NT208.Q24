import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSent(true);
  };

  return (
    <div className="min-h-screen bg-bg-base px-6 py-10 sm:py-16 flex items-center justify-center">
      <div className="w-full max-w-[460px] bg-bg-panel border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="w-12 h-12 bg-text-base text-bg-base flex items-center justify-center font-bold text-2xl rounded-md mb-8">
          E
        </div>

        <h1 className="text-[32px] font-extrabold tracking-tight mb-3">Forgot password</h1>
        <p className="text-text-muted mb-6">
          Enter your email or username. We will send instructions to reset your password.
        </p>

        {isSent ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-[15px] text-text-base">
              If the account exists, a password reset email has been sent to <span className="font-bold">{email}</span>.
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-white rounded-full py-3 font-bold hover:bg-primary-hover transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Email or username"
              className="w-full border border-border rounded-xl px-4 py-3 outline-none focus:border-primary bg-bg-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full bg-text-base text-bg-base rounded-full py-3 font-bold hover:opacity-85 transition-opacity"
            >
              Send reset link
            </button>
          </form>
        )}

        <div className="mt-6 text-sm text-text-muted">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
