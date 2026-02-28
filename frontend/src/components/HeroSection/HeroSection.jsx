import React from 'react';
import heroBanner from '../../assets/img/cat.png';

export default function HeroSection() {
  return (
    <div className="content">
      <img
        src={heroBanner}
        alt="Hero Banner"
        className="hero-banner-image"
      />
      <h1 className="title">Yuumi.gg</h1>
    </div>
  );
}
