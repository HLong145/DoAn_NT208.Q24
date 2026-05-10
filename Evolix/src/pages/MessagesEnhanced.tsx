import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Image, Info, MessageCircle, Search, Send, Settings, Smile, Check, CheckCheck, Plus, UserPlus, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { createRealtimeSocket } from '../services/realtimeClient';
import { useAuth } from '../contexts/AuthContext';
import { createConversation, getConversationMessages, getConversationThreads, searchConversationMessages, sendConversationMessage, type ConversationMessage, type ConversationMessageSearchResult, type ConversationThread } from '../services/messagesApi';
import { searchUsers, getAvailableToChat, type UserSummary } from '../services/usersApi';

const CHAT_FILTERS = ['all', 'unread', 'direct'] as const;
type ChatFilter = typeof CHAT_FILTERS[number];

const popularEmojis = ['😂', '😭', '🥺', '✨', '❤️', '🔥', '👍', '👏', '🙏', '🤔', '💀', '💯', '🥰', '😊', '👀'];

const resolveDisplayName = (primary?: string | null, fallback?: string | null) => primary?.trim() || fallback?.trim() || 'Unknown';
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightMatches = (text: string, query: string) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return text;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig'));

  return parts.map((part, index) => (
    part.toLowerCase() === trimmedQuery.toLowerCase()
      ? <mark key={`${part}-${index}`} className="rounded bg-yellow-300 px-0.5 text-inherit">{part}</mark>
      : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
  ));
};

const getThreadSearchRank = (thread: ConversationThread, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return 2;
  }

  const nameMatch = thread.participant.name.toLowerCase().includes(normalizedQuery);
  const handleMatch = thread.participant.handle.toLowerCase().includes(normalizedQuery);
  if (nameMatch || handleMatch) {
    return 0;
  }

  const messageMatch = thread.lastMessage?.content.toLowerCase().includes(normalizedQuery) ?? false;
  if (messageMatch) {
    return 1;
  }

  return 2;
};

type InboxTab = 'conversations' | 'messages';

