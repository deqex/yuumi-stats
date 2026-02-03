import React, { useEffect } from 'react';
import './Home.css';
import { Navbar, HeroSection, SearchBar, RegionButtons } from '../../components';

export default function Home() {
  useEffect(() => {
    document.body.style.fontFamily = "'Lexend', sans-serif";
    return () => {
      document.body.style.fontFamily = '';
    };
  }, []);

  return (
    <div className="home-container">
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 70 }}>
        <HeroSection />
        <SearchBar />
        <RegionButtons />
      </div>
    </div>
  );
}
