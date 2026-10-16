import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children, initialScreen = 'threads' }) {
  const [currentScreen, setCurrentScreen] = useState(initialScreen);

  // Sync with window.location.hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').replace('/', '');
      if (hash && hash !== 'poc') {
        setCurrentScreen(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (screen) => {
    const clean = screen.replace('/', '');
    setCurrentScreen(clean || 'threads');
    window.location.hash = `#${clean || 'threads'}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NavigationContext.Provider value={{ currentScreen, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    return {
      currentScreen: 'threads',
      navigateTo: (to) => {
        const clean = to.replace('/', '');
        window.location.hash = `#${clean || 'threads'}`;
      },
    };
  }
  return context;
}

export function Link({ to, children, className = '', onClick, ...props }) {
  const { navigateTo } = useNavigation();

  const handleClick = (e) => {
    e.preventDefault();
    onClick?.(e);
    navigateTo(to);
  };

  return (
    <a href={`#${to.replace('/', '')}`} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
