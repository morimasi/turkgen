import React, { useState, useEffect } from 'react';

const messages = [
  "Yapay zeka en uygun kelimeleri seçiyor...",
  "Kazanımlarınız için yaratıcı senaryolar düşünülüyor...",
  "Öğrencileri düşündürecek çeldiriciler hazırlanıyor...",
  "Sorular pedagojik ilkelere göre filtreleniyor...",
  "Gerçek yaşam bağlantıları kuruluyor...",
];

export const LoadingSpinner: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center text-text-secondary p-8 w-full max-w-md mx-auto">
      <div className="relative h-24 w-24">
        {/* Outer spinning ring */}
        <svg className="absolute inset-0 animate-spin-slow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25 text-primary-600" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
        </svg>
        {/* Inner pulsing icon */}
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <i className="fas fa-feather-alt text-4xl text-primary-600"></i>
        </div>
      </div>

      <p className="mt-8 text-xl font-semibold text-text-primary">Sorularınız hazırlanıyor...</p>
      
      {/* Fading text area */}
      <div className="mt-3 h-6">
        <p key={currentMessageIndex} className="text-sm text-text-secondary animate-fade-in-subtle">
            {messages[currentMessageIndex]}
        </p>
      </div>
    </div>
  );
};
