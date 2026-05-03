import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail, User, Users, PenSquare, MoreHorizontal, Settings, Monitor, X, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getCurrentUser, type AuthUser } from '../services/authApi';
import { getUserProfile } from '../services/usersApi';

export default function Layout() {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isMessagesRoute = location.pathname.startsWith('/messages');

  const { fontSize, setFontSize, colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme } = useTheme();
  const navTextClass = `${isMessagesRoute ? 'hidden' : 'hidden xl:block'} leading-7 tracking-tight`;
  const navTextStyle = { fontSize: 'calc(var(--display-font-size, 16px) * 1.25)' };
  const postTextStyle = { fontSize: 'calc(var(--display-font-size, 16px) * 1.06)' };
  const navLinkClass = (isActive: boolean) =>
    `group flex items-center justify-center ${isMessagesRoute ? '' : 'xl:justify-start'} gap-4 px-3 py-2.5 rounded-full hover:bg-border/50 transition-colors w-fit ${isMessagesRoute ? '' : 'xl:w-full'} ${isActive ? 'font-bold' : ''}`;
  const sidebarClass = isMessagesRoute
    ? 'app-sidebar w-[88px] xl:w-[88px] flex-shrink-0 border-r border-border h-screen sticky top-0 flex flex-col justify-between pb-6 pt-2 px-2 z-20 bg-bg-base'
    : 'app-sidebar w-[88px] xl:w-[275px] flex-shrink-0 border-r border-border h-screen sticky top-0 flex flex-col justify-between pb-6 pt-2 px-2 xl:px-6 z-20 bg-bg-base';
  const accountMenuPositionClass = isMessagesRoute
    ? 'left-full ml-3 bottom-0'
    : 'right-0 bottom-full mb-3';
  const sizeMap: Record<string, string> = {
    small: '14px',
    default: '16px',
    large: '18px',
    xlarge: '20px',
    xxlarge: '22px'
  };
  const previewFontSize = sizeMap[fontSize] || '16px';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDisplayClick = () => {
    setIsMoreMenuOpen(false);
    setIsDisplayModalOpen(true);
  };

  const toggleAccountMenu = () => {
    setIsAccountMenuOpen((s) => !s);
    setIsMoreMenuOpen(false);
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await getCurrentUser();
        if (!mounted) return;
        setCurrentUser(res.user);
        try {
          const profile = await getUserProfile(res.user.handle);
          if (!mounted) return;
          setCurrentUserAvatar(profile.user.avatarUrl ?? undefined);
        } catch {
          // ignore
        }
      } catch (err) {
        setCurrentUser(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const userHandle = currentUser ? `@${currentUser.handle}` : '@janedoe';
  const displayName = currentUser?.name ?? 'Jane Doe';

  return (
    <div className={`${isMessagesRoute ? 'w-full max-w-none' : 'mx-auto w-full max-w-[1265px]'} flex min-h-screen relative`}>
      {/* Left Sidebar */}
      <header className={sidebarClass}>
        <div className={`flex flex-col items-center ${isMessagesRoute ? '' : 'xl:items-start'} gap-2`}>
          {/* Logo */}
          <NavLink
            to="/"
            aria-label="Home"
            onClick={() => {
              setIsMoreMenuOpen(false);
              setIsAccountMenuOpen(false);
            }}
            className={`w-12 h-12 flex items-center justify-center ${isMessagesRoute ? '' : 'xl:justify-start xl:w-full xl:px-3'} rounded-full hover:bg-border/50 transition-colors mb-2`}
          >
            <span className="text-[34px] font-semibold leading-none tracking-tight">E</span>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 w-full">
            <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
              <Home className="w-7 h-7" strokeWidth={2.2} />
              <span className={navTextClass} style={navTextStyle}>Home</span>
            </NavLink>
            <NavLink to="/explore" className={({ isActive }) => navLinkClass(isActive)}>
              <Search className="w-7 h-7" strokeWidth={2.2} />
              <span className={navTextClass} style={navTextStyle}>Explore</span>
            </NavLink>
            <NavLink to="/notifications" className={({ isActive }) => navLinkClass(isActive)}>
              <div className="relative">
                <Bell className="w-7 h-7" strokeWidth={2.2} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#ff3b30] rounded-full border-2 border-bg-base"></span>
              </div>
              <span className={navTextClass} style={navTextStyle}>Notifications</span>
            </NavLink>
            <NavLink to="/follow" className={({ isActive }) => navLinkClass(isActive)}>
              <Users className="w-7 h-7" strokeWidth={2.2} />
              <span className={navTextClass} style={navTextStyle}>Follow</span>
            </NavLink>
            <NavLink to="/messages" className={({ isActive }) => navLinkClass(isActive)}>
              <Mail className="w-7 h-7" strokeWidth={2.2} />
              <span className={navTextClass} style={navTextStyle}>Chat</span>
            </NavLink>
            <NavLink to="/profile/janedoe" className={({ isActive }) => navLinkClass(isActive)}>
              <User className="w-7 h-7" strokeWidth={2.2} />
              <span className={navTextClass} style={navTextStyle}>Profile</span>
            </NavLink>
            
            {/* More Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button 
                onClick={() => {
                  setIsMoreMenuOpen(!isMoreMenuOpen);
                  setIsAccountMenuOpen(false);
                }}
                className={`group flex items-center justify-center ${isMessagesRoute ? '' : 'xl:justify-start'} gap-4 px-3 py-2.5 rounded-full hover:bg-border/50 transition-colors w-fit ${isMessagesRoute ? '' : 'xl:w-full'}`}
              >
                <MoreHorizontal className="w-7 h-7" strokeWidth={2.2} />
                <span className={navTextClass} style={navTextStyle}>More</span>
              </button>

              {isMoreMenuOpen && (
                <div className="absolute left-0 xl:left-0 top-full xl:top-auto xl:bottom-full mt-2 xl:mt-0 xl:mb-2 w-56 bg-bg-panel rounded-xl shadow-lg border border-border overflow-hidden z-50 py-2">
                  <NavLink to="/settings" onClick={() => setIsMoreMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-border/30 transition-colors w-full text-left font-bold">
                    <Settings className="w-5 h-5" />
                    Settings and privacy
                  </NavLink>
                  <button onClick={handleDisplayClick} className="flex items-center gap-3 px-4 py-3 hover:bg-border/30 transition-colors w-full text-left font-bold">
                    <Monitor className="w-5 h-5" />
                    Display
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Compose Button */}
          <NavLink to="/post" className={`mt-3 ${isMessagesRoute ? 'w-12 h-12' : 'w-12 h-12 xl:w-[90%] xl:h-[52px]'} bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors shadow-sm`}>
            <PenSquare className={`w-6 h-6 ${isMessagesRoute ? '' : 'xl:hidden'}`} />
            <span className={`${isMessagesRoute ? 'hidden' : 'hidden xl:block'} font-bold tracking-tight`} style={postTextStyle}>Post</span>
          </NavLink>
        </div>

        {/* User Profile Mini */}
        <div className="relative w-full mt-auto" ref={accountMenuRef}>
          <div className={`flex items-center ${isMessagesRoute ? 'justify-center' : 'justify-center xl:justify-between'} p-3 rounded-full hover:bg-border/50 transition-colors w-full`}>
            <div className="flex items-center gap-3">
              {isMessagesRoute ? (
                <button
                  type="button"
                  aria-label="Account options"
                  onClick={toggleAccountMenu}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {currentUserAvatar ? (
                    <img src={currentUserAvatar} alt="User" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}</div>
                  )}
                </button>
              ) : (
                currentUserAvatar ? (
                  <img src={currentUserAvatar} alt="User" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}</div>
                )
              )}
              <div className={`${isMessagesRoute ? 'hidden' : 'hidden xl:flex'} flex-col items-start`}>
                <span className="font-bold text-sm leading-tight">{displayName}</span>
                <span className="text-text-muted text-sm leading-tight">{userHandle}</span>
              </div>
            </div>
            {!isMessagesRoute && (
              <button
                type="button"
                aria-label="Account options"
                onClick={toggleAccountMenu}
                className="hidden xl:flex items-center justify-center w-9 h-9 rounded-full hover:bg-border/50 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-text-muted" />
              </button>
            )}
          </div>

          {isAccountMenuOpen && (
            <div className={`absolute ${accountMenuPositionClass} w-[310px] bg-bg-panel border border-border rounded-2xl shadow-[0_0_18px_rgba(255,255,255,0.18)] z-50 overflow-hidden py-2`}>
              <NavLink
                to="/add-account"
                onClick={() => setIsAccountMenuOpen(false)}
                className="block w-full text-left px-5 py-4 text-[17px] font-bold tracking-[-0.01em] hover:bg-border/30 transition-colors"
              >
                Add an existing account
              </NavLink>
              <NavLink
                to="/logout"
                onClick={() => setIsAccountMenuOpen(false)}
                className="block w-full text-left px-5 py-4 text-[17px] font-bold tracking-[-0.01em] hover:bg-border/30 transition-colors"
              >
                Log out {userHandle}
              </NavLink>
              {!isMessagesRoute && (
                <div className="absolute right-11 -bottom-2 w-4 h-4 bg-bg-panel border-r border-b border-border rotate-45"></div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex" style={{ fontSize: `var(--display-font-size, 16px)` }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-bg-base/90 backdrop-blur-md border-t border-border flex justify-around items-center h-16 z-50 px-2 pb-safe">
        <NavLink to="/" className={({ isActive }) => `p-3 rounded-full transition-colors ${isActive ? 'text-text-base' : 'text-text-muted hover:bg-border/50'}`}>
          <Home className="w-6 h-6" strokeWidth={2.5} />
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `p-3 rounded-full transition-colors ${isActive ? 'text-text-base' : 'text-text-muted hover:bg-border/50'}`}>
          <Search className="w-6 h-6" strokeWidth={2.5} />
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `relative p-3 rounded-full transition-colors ${isActive ? 'text-text-base' : 'text-text-muted hover:bg-border/50'}`}>
          <Bell className="w-6 h-6" strokeWidth={2.5} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff3b30] rounded-full border-2 border-bg-base"></span>
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => `p-3 rounded-full transition-colors ${isActive ? 'text-text-base' : 'text-text-muted hover:bg-border/50'}`}>
          <Mail className="w-6 h-6" strokeWidth={2.5} />
        </NavLink>
      </nav>

      {/* Display Settings Modal */}
      {isDisplayModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-panel rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative">
            <button
              onClick={() => setIsDisplayModalOpen(false)}
              aria-label="Close display settings"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-border/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Customize your view</h2>
              <p className="text-text-muted text-[15px] mb-8">
                These settings affect all the accounts on this browser.
              </p>

              {/* Preview Tweet */}
              <div className="border border-border rounded-xl p-4 mb-8 text-left" style={{ fontSize: previewFontSize }}>
                <div className="flex gap-3">
                  {currentUserAvatar ? (
                    <img src={currentUserAvatar} alt="User" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-border/50 flex items-center justify-center font-bold text-text-base">{currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}</div>
                  )}
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{displayName}</span>
                      <span className="text-text-muted">{userHandle}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-text-muted">14m</span>
                    </div>
                    <p className="mt-1">
                      At the heart of everything, we're building a platform that empowers people to connect, share, and discover. What are you building today?
                    </p>
                  </div>
                </div>
              </div>

              {/* Font Size */}
              <div className="mb-8">
                <h3 className="text-[15px] font-bold text-text-muted text-left mb-4">Font size</h3>
                <div className="bg-bg-base rounded-2xl p-4 flex items-center justify-between gap-4">
                  <span className="text-xs">Aa</span>
                  <div className="flex-1 relative h-1 bg-border rounded-full flex items-center justify-between">
                    <div className="absolute left-0 h-full bg-primary rounded-full" style={{ width: `${['small', 'default', 'large', 'xlarge', 'xxlarge'].indexOf(fontSize) * 25}%` }}></div>
                    {['small', 'default', 'large', 'xlarge', 'xxlarge'].map((size, index) => {
                      const currentIndex = ['small', 'default', 'large', 'xlarge', 'xxlarge'].indexOf(fontSize);
                      return (
                        <button 
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={`w-4 h-4 rounded-full z-10 transition-all ${index <= currentIndex ? 'bg-primary' : 'bg-border'} ${index === currentIndex ? 'ring-4 ring-primary/20' : ''}`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xl">Aa</span>
                </div>
              </div>

              {/* Color */}
              <div className="mb-8">
                <h3 className="text-[15px] font-bold text-text-muted text-left mb-4">Color</h3>
                <div className="bg-bg-base rounded-2xl p-4 flex items-center justify-around">
                  {[
                    { id: 'blue', color: '#1d9bf0' },
                    { id: 'yellow', color: '#ffd400' },
                    { id: 'pink', color: '#f91880' },
                    { id: 'purple', color: '#7856ff' },
                    { id: 'orange', color: '#ff7a00' },
                    { id: 'green', color: '#00ba7c' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setColorTheme(theme.id)}
                      className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: theme.color }}
                    >
                      {colorTheme === theme.id && <Check className="w-6 h-6 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div className="mb-8">
                <h3 className="text-[15px] font-bold text-text-muted text-left mb-4">Background</h3>
                <div className="bg-bg-base rounded-2xl p-4 grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => setBackgroundTheme('default')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-md border-2 font-bold bg-bg-base ${backgroundTheme === 'default' ? 'border-primary text-text-base' : 'border-border text-text-base'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${backgroundTheme === 'default' ? 'border-primary' : 'border-border'}`}>
                      {backgroundTheme === 'default' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    Light mode
                  </button>
                  <button 
                    onClick={() => setBackgroundTheme('dim')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-md border-2 font-bold ${backgroundTheme === 'dim' ? 'border-primary text-white' : 'border-transparent text-white'}`}
                    style={{ backgroundColor: '#15202b' }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${backgroundTheme === 'dim' ? 'border-primary' : 'border-[#5c6e7e]'}`}>
                      {backgroundTheme === 'dim' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    Dim
                  </button>
                  <button 
                    onClick={() => setBackgroundTheme('lights-out')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-md border-2 font-bold ${backgroundTheme === 'lights-out' ? 'border-primary text-white' : 'border-transparent text-white'}`}
                    style={{ backgroundColor: '#000000' }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${backgroundTheme === 'lights-out' ? 'border-primary' : 'border-[#333639]'}`}>
                      {backgroundTheme === 'lights-out' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    Dark mode
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setIsDisplayModalOpen(false)}
                className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary-hover transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
