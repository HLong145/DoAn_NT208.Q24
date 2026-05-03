import React, { useState } from 'react';
import { MessageCircle, Repeat2, Heart, BarChart2, Share, Bookmark, MoreHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toggleBookmark } from '../services/bookmarksApi';
import { toggleLike } from '../services/likesApi';
import { retweetTweet } from '../services/tweetsApi';

interface TweetProps {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  stats: {
    replies: number;
    reposts: number;
    likes: number;
    views: number;
  };
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  media?: string[];
  onBookmarkChange?: (tweetId: string, bookmarked: boolean) => void;
}

export default function Tweet({ id, author, content, timestamp, stats, isLiked: initialIsLiked, isReposted: initialIsReposted, isBookmarked: initialIsBookmarked, media, onBookmarkChange }: TweetProps) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(initialIsLiked || false);
  const [isReposted, setIsReposted] = useState(initialIsReposted || false);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked || false);
  const [likesCount, setLikesCount] = useState(stats.likes);
  const [repostsCount, setRepostsCount] = useState(stats.reposts);
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) {
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      setIsLiking(true);
      await toggleLike(Number(id));
    } catch (error) {
      console.error('Could not toggle like:', error);
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isReposting) {
      return;
    }

    const nextReposted = !isReposted;
    setIsReposted(nextReposted);
    setRepostsCount((prev) => (nextReposted ? prev + 1 : Math.max(0, prev - 1)));

    try {
      setIsReposting(true);
      if (nextReposted) {
        await retweetTweet(Number(id));
      }
    } catch (error) {
      console.error('Could not toggle repost:', error);
      setIsReposted((prev) => !prev);
      setRepostsCount((prev) => (nextReposted ? Math.max(0, prev - 1) : prev + 1));
    } finally {
      setIsReposting(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBookmarking) {
      return;
    }

    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);

    try {
      setIsBookmarking(true);
      const response = await toggleBookmark(Number(id));
      setIsBookmarked(response.bookmarked);
      onBookmarkChange?.(id, response.bookmarked);
    } catch (error) {
      console.error('Could not toggle bookmark:', error);
      setIsBookmarked((prev) => !prev);
    } finally {
      setIsBookmarking(false);
    }
  };

  const renderContentWithLinks = (text: string) => {
    const parts = text.split(/(@\w+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span 
            key={index} 
            className="text-primary hover:underline cursor-pointer" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/profile/${part.substring(1)}`);
            }}
          >
            {part}
          </span>
        );
      } else if (part.startsWith('#')) {
        return (
          <span 
            key={index} 
            className="text-primary hover:underline cursor-pointer" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/explore?q=${encodeURIComponent(part)}`);
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <article 
      className="px-4 py-3 border-b border-border hover:bg-border/35 transition-colors cursor-pointer flex gap-3"
      onClick={() => navigate(`/tweet/${id}`)}
    >
      <Link to={`/profile/${author.handle}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity" />
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1 text-[15px] truncate">
            <Link to={`/profile/${author.handle}`} className="font-bold hover:underline truncate tracking-tight" onClick={(e) => e.stopPropagation()}>
              {author.name}
            </Link>
            <span className="text-text-muted truncate text-[15px]">@{author.handle}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted hover:underline text-[15px]">{timestamp}</span>
          </div>
          <button className="text-text-muted hover:text-primary hover:bg-primary/10 p-1.5 rounded-full transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="block mt-1">
          <p className="text-[15px] leading-5 whitespace-pre-wrap break-words">
            {renderContentWithLinks(content)}
          </p>
          
          {media && media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} rounded-2xl overflow-hidden border border-border`}>
              {media.map((url, index) => (
                <img key={index} src={url} alt="Tweet media" className="w-full h-full object-cover max-h-[300px]" />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-2 text-text-muted max-w-[430px]">
          <button className="flex items-center gap-1.5 group hover:text-primary transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/tweet/${id}`); }}>
            <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-xs">{stats.replies}</span>
          </button>
          
          <button className={`flex items-center gap-1.5 group transition-colors ${isReposted ? 'text-[#00ba7c]' : 'hover:text-[#00ba7c]'} ${isReposting ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={handleRepost} disabled={isReposting}>
            <div className={`p-2 rounded-full transition-colors ${isReposted ? 'bg-[#00ba7c]/10' : 'group-hover:bg-[#00ba7c]/10'}`}>
              <Repeat2 className="w-4 h-4" />
            </div>
            <span className="text-xs">{repostsCount}</span>
          </button>
          
          <button className={`flex items-center gap-1.5 group transition-colors ${isLiked ? 'text-[#f91880]' : 'hover:text-[#f91880]'} ${isLiking ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={handleLike} disabled={isLiking}>
            <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-[#f91880]/10' : 'group-hover:bg-[#f91880]/10'}`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-xs">{likesCount}</span>
          </button>
          
          <button className="flex items-center gap-1.5 group hover:text-primary transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span className="text-xs">{stats.views}</span>
          </button>

          <div className="flex items-center gap-1">
            <button className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-primary bg-primary/10' : 'hover:text-primary hover:bg-primary/10'} ${isBookmarking ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={handleBookmark} disabled={isBookmarking}>
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-full hover:text-primary hover:bg-primary/10 transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <Share className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
