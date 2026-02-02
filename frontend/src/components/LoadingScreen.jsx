import { useState, useEffect } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 5000);

    // Complete and remove after fade out animation
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 6000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-content">
        {/* KEC Logo as Text */}
        <div className="kec-logo-text">
          <span className="kec-letter letter-k">K</span>
          <span className="kec-letter letter-e">E</span>
          <span className="kec-letter letter-c">C</span>
        </div>

        {/* College Name with Shimmer */}
        <div className="college-name">
          <h2 className="college-name-text">
            <span className="word blue">KONGU</span>
            <span className="word green">ENGINEERING</span>
            <span className="word blue-light">COLLEGE</span>
          </h2>
        </div>

        {/* Tagline */}
        <div className="tagline-container">
          <div className="tagline-line">
            <span className="tagline-decorator left"></span>
            <p className="tagline-text">Transform Yourself</p>
            <span className="tagline-decorator right"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
