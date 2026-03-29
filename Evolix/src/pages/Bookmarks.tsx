import { Bookmark as BookmarkIcon } from 'lucide-react';
import TrendingSidebar from '../components/TrendingSidebar';

export default function Bookmarks() {
  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-4">
          <h1 className="text-[20px] font-extrabold tracking-tight">Bookmarks</h1>
          <p className="text-[13px] text-text-muted">@janedoe</p>
        </div>
        
        <div className="px-8 py-14 max-w-[420px]">
          <BookmarkIcon className="w-16 h-16 text-border mb-4" />
          <h2 className="text-[31px] leading-9 font-extrabold tracking-tight mb-2">Save posts for later</h2>
          <p className="text-text-muted text-[15px]">Bookmark posts to easily find them again in the future.</p>
        </div>
      </main>

      <TrendingSidebar />
    </>
  );
}
