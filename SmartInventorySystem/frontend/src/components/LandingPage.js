import React, { useState, useEffect } from 'react';

function LandingPage({ onEnter }) {
  const [showContent, setShowContent] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start animations after component mounts
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    setFadeOut(true);
    setTimeout(() => {
      onEnter();
    }, 800);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center relative overflow-hidden ${fadeOut ? 'fade-out' : ''}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-secondary-400/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-40 w-20 h-20 bg-accent-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Main content */}
      <div className={`text-center text-white z-10 transition-all duration-1000 ${showContent ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
        {/* Logo/Icon */}
        <div className={`text-8xl mb-8 transition-all duration-1000 ${showContent ? 'animate-bounce' : ''}`}>
          🏪
        </div>

        {/* Welcome message */}
        <h1 className={`text-6xl font-bold mb-4 transition-all duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
          Welcome to
        </h1>
        <h2 className={`text-4xl font-semibold mb-2 transition-all duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ animationDelay: '0.7s' }}>
          Smart Shop Management
        </h2>
        <p className={`text-xl mb-8 text-primary-100 transition-all duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ animationDelay: '0.9s' }}>
          Intelligent Inventory Management & Billing Solution
        </p>

        {/* Feature highlights */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto transition-all duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ animationDelay: '1.1s' }}>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-lg font-semibold mb-2">Inventory Control</h3>
            <p className="text-sm text-primary-100">Manage your products with ease</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-lg font-semibold mb-2">Smart Billing</h3>
            <p className="text-sm text-primary-100">Quick checkout with barcode scanning</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">Analytics & Reports</h3>
            <p className="text-sm text-primary-100">Track your business performance</p>
          </div>
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          className={`bg-white text-primary-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-50 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl transform ${showContent ? 'opacity-100' : 'opacity-0'}`}
          style={{ animationDelay: '1.3s' }}
        >
          🚀 Enter Dashboard
        </button>

        {/* Footer */}
        <p className={`text-sm text-primary-200 mt-8 transition-all duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ animationDelay: '1.5s' }}>
          •it's my Major Project •
        </p>
      </div>

      {/* Custom CSS for fade-out animation */}
      <style jsx>{`
        .fade-out {
          animation: fadeOut 0.8s ease-out forwards;
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
