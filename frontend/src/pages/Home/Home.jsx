import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { Navbar, HeroSection, SearchBar, RegionButtons } from '../../components';

export default function Home() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.fontFamily = "'Lexend', sans-serif";
    return () => {
      document.body.style.fontFamily = '';
    };
  }, []);

  const handleSearch = () => {
    if (!summonerName || !summonerTag) return;
    navigate(`/profile/${encodeURIComponent(region)}/${encodeURIComponent(summonerName)}-${encodeURIComponent(summonerTag)}/overview`);
  };

  return (
    <div className="home-container">
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 70 }}>
        <HeroSection />
        <SearchBar
          summonerName={summonerName}
          setSummonerName={setSummonerName}
          summonerTag={summonerTag}
          setSummonerTag={setSummonerTag}
          handleSearch={handleSearch}
        />
        <RegionButtons
          region={region}
          setRegion={setRegion}
        />
      </div>
    </div>
  );
}