export default function MessagesEnhanced() {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInboxTab, setActiveInboxTab] = useState<InboxTab>('conversations');
  const [messageSearchResults, setMessageSearchResults] = useState<ConversationMessageSearchResult[]>([]);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [newMessageQuery, setNewMessageQuery] = useState('');
  const [newMessageResults, setNewMessageResults] = useState<UserSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const newMessageMenuRef = useRef<HTMLDivElement>(null);
  const newMessageButtonRef = useRef<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeThreadIdRef = useRef<string | null>(null);
  const { chatTheme, setChatTheme, nickname, setNickname } = useTheme();
  const { currentUser } = useAuth();
  const isDarkChat = chatTheme === 'dark';

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
      if (
        newMessageMenuRef.current
        && !newMessageMenuRef.current.contains(event.target as Node)
        && !(newMessageButtonRef.current && newMessageButtonRef.current.contains(event.target as Node))
      ) {
        setIsNewMessageOpen(false);
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
    const trimmedQuery = newMessageQuery.trim();

    const loadUsers = async () => {
      try {
        const users = trimmedQuery ? await searchUsers(trimmedQuery) : await getAvailableToChat();
        console.log('[New Message] Loaded users:', users);
        setNewMessageResults(users.filter((user) => user.id.toString() !== currentUser?.id));
      } catch (error) {
        console.error('[New Message] Error loading users:', error);
        setNewMessageResults([]);
      }
    };

    void loadUsers();
  }, [currentUser?.id, newMessageQuery]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery || activeInboxTab !== 'messages') {
      setMessageSearchResults([]);
      setIsSearchingMessages(false);
      return;
    }

    let mounted = true;

    const loadMessageSearch = async () => {
      try {
        setIsSearchingMessages(true);
        const results = await searchConversationMessages(trimmedQuery, 'all');
        if (!mounted) return;
        setMessageSearchResults(results);
      } catch {
        if (!mounted) return;
        setMessageSearchResults([]);
      } finally {
        if (mounted) {
          setIsSearchingMessages(false);
        }
      }
    };

    void loadMessageSearch();

    return () => {
      mounted = false;
    };
  }, [activeInboxTab, searchQuery]);

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

  const normalizedInboxQuery = searchQuery.trim();
  const conversationResults = useMemo(() => threads
    .filter((thread) => {
      const matchesFilter = chatFilter === 'all' || (chatFilter === 'unread' && thread.unreadCount > 0) || chatFilter === 'direct';
      const normalizedQuery = normalizedInboxQuery.toLowerCase();
      const matchesQuery = normalizedQuery.length === 0
        || thread.participant.name.toLowerCase().includes(normalizedQuery)
        || thread.participant.handle.toLowerCase().includes(normalizedQuery)
        || thread.lastMessage?.content.toLowerCase().includes(normalizedQuery) === true;

      return matchesFilter && matchesQuery;
    })
    .sort((left, right) => {
      if (!normalizedInboxQuery) {
        return 0;
      }

      const leftRank = getThreadSearchRank(left, normalizedInboxQuery);
      const rightRank = getThreadSearchRank(right, normalizedInboxQuery);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    }), [chatFilter, normalizedInboxQuery, threads]);

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? null;
  const messageResults = activeInboxTab === 'messages' ? messageSearchResults : [];

  useEffect(() => {
    if (!selectedMessageId) {
      return;
    }

    const element = messageRefs.current[selectedMessageId];
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setSelectedMessageId(null);
  }, [messages, activeThreadId, selectedMessageId]);

  const startConversation = async (participantId: number) => {
    try {
      setIsStartingConversation(true);
      const conversation = await createConversation(participantId);
      setThreads(await getConversationThreads());
      setActiveThreadId(conversation.id);
      setSearchQuery('');
      setNewMessageQuery('');
      setNewMessageResults([]);
      setIsNewMessageOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not start conversation.');
    } finally {
      setIsStartingConversation(false);
    }
  };

  const handleSelectMessageResult = (result: ConversationMessageSearchResult) => {
    setActiveThreadId(result.conversationId);
    setActiveInboxTab('messages');
    setSearchQuery(result.message.content);
    setSelectedMessageId(result.message.id);
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

  // Debug: log when modal state changes
  useEffect(() => {
    console.log('[Modal State] isNewMessageOpen:', isNewMessageOpen, 'newMessageResults:', newMessageResults.length);
  }, [isNewMessageOpen, newMessageResults]);

  const getUnreadCountForUser = (userId: number) => {
    const thread = threads.find((t) => t.participant.id === userId);
    const unreadCount = thread?.unreadCount ?? 0;
    console.log('[Unread] User:', userId, 'Thread:', thread?.id, 'Unread:', unreadCount);
    return unreadCount;
  };

  return (
    <div className="flex w-full min-w-0 h-screen bg-black text-white">
      <section className={`flex-shrink-0 border-r border-white/10 h-screen flex-col bg-black z-10 ${activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-[390px] md:min-w-[390px]`}>
        <div className="sticky top-0 bg-black/95 backdrop-blur-md z-10 border-b border-white/10 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[28px] font-extrabold tracking-tight">Chat</h1>
            <div className="flex items-center gap-2">
              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => setIsFilterMenuOpen((current) => !current)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {chatFilter === 'all' ? 'All' : chatFilter === 'unread' ? 'Unread' : 'Direct'}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isFilterMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-xl z-30 py-2">
                    {CHAT_FILTERS.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setChatFilter(option);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-white/5 ${chatFilter === option ? 'font-bold text-white' : 'text-text-muted'}`}
                      >
                        {option === 'all' ? 'All' : option === 'unread' ? 'Unread' : 'Direct'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                ref={newMessageButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[New Message] Button clicked, opening modal');
                  setIsNewMessageOpen(true);
                }}
                className="relative z-50 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white transition-colors hover:bg-white/10"
                aria-label="New Message"
                type="button"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 bg-black px-4 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-full border-2 border-orange-500 bg-black py-3 pl-12 pr-12 text-white outline-none transition-colors placeholder:text-text-muted focus:border-orange-400"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative mt-4 flex rounded-full border border-white/10 bg-white/5 p-1">
            <div
              className={`absolute inset-y-1 left-1 w-1/2 rounded-full bg-orange-500 transition-transform duration-300 ease-out ${activeInboxTab === 'conversations' ? 'translate-x-0' : 'translate-x-full'}`}
            />
            <button
              onClick={() => setActiveInboxTab('conversations')}
              className={`relative z-10 flex-1 rounded-full py-2 text-[14px] font-bold transition-colors ${activeInboxTab === 'conversations' ? 'text-white' : 'text-text-muted'}`}
            >
              Conversations
            </button>
            <button
              onClick={() => setActiveInboxTab('messages')}
              className={`relative z-10 flex-1 rounded-full py-2 text-[14px] font-bold transition-colors ${activeInboxTab === 'messages' ? 'text-white' : 'text-text-muted'}`}
            >
              Messages
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-black">
          {searchQuery.trim().length > 0 ? (
            activeInboxTab === 'conversations' ? (
              conversationResults.length > 0 ? (
                conversationResults.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full border-b border-white/5 px-4 py-4 text-left transition-colors ${activeThreadId === thread.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex gap-3">
                      <img src={thread.participant.avatar} alt={resolveDisplayName(thread.participant.name, thread.participant.handle)} className="w-12 h-12 rounded-full object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-bold text-white">{highlightMatches(resolveDisplayName(thread.participant.name, thread.participant.handle), searchQuery)}</p>
                          <p className="whitespace-nowrap text-xs text-text-muted">{thread.lastMessage?.timestamp ?? thread.updatedAt}</p>
                        </div>
                        <p className={`mt-1 truncate text-sm ${thread.unreadCount > 0 ? 'font-bold text-white' : 'text-text-muted'}`}>
                          {thread.lastMessage?.content ? highlightMatches(thread.lastMessage.content, searchQuery) : 'No messages yet.'}
                        </p>
                      </div>
                      {thread.unreadCount > 0 && (
                        <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-orange-500 self-center flex-shrink-0"></div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-text-muted">No matching conversations found.</div>
              )
            ) : isSearchingMessages ? (
              <div className="p-8 text-center text-text-muted">Searching messages...</div>
            ) : messageResults.length > 0 ? (
              messageResults.map((result) => (
                <button
                  key={result.message.id}
                  onClick={() => handleSelectMessageResult(result)}
                  className="w-full border-b border-white/5 px-4 py-4 text-left transition-colors hover:bg-white/5"
                >
                  <div className="flex gap-3">
                    <img src={result.thread.participant.avatar} alt={result.thread.participant.name} className="w-12 h-12 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-bold text-white">{highlightMatches(result.thread.participant.name, searchQuery)}</p>
                        <p className="whitespace-nowrap text-xs text-text-muted">{result.message.timestamp}</p>
                      </div>
                      <p className="mt-1 truncate text-sm text-text-muted">{highlightMatches(result.message.content, searchQuery)}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted">No matching messages found.</div>
            )
          ) : activeInboxTab === 'conversations' ? (
            isLoadingThreads ? (
              <div className="p-8 text-center text-text-muted">Loading conversations...</div>
            ) : conversationResults.length > 0 ? (
              conversationResults.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full border-b border-white/5 px-4 py-4 text-left transition-colors ${activeThreadId === thread.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                >
                  <div className="flex gap-3">
                    <img src={thread.participant.avatar} alt={resolveDisplayName(thread.participant.name, thread.participant.handle)} className="w-12 h-12 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-bold text-white">{resolveDisplayName(thread.participant.name, thread.participant.handle)}</p>
                        <p className="whitespace-nowrap text-xs text-text-muted">{thread.lastMessage?.timestamp ?? thread.updatedAt}</p>
                      </div>
                      <p className={`mt-1 truncate text-sm ${thread.unreadCount > 0 ? 'font-bold text-white' : 'text-text-muted'}`}>
                        {thread.lastMessage?.content ?? 'No messages yet.'}
                      </p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 self-center">
                        <span className="text-xs font-bold text-black">{thread.unreadCount}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted">No conversations yet.</div>
            )
          ) : (
            <div className="p-8 text-center text-text-muted">Type in Search to find messages.</div>
          )}
        </div>
      </section>

      {isNewMessageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onMouseDown={(e) => {
          // Only close if clicking directly on overlay, not on modal or children
          if (e.target === e.currentTarget) {
            console.log('[Modal] Clicked outside, closing');
            setIsNewMessageOpen(false);
          }
        }}>
          <div ref={newMessageMenuRef} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl z-50" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">New Message</h2>
                <p className="text-sm text-text-muted">Search for a person to start a conversation.</p>
              </div>
              <button onClick={() => {
                console.log('[New Message] Close button clicked');
                setIsNewMessageOpen(false);
              }} className="rounded-full p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-white" type="button">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={newMessageQuery}
                onChange={(event) => setNewMessageQuery(event.target.value)}
                placeholder="Search people"
                className="w-full rounded-full border border-white/10 bg-black py-3 pl-12 pr-4 text-white outline-none placeholder:text-text-muted focus:border-orange-500"
              />
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {newMessageResults.length > 0 ? (
                newMessageResults.map((user) => {
                  const unreadCount = getUnreadCountForUser(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        console.log('[New Message] Starting conversation with:', user.id, user.username);
                        void startConversation(user.id);
                      }}
                      disabled={isStartingConversation}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left transition-colors hover:bg-white/5 disabled:opacity-50"
                    >
                      <div className="relative">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={resolveDisplayName(user.displayName, user.username)} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-bold text-white">
                            {resolveDisplayName(user.displayName, user.username).charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500"></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-white">{resolveDisplayName(user.displayName, user.username)}</div>
                        <div className="truncate text-sm text-text-muted">@{user.username}</div>
                      </div>
                      <Plus className="w-4 h-4 text-text-muted" />
                    </button>
                  );
                })
              ) : newMessageQuery.trim().length > 0 ? (
                <div className="py-6 text-center text-text-muted">No people found.</div>
              ) : (
                <div className="py-6 text-center text-text-muted">No users to chat with. Follow someone first!</div>
              )}
            </div>
          </div>
        </div>
      )}

      <section className={`chat-panel flex-1 min-w-0 flex-col h-screen relative ${activeThread ? 'flex' : 'hidden md:flex'} bg-black text-white ${isDarkChat ? 'chat-dark' : ''}`}>
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-red-500 text-white px-4 py-2 text-sm shadow-lg">
            {errorMessage}
          </div>
        )}

        {activeThread ? (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/95 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <button className="md:hidden -ml-2 rounded-full p-2 hover:bg-white/10" onClick={() => setActiveThreadId(null)}>
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

            <div className="flex-1 overflow-y-auto bg-black p-4">
              {isLoadingMessages ? (
                <div className="text-center text-text-muted py-10">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-text-muted py-10">Say hello to start the conversation.</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    ref={(element) => {
                      messageRefs.current[message.id] = element;
                    }}
                    className={`flex gap-3 max-w-[80%] ${selectedMessageId === message.id ? 'rounded-2xl ring-2 ring-orange-500 ring-offset-2 ring-offset-black' : ''} ${isSelfMessage(message) ? 'self-end flex-row-reverse' : ''}`}
                  >
                    {resolveMessageSenderAvatar(message) ? (
                      <img src={resolveMessageSenderAvatar(message)} alt={resolveMessageSenderName(message)} className="w-8 h-8 rounded-full object-cover self-end" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center self-end text-[11px] font-bold text-white">
                        {resolveMessageSenderName(message).charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className={`text-xs text-text-muted mb-1 ${isSelfMessage(message) ? 'text-right' : ''}`}>{resolveMessageSenderName(message)}</div>
                      <div className={`rounded-2xl overflow-hidden ${isSelfMessage(message) ? 'bg-orange-500 text-black rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                        {message.mediaUrl && (
                          <img src={message.mediaUrl} alt="media" className="max-w-[240px] block object-cover" />
                        )}
                        {message.content && <p className="whitespace-pre-wrap break-words px-3 py-2">{message.content}</p>}
                        {!message.content && !message.mediaUrl && <p className="px-3 py-2 opacity-50 text-sm italic">empty</p>}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isSelfMessage(message) ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-text-muted">{message.timestamp}</span>
                        {isSelfMessage(message) && (message.isRead ? <CheckCheck className="w-3 h-3 text-orange-500" /> : <Check className="w-3 h-3 text-text-muted" />)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-black relative">
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-full right-4 mb-2 w-64 rounded-2xl border border-white/10 bg-[#0d0d0d] p-3 shadow-lg z-20">
                  <div className="mb-2 px-1 text-sm font-bold text-text-muted">Popular Emojis</div>
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
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                  >
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
              )}
              <div className="flex items-center rounded-2xl bg-white/5 p-2">
                <button
                  className="rounded-full p-2 text-orange-500 transition-colors hover:bg-orange-500/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Send a message"
                  className="flex-1 bg-transparent border-none px-2 outline-none text-white placeholder:text-text-muted"
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
                  className={`ml-1 rounded-full p-2 transition-colors ${(messageText.trim() || mediaFile) ? 'text-orange-500 hover:bg-orange-500/10' : 'cursor-not-allowed text-orange-500/50'}`}
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