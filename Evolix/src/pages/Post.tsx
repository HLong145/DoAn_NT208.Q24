import { type FormEvent, useRef, useState } from 'react';
import { Image as ImageIcon, Smile, ListTodo, Calendar, MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createTweet } from '../services/tweetsApi';

const QUICK_EMOJIS = ['😀', '😂', '😍', '🔥', '👏', '🎉', '❤️', '👍'];

export default function Post() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const maxChars = 280;
  const charsLeft = maxChars - content.length;

  const handleCancel = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const trimmedLocation = location.trim();
    const finalContent = trimmedLocation ? `${trimmedContent}\n\n📍 ${trimmedLocation}` : trimmedContent;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await createTweet(finalContent, mediaFiles.length > 0 ? mediaFiles : undefined);
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not publish tweet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setMediaFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = '';
  };

  const removeMedia = (targetIndex: number) => {
    setMediaFiles((prev) => prev.filter((_, index) => index !== targetIndex));
  };

  const addQuickEmoji = (emoji: string) => {
    setContent((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  };

  const insertPollTemplate = () => {
    const pollTemplate = '\n\nPoll:\n1) Option 1\n2) Option 2';
    setContent((prev) => `${prev}${pollTemplate}`.trim());
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
          {errorMessage ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxChars}
            placeholder="What is happening?"
            className="w-full min-h-[180px] bg-transparent resize-none outline-none text-[22px] leading-8 placeholder:text-text-muted"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleMediaSelect}
          />

          {mediaFiles.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {mediaFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="rounded-xl border border-border bg-bg-base px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-sm truncate text-text-muted">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="rounded-full p-1.5 hover:bg-border/50 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              ref={locationInputRef}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 outline-none focus:border-primary"
            />

            {showScheduleInput ? (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 outline-none focus:border-primary"
              />
            ) : null}
          </div>

          <div className="mt-5 border-t border-border pt-3 flex flex-wrap items-start justify-between gap-3 relative">
            <div className="flex items-center gap-1 text-primary">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                aria-label="Add media"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={insertPollTemplate}
                className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                aria-label="Create poll"
              >
                <ListTodo className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
                aria-label="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowScheduleInput((prev) => !prev)}
                className={`p-2 rounded-full transition-colors ${showScheduleInput ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
                aria-label="Schedule post"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => locationInputRef.current?.focus()}
                className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                aria-label="Set location"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            {showEmojiPicker ? (
              <div className="absolute left-0 top-full mt-2 z-10 rounded-xl border border-border bg-bg-panel shadow-lg p-2 flex items-center gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addQuickEmoji(emoji)}
                    className="w-8 h-8 rounded-full hover:bg-border/50 transition-colors"
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <span className={`text-sm ${charsLeft <= 20 ? 'text-[#ff3b30]' : 'text-text-muted'}`}>{charsLeft}</span>
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className={`rounded-full px-6 py-2.5 font-bold text-white transition-colors ${content.trim() && !isSubmitting ? 'bg-primary hover:bg-primary-hover' : 'bg-primary/50 cursor-not-allowed'}`}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
