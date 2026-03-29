import { useState, useEffect, useRef } from 'react';
import { Search, Settings, Edit, Info, Image, Smile, Send, Check, CheckCheck, ChevronDown, MessageCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Messages() {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'direct' | 'groups'>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const popularEmojis = ['😂', '😭', '🥺', '✨', '❤️', '🔥', '👍', '👏', '🙏', '🤔', '💀', '💯', '🥰', '😊', '👀'];

  const chats = [
    { id: 1, type: 'group', name: 'Design Weekly', handle: '@designweekly', avatar: 'https://i.pravatar.cc/150?img=44', lastMessage: 'Have you seen the latest updates to Figma?', time: '2h', unread: 2, typing: false },
    { id: 2, type: 'direct', name: 'Alex Morgan', handle: '@alexmorgan', avatar: 'https://i.pravatar.cc/150?img=12', lastMessage: 'Sounds good, let\'s catch up tomorrow.', time: '1d', unread: 0, typing: true },
    { id: 3, type: 'direct', name: 'Sarah Jenkins', handle: '@sarahj', avatar: 'https://i.pravatar.cc/150?img=33', lastMessage: 'Thanks for sharing that article!', time: '2d', unread: 0, typing: false },
  ];

  const messages = [
    { id: 1, sender: 'them', text: 'Hey! Did you see the new design system update?', time: '10:00 AM', status: 'seen' },
    { id: 2, sender: 'me', text: 'Yes, I was just looking at it. The new color palette is really nice.', time: '10:05 AM', status: 'seen' },
    { id: 3, sender: 'them', text: 'Have you seen the latest updates to Figma?', time: '10:12 AM', status: 'delivered' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat]);

  const { chatTheme, setChatTheme, nickname, setNickname } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const filterLabel = chatFilter === 'all' ? 'All' : chatFilter === 'unread' ? 'Unread' : chatFilter === 'direct' ? 'Direct' : 'Groups';

  const filteredChats = chats.filter((chat) => {
    if (chatFilter === 'all') return true;
    if (chatFilter === 'unread') return chat.unread > 0;
    if (chatFilter === 'direct') return chat.type === 'direct';
    return chat.type === 'group';
  });

  return (
    <div className="flex w-full min-w-0 h-screen">
      <section className={`flex-shrink-0 border-r border-border h-screen flex-col bg-bg-base z-10 ${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[390px] md:min-w-[390px]`}>
        <div className="sticky top-0 bg-bg-base/90 backdrop-blur-md z-10 border-b border-border p-4 flex justify-between items-center">
          <div className="flex items-center gap-3" ref={filterMenuRef}>
            <h1 className="text-xl font-bold">Chat</h1>
            <div className="relative">
              <button
                onClick={() => setIsFilterMenuOpen((s) => !s)}
                className="px-3 py-1.5 rounded-full border border-border hover:bg-border/50 transition-colors flex items-center gap-1.5 text-[15px] font-bold"
              >
                {filterLabel}
                <ChevronDown className="w-4 h-4" />
              </button>

              {isFilterMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-44 bg-bg-panel border border-border rounded-xl shadow-lg z-30 py-2 overflow-hidden">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'unread', label: 'Unread' },
                    { id: 'direct', label: 'Direct' },
                    { id: 'groups', label: 'Groups' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setChatFilter(opt.id as 'all' | 'unread' | 'direct' | 'groups');
                        setIsFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-border/30 transition-colors ${chatFilter === opt.id ? 'font-bold text-text-base' : 'text-text-muted'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 relative">
            <button
              className="p-2 hover:bg-border/50 rounded-full transition-colors"
              onClick={() => setIsChatSettingsOpen((s) => !s)}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-border/50 rounded-full transition-colors">
              <Edit className="w-5 h-5" />
            </button>

            {isChatSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-bg-panel border border-border rounded-2xl shadow-lg z-30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">Chat settings</div>
                  <button className="text-sm text-text-muted" onClick={() => setIsChatSettingsOpen(false)}>Close</button>
                </div>
                <div className="mb-3">
                  <label className="text-sm text-text-muted block mb-1">Chat theme</label>
                  <select value={chatTheme} onChange={(e) => setChatTheme(e.target.value)} className="w-full rounded-md p-2 border border-border">
                    <option value="default">Default</option>
                    <option value="dark">Dark</option>
                    <option value="accent">Accent bubbles</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Nickname</label>
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Your display name" className="w-full rounded-md p-2 border border-border bg-bg-panel" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search Direct Messages" 
              className="w-full bg-border/50 rounded-full py-2 pl-12 pr-4 outline-none focus:bg-bg-panel focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat.id)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors ${activeChat === chat.id ? 'bg-border/50 border-r-4 border-primary' : 'hover:bg-border/30'}`}
              >
                <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold truncate">{chat.name}</p>
                    <p className="text-xs text-text-muted">{chat.time}</p>
                  </div>
                  {chat.typing ? (
                    <p className="text-sm text-primary italic mt-1">Typing...</p>
                  ) : (
                    <p className={`text-sm truncate mt-1 ${chat.unread ? 'font-bold text-text-base' : 'text-text-muted'}`}>
                      {chat.lastMessage}
                    </p>
                  )}
                </div>
                {chat.unread > 0 && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center self-center">
                    <span className="text-white text-xs font-bold">{chat.unread}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted">No conversations in this filter.</div>
          )}
        </div>
      </section>

      <section className={`chat-panel flex-1 min-w-0 flex-col h-screen relative ${activeChat ? 'flex' : 'hidden md:flex'} ${chatTheme === 'dark' ? 'chat-dark' : ''}`}>
        {activeChat ? (
          <>
              <div className="sticky top-0 bg-bg-panel/90 backdrop-blur-md z-10 border-b border-border p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  className="md:hidden p-2 -ml-2 hover:bg-border/50 rounded-full"
                  onClick={() => setActiveChat(null)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
                </button>
                <img src={chats.find(c => c.id === activeChat)?.avatar} alt="User" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-bold">{chats.find(c => c.id === activeChat)?.name}</p>
                  <p className="text-xs text-text-muted">{chats.find(c => c.id === activeChat)?.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveChat(null)} className="hidden md:inline-flex lg:hidden items-center gap-2 px-3 py-1 rounded-md hover:bg-border/30 transition-colors">
                  Back
                </button>
                <button className="p-2 hover:bg-border/50 rounded-full transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative">
              <div className="text-center text-xs text-text-muted my-4">Oct 24, 2023, 10:30 AM</div>
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 max-w-[80%] ${msg.sender === 'me' ? 'self-end flex-row-reverse' : ''}`}>
                  {msg.sender === 'them' && (
                    <img src={chats.find(c => c.id === activeChat)?.avatar} alt="User" className="w-8 h-8 rounded-full object-cover self-end" />
                  )}
                  <div className="flex flex-col">
                        <div>
                          {msg.sender === 'me' && nickname && (
                            <div className="text-xs text-text-muted mb-1 text-right">{nickname}</div>
                          )}
                          <div className={`p-3 rounded-2xl ${msg.sender === 'me' ? (chatTheme === 'accent' ? 'bg-primary text-white rounded-br-sm' : 'bg-primary text-white rounded-br-sm') : 'bg-border/50 text-text-base rounded-bl-sm'}`}>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                    <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-text-muted">{msg.time}</span>
                      {msg.sender === 'me' && (
                        msg.status === 'seen' ? <CheckCheck className="w-3 h-3 text-primary" /> : <Check className="w-3 h-3 text-text-muted" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {chats.find(c => c.id === activeChat)?.typing && (
                <div className="flex gap-3 max-w-[80%]">
                  <img src={chats.find(c => c.id === activeChat)?.avatar} alt="User" className="w-8 h-8 rounded-full object-cover self-end" />
                  <div className="bg-border/50 p-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-bg-panel relative">
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute bottom-full right-4 mb-2 bg-bg-panel border border-border rounded-2xl shadow-lg p-3 w-64 z-20"
                >
                  <div className="text-sm font-bold text-text-muted mb-2 px-1">Popular Emojis</div>
                  <div className="grid grid-cols-5 gap-2">
                    {popularEmojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:bg-border/50 rounded-lg p-1 transition-colors flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-border/50 rounded-2xl flex items-center p-2">
                <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                  <Image className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  placeholder="Start a new message" 
                  className="flex-1 bg-transparent border-none outline-none px-2"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && messageText.trim()) {
                      setMessageText('');
                    }
                  }}
                />
                <button 
                  className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  className={`p-2 rounded-full transition-colors ml-1 ${messageText.trim() ? 'text-primary hover:bg-primary/10' : 'text-primary/50 cursor-not-allowed'}`}
                  disabled={!messageText.trim()}
                  onClick={() => setMessageText('')}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-border/60 flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-text-base" />
            </div>
            <h2 className="text-4xl font-bold mb-3">Start Conversation</h2>
            <p className="text-text-muted mb-8 max-w-md text-lg">Choose from your existing conversations, or start a new one.</p>
            <button className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-hover transition-colors text-lg">
              New chat
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
