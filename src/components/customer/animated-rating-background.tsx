'use client';

import React, { useEffect, useState } from 'react';
import styles from './animated-rating-background.module.css';

interface AnimatedRatingBackgroundProps {
  currentRating: number;
}

export const AnimatedRatingBackground: React.FC<AnimatedRatingBackgroundProps> = ({
  currentRating,
}) => {
  const [burstKey, setBurstKey] = useState<number | null>(null);

  // Trigger brief sparkle burst when rating changes
  useEffect(() => {
    if (currentRating > 0) {
      setBurstKey(Date.now());
      const timer = setTimeout(() => setBurstKey(null), 800);
      return () => clearTimeout(timer);
    }
  }, [currentRating]);

  // Fixed deterministic particles to guarantee hydration stability
  const particles = [
    { id: 1, top: '15%', left: '10%', size: 4, delay: '0s' },
    { id: 2, top: '25%', left: '85%', size: 5, delay: '1.2s' },
    { id: 3, top: '70%', left: '18%', size: 3, delay: '2.4s' },
    { id: 4, top: '75%', left: '80%', size: 4, delay: '0.6s' },
    { id: 5, top: '45%', left: '6%', size: 3, delay: '1.8s' },
    { id: 6, top: '50%', left: '92%', size: 4, delay: '3s' },
  ];

  const sparkles = [
    { id: 1, top: '18%', left: '22%', size: 10, delay: '0.4s' },
    { id: 2, top: '30%', left: '74%', size: 12, delay: '2.1s' },
    { id: 3, top: '65%', left: '32%', size: 9, delay: '1.5s' },
    { id: 4, top: '60%', left: '68%', size: 11, delay: '3.3s' },
  ];

  return (
    <div className={styles.backgroundContainer} aria-hidden="true">
      <div className={styles.auroraGlow} />

      {/* Floating Ambient Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Delicate Sparkles */}
      {sparkles.map((s) => (
        <svg
          key={s.id}
          className={styles.starSparkle}
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: s.delay,
          }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      ))}

      {/* Active selection burst ring */}
      {burstKey && <div key={burstKey} className={styles.selectionBurst} />}
    </div>
  );
};

export default AnimatedRatingBackground;
