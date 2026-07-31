import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_BANNERS } from '../data/banners.js';

export const BannerCarousel = ({ onSelectCategory }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + HERO_BANNERS.length) % HERO_BANNERS.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % HERO_BANNERS.length);
  };

  const banner = HERO_BANNERS[currentIndex];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-white">
      <div className={`relative w-full min-h-[220px] sm:min-h-[280px] p-6 sm:p-10 flex flex-col justify-center text-left ${banner.bgColor} ${banner.textColor} transition-all duration-300`}>
        
        {/* Background Image overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${banner.image})` }}
        />

        <div className="relative z-10 max-w-xl space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white font-bold text-[11px] uppercase tracking-wider">
            {banner.tag}
          </span>
          
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {banner.title}
          </h2>

          <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-medium">
            {banner.subtitle}
          </p>

          <div className="pt-2">
            <button
              onClick={() => onSelectCategory(banner.categoryTarget)}
              className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-xs hover:bg-slate-100 cursor-pointer"
            >
              {banner.buttonText}
            </button>
          </div>
        </div>

        {/* Carousel Prev & Next Controls */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center cursor-pointer border border-slate-200 shadow-xs z-20"
          title="Previous Banner"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center cursor-pointer border border-slate-200 shadow-xs z-20"
          title="Next Banner"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {HERO_BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};
