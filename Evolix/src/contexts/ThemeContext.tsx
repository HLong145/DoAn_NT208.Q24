import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  fontSize: string;
  setFontSize: (size: string) => void;
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  backgroundTheme: string;
  setBackgroundTheme: (theme: string) => void;
  chatTheme: string;
  setChatTheme: (theme: string) => void;
  nickname: string;
  setNickname: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('display_fontSize') || 'default');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('display_colorTheme') || 'blue');
  const [backgroundTheme, setBackgroundTheme] = useState(() => localStorage.getItem('display_backgroundTheme') || 'lights-out');
  const [chatTheme, setChatTheme] = useState(() => localStorage.getItem('display_chatTheme') || 'default');
  const [nickname, setNickname] = useState(() => localStorage.getItem('display_nickname') || '');

  useEffect(() => {
    localStorage.setItem('display_fontSize', fontSize);
    localStorage.setItem('display_colorTheme', colorTheme);
    localStorage.setItem('display_backgroundTheme', backgroundTheme);
    localStorage.setItem('display_chatTheme', chatTheme);
    localStorage.setItem('display_nickname', nickname);

    const root = document.documentElement;
    
    // Apply background theme
    root.classList.remove('theme-dim', 'theme-lights-out');
    if (backgroundTheme !== 'default') {
      root.classList.add(`theme-${backgroundTheme}`);
    }

    // Apply color theme
    root.classList.remove('color-yellow', 'color-pink', 'color-purple', 'color-orange', 'color-green');
    if (colorTheme !== 'blue') {
      root.classList.add(`color-${colorTheme}`);
    }

    // Also set CSS variables directly so components using var(--color-primary)
    // update immediately and reliably.
    const colorMap: Record<string, { primary: string; hover: string }> = {
      blue: { primary: '#1d9bf0', hover: '#1a8cd8' },
      yellow: { primary: '#ffd400', hover: '#e5be00' },
      pink: { primary: '#f91880', hover: '#e01673' },
      purple: { primary: '#7856ff', hover: '#6c4de6' },
      orange: { primary: '#ff7a00', hover: '#e66e00' },
      green: { primary: '#00ba7c', hover: '#00a76f' },
    };
    const selected = colorMap[colorTheme] || colorMap.blue;
    root.style.setProperty('--color-primary', selected.primary);
    root.style.setProperty('--color-primary-hover', selected.hover);

    // Do not change root font-size to avoid scaling layout frames.
    // Instead expose a CSS variable for components to use for text sizing.
    const sizeMap: Record<string, string> = {
      'small': '14px',
      'default': '16px',
      'large': '18px',
      'xlarge': '20px',
      'xxlarge': '22px'
    };
    root.style.setProperty('--display-font-size', sizeMap[fontSize] || '16px');
  }, [backgroundTheme, colorTheme, fontSize, chatTheme, nickname]);

  return (
    <ThemeContext.Provider value={{ fontSize, setFontSize, colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme, chatTheme, setChatTheme, nickname, setNickname }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
