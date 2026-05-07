import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Edit, Image, Info, MessageCircle, Search, Send, Settings, Smile, Check, CheckCheck, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { createRealtimeSocket } from '../services/realtimeClient';
import { useAuth } from '../contexts/AuthContext';
import { createConversation, getConversationMessages, getConversationThreads, sendConversationMessage, type ConversationMessage, type ConversationThread } from '../services/messagesApi';
import { searchUsers, type UserSummary } from '../services/usersApi';

const CHAT_FILTERS = ['all', 'unread', 'direct'] as const;
type ChatFilter = typeof CHAT_FILTERS[number];

const popularEmojis = ['😂', '😭', '🥺', '✨', '❤️', '🔥', '👍', '👏', '🙏', '🤔', '💀', '💯', '🥰', '😊', '👀'];

const resolveDisplayName = (primary?: string | null, fallback?: string | null) => primary?.trim() || fallback?.trim() || 'Unknown';

export default function MessagesEnhanced() {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSummary[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeThreadIdRef = useRef<string | null>(null);
  const { chatTheme, setChatTheme, nickname, setNickname } = useTheme();
  const { currentUser } = useAuth();

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingThreads(true);
        const threadList = await getConversationThreads();
        setThreads(threadList);
        setActiveThreadId((previousThreadId) => previousThreadId ?? threadList[0]?.id ?? null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load conversations.');
      } finally {
        setIsLoadingThreads(false);
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeThreadId) {
        setMessages([]);
        return;
      }

      try {
        setIsLoadingMessages(true);
        setErrorMessage('');
        const loadedMessages = await getConversationMessages(Number(activeThreadId));
        setMessages(loadedMessages);
        setThreads(await getConversationThreads());
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load messages.');
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [activeThreadId]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setUserSearchResults([]);
      return;
    }

    const loadUsers = async () => {
      try {
        const users = await searchUsers(trimmedQuery);
        setUserSearchResults(users.filter((user) => user.id.toString() !== currentUser?.id));
      } catch {
        setUserSearchResults([]);
      }
    };

    void loadUsers();
  }, [currentUser?.id, searchQuery]);

  useEffect(() => {
    const socket = createRealtimeSocket();

    if (!socket) {
      return;
    }

    const refreshInbox = async () => {
      try {
        const refreshedThreads = await getConversationThreads();
        setThreads(refreshedThreads);
      } catch (error) {
        console.error('Could not refresh conversations:', error);
      }
    };

    const handleMessageCreated = (payload: { conversationId?: string }) => {
      void refreshInbox();

      if (payload.conversationId && payload.conversationId === activeThreadIdRef.current) {
        void getConversationMessages(Number(payload.conversationId))
          .then(setMessages)
          .catch((error) => console.error('Could not refresh messages:', error));
      }
    };

    socket.on('message.created', handleMessageCreated);

    return () => {
      socket.off('message.created', handleMessageCreated);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThreadId]);

  useEffect(() => {
    setNicknameInput(nickname);
  }, [nickname]);

  const currentUserId = currentUser?.id ? Number(currentUser.id) : Number.NaN;
  const hasCurrentUserId = Number.isFinite(currentUserId);

  const isSelfMessage = (message: ConversationMessage) => {
    if (hasCurrentUserId) {
      return message.senderId === currentUserId;
    }

    return message.isMine;
  };

  const resolveSelfMessageName = () => currentUser?.name?.trim() || 'You';

  const resolveSelfMessageAvatar = () => currentUser?.avatarUrl?.trim() || '';

  const resolveMessageSenderName = (message: ConversationMessage) => {
    if (isSelfMessage(message)) {
      return resolveSelfMessageName();
    }

    return resolveDisplayName(activeThread?.participant.name, activeThread?.participant.handle);
  };

  const resolveMessageSenderAvatar = (message: ConversationMessage) => {
    if (isSelfMessage(message)) {
      return resolveSelfMessageAvatar();
    }

    return activeThread?.participant.avatar || '';
  };

  const filteredThreads = threads.filter((thread) => {
    const matchesFilter = chatFilter === 'all' || (chatFilter === 'unread' && thread.unreadCount > 0) || chatFilter === 'direct';
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesQuery = normalizedQuery.length === 0
      || thread.participant.name.toLowerCase().includes(normalizedQuery)
      || thread.participant.handle.toLowerCase().includes(normalizedQuery)
      || thread.lastMessage?.content.toLowerCase().includes(normalizedQuery) === true;

    return matchesFilter && matchesQuery;
  });

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? null;

  const startConversation = async (participantId: number) => {
    try {
      setIsStartingConversation(true);
      const conversation = await createConversation(participantId);
      setThreads(await getConversationThreads());
      setActiveThreadId(conversation.id);
      setSearchQuery('');
      setUserSearchResults([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not start conversation.');
    } finally {
      setIsStartingConversation(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(file);
    setMediaPreview(file ? URL.createObjectURL(file) : null);
    e.target.value = '';
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
  };

  const sendMessage = async () => {
    if (!activeThreadId || (messageText.trim().length === 0 && !mediaFile) || isSending) {
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage('');
      await sendConversationMessage(Number(activeThreadId), messageText.trim(), mediaFile ?? undefined);
      setMessageText('');
      clearMedia();

      const [refreshedMessages, refreshedThreads] = await Promise.all([
        getConversationMessages(Number(activeThreadId)),
        getConversationThreads(),
      ]);

      setMessages(refreshedMessages);
      setThreads(refreshedThreads);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageText((previous) => `${previous}${emoji}`);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex w-full min-w-0 h-screen">
      <section className={`flex-shrink-0 border-r border-border h-screen flex-col bg-bg-base z-10 ${activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-[390px] md:min-w-[390px]`}>
        <div className="sticky top-0 bg-bg-base/90 backdrop-blur-md z-10 border-b border-border p-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0" ref={filterMenuRef}>
            <h1 className="text-xl font-bold">Chat</h1>
            <div className="relative">
              <button
                onClick={() => setIsFilterMenuOpen((current) => !current)}
                className="px-3 py-1.5 rounded-full border border-border hover:bg-border/50 transition-colors flex items-center gap-1.5 text-[15px] font-bold"
              >
                {chatFilter === 'all' ? 'All' : chatFilter === 'unread' ? 'Unread' : 'Direct'}
                <ChevronDown className="w-4 h-4" />
              </button>

              {isFilterMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-44 bg-bg-panel border border-border rounded-xl shadow-lg z-30 py-2 overflow-hidden">
                  {CHAT_FILTERS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setChatFilter(option);
                        setIsFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-border/30 transition-colors ${chatFilter === option ? 'font-bold text-text-base' : 'text-text-muted'}`}
                    >
                      {option === 'all' ? 'All' : option === 'unread' ? 'Unread' : 'Direct'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 relative">
            <button
              className="p-2 hover:bg-border/50 rounded-full transition-colors"
              onClick={() => setIsChatSettingsOpen((current) => !current)}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-border/50 rounded-full transition-colors" onClick={() => setActiveThreadId(threads[0]?.id ?? null)}>
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
                  <select value={chatTheme} onChange={(event) => setChatTheme(event.target.value)} className="w-full rounded-md p-2 border border-border bg-bg-panel">
                    <option value="default">Default</option>
                    <option value="dark">Dark</option>
                    <option value="accent">Accent bubbles</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-muted block mb-1">Nickname</label>
                  <input
                    value={nicknameInput}
                    onChange={(event) => setNicknameInput(event.target.value)}
                    onBlur={() => setNickname(nicknameInput)}
                    placeholder="Your display name"
                    className="w-full rounded-md p-2 border border-border bg-bg-panel"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search chats or people"
              className="w-full bg-border/50 rounded-full py-2 pl-12 pr-4 outline-none focus:bg-bg-panel focus:ring-2 focus:ring-primary transition-all"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

              {searchQuery.trim().length > 0 && userSearchResults.length > 0 && (
            <div className="rounded-2xl border border-border bg-bg-panel overflow-hidden">
              <div className="px-4 py-2 text-xs uppercase tracking-wider text-text-muted">Start new chat</div>
              {userSearchResults.map((user) => (
                <button
                  key={user.id}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-border/30 transition-colors text-left"
                  onClick={() => void startConversation(user.id)}
                  disabled={isStartingConversation}
                >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={resolveDisplayName(user.displayName, user.username)} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{resolveDisplayName(user.displayName, user.username).charAt(0)?.toUpperCase()}</div>
                      )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{resolveDisplayName(user.displayName, user.username)}</div>
                    <div className="text-sm text-text-muted truncate">{user.email}</div>
                  </div>
                  <Plus className="w-4 h-4 text-text-muted" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingThreads ? (
            <div className="p-8 text-center text-text-muted">Loading conversations...</div>
          ) : filteredThreads.length > 0 ? (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full p-4 flex gap-3 text-left transition-colors ${activeThreadId === thread.id ? 'bg-border/50 border-r-4 border-primary' : 'hover:bg-border/30'}`}
              >
                <img src={thread.participant.avatar} alt={resolveDisplayName(thread.participant.name, thread.participant.handle)} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-bold truncate">{resolveDisplayName(thread.participant.name, thread.participant.handle)}</p>
                    <p className="text-xs text-text-muted whitespace-nowrap">{thread.lastMessage?.timestamp ?? thread.updatedAt}</p>
                  </div>
                  <p className={`text-sm truncate mt-1 ${thread.unreadCount > 0 ? 'font-bold text-text-base' : 'text-text-muted'}`}>
                    {thread.lastMessage?.content ?? 'No messages yet.'}
                  </p>
                </div>
                {thread.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center self-center">
                    <span className="text-white text-xs font-bold">{thread.unreadCount}</span>
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted">No conversations yet. Search a person to start one.</div>
          )}
        </div>
      </section>

      <section className={`chat-panel flex-1 min-w-0 flex-col h-screen relative ${activeThread ? 'flex' : 'hidden md:flex'} ${chatTheme === 'dark' ? 'chat-dark' : ''}`}>
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-red-500 text-white px-4 py-2 text-sm shadow-lg">
            {errorMessage}
          </div>
        )}

        {activeThread ? (
          <>
            <div className="sticky top-0 bg-bg-panel/90 backdrop-blur-md z-10 border-b border-border p-4 flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                <button className="md:hidden p-2 -ml-2 hover:bg-border/50 rounded-full" onClick={() => setActiveThreadId(null)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
                </button>
                <img src={activeThread.participant.avatar} alt={resolveDisplayName(activeThread.participant.name, activeThread.participant.handle)} className="w-10 h-10 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="font-bold truncate">{resolveDisplayName(activeThread.participant.name, activeThread.participant.handle)}</p>
                  <p className="text-xs text-text-muted truncate">@{activeThread.participant.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-border/50 rounded-full transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative">
              {isLoadingMessages ? (
                <div className="text-center text-text-muted py-10">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-text-muted py-10">Say hello to start the conversation.</div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 max-w-[80%] ${isSelfMessage(message) ? 'self-end flex-row-reverse' : ''}`}>
                    {resolveMessageSenderAvatar(message) ? (
                      <img src={resolveMessageSenderAvatar(message)} alt={resolveMessageSenderName(message)} className="w-8 h-8 rounded-full object-cover self-end" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-border/50 flex items-center justify-center self-end text-[11px] font-bold text-text-base">
                        {resolveMessageSenderName(message).charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className={`text-xs text-text-muted mb-1 ${isSelfMessage(message) ? 'text-right' : ''}`}>{resolveMessageSenderName(message)}</div>
                      <div className={`rounded-2xl overflow-hidden ${isSelfMessage(message) ? 'bg-primary text-white rounded-br-sm' : 'bg-border/50 text-text-base rounded-bl-sm'}`}>
                        {message.mediaUrl && (
                          <img src={message.mediaUrl} alt="media" className="max-w-[240px] block object-cover" />
                        )}
                        {message.content && <p className="whitespace-pre-wrap break-words px-3 py-2">{message.content}</p>}
                        {!message.content && !message.mediaUrl && <p className="px-3 py-2 opacity-50 text-sm italic">empty</p>}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isSelfMessage(message) ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-text-muted">{message.timestamp}</span>
                        {isSelfMessage(message) && (message.isRead ? <CheckCheck className="w-3 h-3 text-primary" /> : <Check className="w-3 h-3 text-text-muted" />)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-bg-panel relative">
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-full right-4 mb-2 bg-bg-panel border border-border rounded-2xl shadow-lg p-3 w-64 z-20">
                  <div className="text-sm font-bold text-text-muted mb-2 px-1">Popular Emojis</div>
                  <div className="grid grid-cols-5 gap-2">
                    {popularEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:bg-border/50 rounded-lg p-1 transition-colors flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMediaSelect}
              />
              {mediaPreview && (
                <div className="relative mb-2 inline-block">
                  <img src={mediaPreview} alt="preview" className="max-h-32 rounded-xl object-cover" />
                  <button
                    onClick={clearMedia}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
                  >
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
              )}
              <div className="bg-border/50 rounded-2xl flex items-center p-2">
                <button
                  className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Send a message"
                  className="flex-1 bg-transparent border-none outline-none px-2"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void sendMessage();
                    }
                  }}
                />
                <button
                  className={`p-2 rounded-full transition-colors ml-1 ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}
                  onClick={() => setShowEmojiPicker((current) => !current)}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 rounded-full transition-colors ml-1 ${(messageText.trim() || mediaFile) ? 'text-primary hover:bg-primary/10' : 'text-primary/50 cursor-not-allowed'}`}
                  disabled={(!messageText.trim() && !mediaFile) || isSending}
                  onClick={() => void sendMessage()}
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
            <p className="text-text-muted mb-8 max-w-md text-lg">Search for a person on the left to open a direct conversation.</p>
            <button className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-hover transition-colors text-lg" onClick={() => setSearchQuery('')}>
              Refresh inbox
            </button>
          </div>
        )}
      </section>
    </div>
  );
}