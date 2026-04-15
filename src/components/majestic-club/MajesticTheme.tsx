import React, { createContext, useContext, useEffect, useState } from 'react';

interface MajesticThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const MajesticThemeContext = createContext<MajesticThemeContextType | undefined>(undefined);

export const useMajesticTheme = () => {
  const context = useContext(MajesticThemeContext);
  if (!context) {
    throw new Error('useMajesticTheme must be used within MajesticThemeProvider');
  }
  return context;
};

export const MajesticThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Apply majestic theme colors
    const root = document.documentElement;
    
    if (isDark) {
      root.style.setProperty('--majestic-bg', '#0A192F');
      root.style.setProperty('--majestic-surface', '#132F4C');
      root.style.setProperty('--majestic-border', '#1E3A5F');
      root.style.setProperty('--majestic-accent', '#D4AF37');
      root.style.setProperty('--majestic-accent-hover', '#B8941F');
      root.style.setProperty('--majestic-text', '#F5F5F5');
      root.style.setProperty('--majestic-text-muted', '#8892B0');
      root.style.setProperty('--majestic-gold', '#D4AF37');
      root.style.setProperty('--majestic-gold-light', '#F4E4C1');
      root.style.setProperty('--majestic-gold-dark', '#B8941F');
    } else {
      root.style.setProperty('--majestic-bg', '#F5F5F5');
      root.style.setProperty('--majestic-surface', '#FFFFFF');
      root.style.setProperty('--majestic-border', '#E0E0E0');
      root.style.setProperty('--majestic-accent', '#D4AF37');
      root.style.setProperty('--majestic-accent-hover', '#B8941F');
      root.style.setProperty('--majestic-text', '#0A192F');
      root.style.setProperty('--majestic-text-muted', '#64748B');
      root.style.setProperty('--majestic-gold', '#D4AF37');
      root.style.setProperty('--majestic-gold-light', '#F4E4C1');
      root.style.setProperty('--majestic-gold-dark', '#B8941F');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <MajesticThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </MajesticThemeContext.Provider>
  );
};
