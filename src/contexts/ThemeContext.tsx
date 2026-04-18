import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'blue' | 'green';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('face-attendance-theme') as Theme;
    return savedTheme || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'blue', 'green');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Apply theme-specific styles
    switch (theme) {
      case 'dark':
        root.style.setProperty('--background', '0 0% 3.9%');
        root.style.setProperty('--foreground', '0 0% 98%');
        root.style.setProperty('--primary', '217.2 91.2% 59.8%');
        root.style.setProperty('--primary-foreground', '222.2 84% 4.9%');
        // Toast dark mode colors
        root.style.setProperty('--toast-bg', '#1f2937');
        root.style.setProperty('--toast-text', '#f9fafb');
        root.style.setProperty('--toast-border', '#374151');
        root.style.setProperty('--toast-success-bg', '#064e3b');
        root.style.setProperty('--toast-error-bg', '#7f1d1d');
        break;
      case 'blue':
        root.style.setProperty('--background', '210 40% 98%');
        root.style.setProperty('--foreground', '222.2 84% 4.9%');
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        break;
      case 'green':
        root.style.setProperty('--background', '120 40% 98%');
        root.style.setProperty('--foreground', '120 10% 9%');
        root.style.setProperty('--primary', '142.1 76.2% 36.3%');
        root.style.setProperty('--primary-foreground', '355.7 100% 97.3%');
        break;
      default: // light
        root.style.setProperty('--background', '0 0% 100%');
        root.style.setProperty('--foreground', '222.2 84% 4.9%');
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        break;
    }
    
    // Save to localStorage
    localStorage.setItem('face-attendance-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'blue', 'green'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
