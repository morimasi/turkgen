import React from 'react';

interface HeaderProps {
  onShowAbout: () => void;
  onShowArchive: () => void;
  fontFamily: 'Inter' | 'Atkinson Hyperlegible';
  onToggleFont: () => void;
}

const Logo: React.FC = () => (
    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 shadow-md">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 16.5v-11A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 1 4 14.5v-5z" fill="white" opacity="0.3"></path>
            <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7.5A2.5 2.5 0 0 1 5 15.5V4.5z" fill="white"></path>
            <path d="M12.5 7.5L11.25 10.5L8 11.25L11.25 12L12.5 15L13.75 12L17 11.25L13.75 10.5L12.5 7.5Z" fill="#1d4ed8"></path>
        </svg>
    </div>
);


export const Header: React.FC<HeaderProps> = ({ onShowAbout, onShowArchive, fontFamily, onToggleFont }) => {
  return (
    <header className="bg-white shadow-md no-print">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Logo />
          <h1 className="text-2xl font-bold text-gray-800">TurkGen</h1>
        </div>
        <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-500 hidden md:block">Yapay Zeka Destekli Türkçe Soru Üretici</p>
            <button 
                onClick={onToggleFont} 
                className={`text-gray-500 hover:text-blue-600 transition-colors ${fontFamily === 'Atkinson Hyperlegible' ? 'text-blue-600' : ''}`}
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
