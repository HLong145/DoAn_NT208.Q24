import { useState } from 'react';
import { ArrowLeft, MessageCircle, Repeat2, Heart, BarChart2, Share, Bookmark, MoreHorizontal, Image as ImageIcon, Smile, ListTodo, Calendar, MapPin } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Tweet from '../components/Tweet';
import TrendingSidebar from '../components/TrendingSidebar';

export default function TweetDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [replyText, setReplyText] = useState('');

  // Mock main tweet
  const mainTweet = {
    id: id || "1",
    author: {
      name: "Jane Doe",
      handle: "janedoe",
      avatar: "https://i.pravatar.cc/150?img=11"
    },
    content: "Just published a new article on the intersection of design and technology. It's fascinating how much typography influences our perception of digital products. #design #tech\n\nI've been looking into variable fonts recently and the performance benefits are incredible. Anyone else using them in production? @designweekly",
    timestamp: "10:30 AM · Oct 24, 2023",
    stats: { replies: 12, reposts: 45, likes: 320, views: 1200, bookmarks: 15 },
    isLiked: true,
    media: ["https://picsum.photos/seed/design/800/400"]
  };

  const mockReplies = [
    {
      id: "101",
      author: {
        name: "Tech Insider",
        handle: "techinsider",
        avatar: "https://i.pravatar.cc/150?img=32"
      },
      content: "Variable fonts are definitely the future. We reduced our font payload by 60% after switching. #webperf",
      timestamp: "1h",
      stats: { replies: 2, reposts: 5, likes: 45, views: 300 }
    },
    {
      id: "102",
      author: {
        name: "Design Weekly",
        handle: "designweekly",
        avatar: "https://i.pravatar.cc/150?img=44"
      },
      content: "@janedoe Great article! The point about readability vs aesthetics was spot on.",
      timestamp: "2h",
      stats: { replies: 0, reposts: 1, likes: 12, views: 150 }
    }
  ];

  const renderContentWithLinks = (text: string) => {
    const parts = text.split(/(@\w+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return (
          <span key={index} className="text-primary hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      <main className="flex-1 min-w-0 border-r border-border pb-20 sm:pb-0 relative">
        <div className="sticky top-0 bg-bg-base/85 backdrop-blur-xl z-10 border-b border-border p-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-extrabold tracking-tight">Post</h1>
        </div>
        
        {/* Main Tweet */}
        <article className="p-4 border-b border-border">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${mainTweet.author.handle}`}>
                <img src={mainTweet.author.avatar} alt={mainTweet.author.name} className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity" />
              </Link>
              <div>
                <Link to={`/profile/${mainTweet.author.handle}`} className="font-bold hover:underline block leading-tight">
                  {mainTweet.author.name}
                </Link>
                <span className="text-text-muted text-sm">@{mainTweet.author.handle}</span>
              </div>
            </div>
            <button className="text-text-muted hover:text-text-base hover:bg-border/50 p-2 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[23px] leading-8 whitespace-pre-wrap break-words mb-4 tracking-tight">
            {renderContentWithLinks(mainTweet.content)}
          </p>
          
          {mainTweet.media && mainTweet.media.length > 0 && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-border">
              {mainTweet.media.map((url, index) => (
                <img key={index} src={url} alt="Tweet media" className="w-full h-auto" />
              ))}
            </div>
          )}

          <div className="text-text-muted text-[15px] mb-4 hover:underline cursor-pointer">
            {mainTweet.timestamp} · <span className="font-bold text-text-base">{mainTweet.stats.views}</span> Views
          </div>

          <div className="border-y border-border py-3 flex gap-6 text-[15px]">
            <button className="hover:underline"><span className="font-bold text-text-base">{mainTweet.stats.reposts}</span> <span className="text-text-muted">Reposts</span></button>
            <button className="hover:underline"><span className="font-bold text-text-base">{mainTweet.stats.likes}</span> <span className="text-text-muted">Likes</span></button>
            <button className="hover:underline"><span className="font-bold text-text-base">{mainTweet.stats.bookmarks}</span> <span className="text-text-muted">Bookmarks</span></button>
          </div>

          <div className="flex justify-around items-center py-2 text-text-muted border-b border-border">
            <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="p-2 rounded-full hover:bg-[#00ba7c]/10 hover:text-[#00ba7c] transition-colors">
              <Repeat2 className="w-6 h-6" />
            </button>
            <button className={`p-2 rounded-full transition-colors ${mainTweet.isLiked ? 'text-[#f91880]' : 'hover:bg-[#f91880]/10 hover:text-[#f91880]'}`}>
              <Heart className={`w-6 h-6 ${mainTweet.isLiked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <Bookmark className="w-6 h-6" />
            </button>
            <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <Share className="w-6 h-6" />
            </button>
          </div>
        </article>

        {/* Reply Box */}
        <div className="p-4 border-b border-border flex gap-4">
          <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1">
            <div className="text-text-muted text-sm mb-1">Replying to <span className="text-primary">@{mainTweet.author.handle}</span></div>
            <textarea 
              placeholder="Post your reply" 
              className="w-full bg-transparent resize-none outline-none text-[20px] placeholder:text-text-muted min-h-[50px] overflow-hidden"
              value={replyText}
              onChange={(e) => {
                setReplyText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1 text-primary">
                <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                  <ListTodo className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-primary/10 transition-colors hidden sm:block">
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
              
              <button 
                className={`bg-primary text-white px-5 py-1.5 rounded-full font-bold transition-colors ${replyText.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
                disabled={replyText.length === 0}
              >
                Reply
              </button>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="divide-y divide-border">
          {mockReplies.map(reply => (
            <div key={reply.id}>
              <Tweet 
                id={reply.id}
                author={reply.author}
                content={reply.content}
                timestamp={reply.timestamp}
                stats={reply.stats}
              />
            </div>
          ))}
        </div>
      </main>

      <TrendingSidebar />
    </>
  );
}
