import { type FormEvent, useState } from 'react';
import { Image as ImageIcon, Smile, ListTodo, Calendar, MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Post() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const maxChars = 280;
  const charsLeft = maxChars - content.length;

  const handleCancel = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    alert('Post created successfully.');
    setContent('');
    setLocation('');
  };

  return (
    <main className="flex-1 min-w-0 border-r border-border h-screen overflow-y-auto px-4 sm:px-6 py-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-[28px] font-bold tracking-tight">Create post</h1>
          <button
            type="button"
            onClick={handleCancel}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-border/50 transition-colors"
            aria-label="Cancel post"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-panel border border-border rounded-2xl p-4 sm:p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxChars}
            placeholder="What is happening?"
            className="w-full min-h-[180px] bg-transparent resize-none outline-none text-[22px] leading-8 placeholder:text-text-muted"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 outline-none focus:border-primary"
            />
          </div>

          <div className="mt-5 border-t border-border pt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 text-primary">
              <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors" aria-label="Add media">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors" aria-label="Create poll">
                <ListTodo className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors" aria-label="Add emoji">
                <Smile className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors" aria-label="Schedule post">
                <Calendar className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors" aria-label="Set location">
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-sm ${charsLeft <= 20 ? 'text-[#ff3b30]' : 'text-text-muted'}`}>{charsLeft}</span>
              <button
                type="submit"
                disabled={!content.trim()}
                className={`rounded-full px-6 py-2.5 font-bold text-white transition-colors ${content.trim() ? 'bg-primary hover:bg-primary-hover' : 'bg-primary/50 cursor-not-allowed'}`}
              >
                Post
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
