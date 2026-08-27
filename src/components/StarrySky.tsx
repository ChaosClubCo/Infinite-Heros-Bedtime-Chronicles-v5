import React, { useMemo } from 'react';

export const StarrySky: React.FC = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.7 + 0.3,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Deep cosmic gradient background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030314] via-[#080829] to-[#040417]" />
      
      {/* Nebula ambient glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl" />

      {/* Twinkling star field */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            opacity: star.opacity,
            boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
          }}
        />
      ))}
    </div>
  );
};
