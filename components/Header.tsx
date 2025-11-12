import React from 'react';

interface HeaderProps {
  onShowAbout: () => void;
  onShowArchive: () => void;
  fontFamily: 'Inter' | 'OpenDyslexic';
  onToggleFont: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowAbout, onShowArchive, fontFamily, onToggleFont }) => {
  return (
    <header className="bg-white shadow-md no-print">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fas fa-graduation-cap text-3xl text-blue-600"></i>
          <h1 className="text-2xl font-bold text-gray-800">MEB Türkçe Soru Üretici</h1>
        </div>
        <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-500 hidden md:block">Yapay Zeka Destekli Müfredat Aracı</p>
            <button 
                onClick={onToggleFont} 
                className={`text-gray-500 hover:text-blue-600 transition-colors ${fontFamily === 'OpenDyslexic' ? 'text-blue-600' : ''}`}
                aria-label="Yazı tipini değiştir"
                title={fontFamily === 'Inter' ? "Disleksi dostu yazı tipine geç" : "Normal yazı tipine geç"}
            >
                <i className="fas fa-font text-2xl"></i>
            </button>
            <button 
                onClick={onShowArchive} 
                className="text-gray-500 hover:text-blue-600 transition-colors"
                aria-label="Sınav arşivini aç"
                title="Sınav arşivini aç"
            >
                <i className="fas fa-archive text-2xl"></i>
            </button>
            <button 
                onClick={onShowAbout} 
                className="text-gray-500 hover:text-blue-600 transition-colors"
                aria-label="Uygulama hakkında bilgi"
                title="Uygulama hakkında bilgi"
            >
                <i className="fas fa-info-circle text-2xl"></i>
            </button>
        </div>
      </div>
    </header>
  );
};