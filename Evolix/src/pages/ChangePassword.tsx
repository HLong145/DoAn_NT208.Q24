import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../services/authApi';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await changePassword(currentPassword, newPassword);
      setIsSubmitting(false);
      setSuccess(true);
      resetForm();
    } catch (requestError) {
      setIsSubmitting(false);
      setError(requestError instanceof Error ? requestError.message : 'Could not update password.');
    }
  };

  return (
    <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
      <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Change your password</h1>
          <p className="text-[13px] text-text-muted">Keep your account secure</p>
        </div>
      </div>

      <div className="max-w-[620px] p-4 sm:p-6">
        {error && <div className="mb-4 text-sm text-red-500">{error}</div>}
        {success && <div className="mb-4 text-sm text-primary">Your password was updated successfully.</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-bg-panel">
              <label className="text-sm text-text-muted block mb-1">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-[15px]"
                placeholder="Enter current password"
              />
            </div>

            <div className="px-4 py-3 border-b border-border bg-bg-panel">
              <label className="text-sm text-text-muted block mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-[15px]"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="px-4 py-3 bg-bg-panel">
              <label className="text-sm text-text-muted block mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-[15px]"
                placeholder="Retype new password"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className={`bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary-hover transition-colors ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-full border border-border text-text-muted hover:bg-border/40 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
