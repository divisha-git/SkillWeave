import { useState, useEffect } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after animation completes
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 5500);

    // Complete and remove after fade out
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 6500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-content">
        {/* KEC Logo */}
        <div className="kec-logo">
          <img src="/kec-2.jpg" alt="KEC Logo" className="logo-image" />
        </div>

        {/* College Name with Opening Sequence Effect */}
        <div className="os-phrases">
          <h2>
            <span className="word1">
              {'KONGU'.split('').map((letter, i) => (
                <span key={i}><span style={{ animationDelay: `${i * 0.1}s` }}>{letter}</span></span>
              ))}
            </span>
            <span className="word2">
              {'ENGINEERING'.split('').map((letter, i) => (
                <span key={i}><span style={{ animationDelay: `${(i + 6) * 0.1}s` }}>{letter}</span></span>
              ))}
            </span>
            <span className="word3">
              {'COLLEGE'.split('').map((letter, i) => (
                <span key={i}><span style={{ animationDelay: `${(i + 18) * 0.1}s` }}>{letter}</span></span>
              ))}
            </span>
          </h2>
        </div>

        {/* Tagline with Opening Sequence Effect */}
        <div className="os-phrases tagline">
          <h3>
            <span className="word1">
              {'TRANSFORM'.split('').map((letter, i) => (
                <span key={i}><span style={{ animationDelay: `${2.5 + i * 0.08}s` }}>{letter}</span></span>
              ))}
            </span>
            <span className="word2">
              {'YOURSELF'.split('').map((letter, i) => (
                <span key={i}><span style={{ animationDelay: `${3.2 + i * 0.08}s` }}>{letter}</span></span>
              ))}
            </span>
          </h3>
        </div>

        {/* Loading indicator */}
        <div className="loading-dots">
          <span style={{ animationDelay: '0ms' }}></span>
          <span style={{ animationDelay: '150ms' }}></span>
          <span style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
