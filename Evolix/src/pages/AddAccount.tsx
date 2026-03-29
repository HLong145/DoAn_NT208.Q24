import { type FormEvent, useState } from 'react';

export default function AddAccount() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Demo UI only: keep interaction local until real auth is wired.
    alert(`Added account: ${username || 'new user'}`);
  };

  return (
    <main className="flex-1 min-w-0 border-r border-border h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-bg-panel border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Add an existing account</h1>
        <p className="text-text-muted mb-6">Sign in with another account to switch between profiles.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Phone, email, or username"
            className="w-full rounded-xl border border-border bg-bg-base px-4 py-3 outline-none focus:border-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-border bg-bg-base px-4 py-3 outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="w-full bg-primary text-white rounded-full py-3 font-bold hover:bg-primary-hover transition-colors"
          >
            Add account
          </button>
        </form>
      </div>
    </main>
  );
}
