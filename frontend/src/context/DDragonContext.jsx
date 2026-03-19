import React, { createContext, useContext, useState, useEffect } from 'react';

const DDragonContext = createContext('16.3.1');

export function DDragonProvider({ children }) {
  const [version, setVersion] = useState('16.3.1');

  useEffect(() => {
    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      .then(res => res.json())
      .then(versions => setVersion(versions[0]))
      .catch(() => console.warn('Failed to fetch DDragon version, using fallback')); 
  }, []);

  return (
    <DDragonContext.Provider value={version}>
      {children}
    </DDragonContext.Provider>
  );
}

export function useDDragon() {
  return useContext(DDragonContext);
}
