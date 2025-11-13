import React, { useState, useEffect, useRef } from 'react';
import type { Theme } from '../types';

interface HeaderProps {
  onShowAbout: () => void;
  onShowArchive: () => void;
  fontFamily: 'Inter' | 'Atkinson Hyperlegible';
  onToggleFont: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Logo: React.FC = () => (
    <div className="logo-container flex items-center justify-center h-10 w-10 rounded-lg bg-primary-600 shadow-md text-on-primary">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
            <g className="logo-book">
                <path className="logo-book-back" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 16.5v-11A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 1 4 14.5v-5z" fill="currentColor" opacity="0.6"></path>
                <path className="logo-book-front" d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7.5A2.5 2.5 0 0 1 5 15.5V4.5z" fill="currentColor"></path>
            </g>
            <path className="logo-spark" d="M12.5 7.5L11.25 10.5L8 11.25L11.25 12L12.5 15L13.75 12L17 11.25L13.75 10.5L12.5 7.5Z" fill="rgb(var(--color-logo-spark))"></path>
        </svg>
    </div>
);

const themes: { name: Theme; label: string; color: string }[] = [
    { name: 'coffee', label: 'Kahve', color: 'bg-yellow-800' },
    { name: 'sky', label: 'Gökyüzü', color: 'bg-sky-500' },
    { name: 'emerald', label: 'Zümrüt', color: 'bg-emerald-500' },
    { name: 'rose', label: 'Gül', color: 'bg-rose-500' },
    { name: 'indigo', label: 'Çivit', color: 'bg-indigo-500' },
    { name: 'slate', label: 'Gri', color: 'bg-slate-500' },
];

const ThemeSwitcher: React.FC<{ currentTheme: Theme; onThemeChange: (theme: Theme) => void }> = ({ currentTheme, onThemeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-text-secondary hover:text-primary-600 transition-colors"
                aria-label="Temayı değiştir"
                title="Temayı değiştir"
            >
                <i className="fas fa-palette text-2xl"></i>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-surface rounded-lg shadow-xl border border-border z-20">
                    <div className="p-2">
                        {themes.map(theme => (
                            <button
                                key={theme.name}
                                onClick={() => { onThemeChange(theme.name); setIsOpen(false); }}
                                className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                    currentTheme === theme.name 
                                    ? 'bg-primary-100 text-primary-700 font-semibold' 
                                    : 'text-text-primary hover:bg-worksheet-surface'
                                }`}
                            >
                                <span className={`w-4 h-4 rounded-full mr-3 ${theme.color}`}></span>
                                {theme.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ onShowAbout, onShowArchive, fontFamily, onToggleFont, theme, setTheme }) => {
  return (
    <header className="bg-surface shadow-md no-print border-b border-border">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Logo />
          <h1 className="text-2xl font-bold text-text-primary">TurkGen</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
            <p className="text-sm text-text-secondary hidden md:block">Yapay Zeka Destekli Türkçe Soru Üretici</p>
            <div className="h-6 w-px bg-border hidden md:block"></div>
            <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} />
            <button 
                onClick={onToggleFont} 
                className={`text-text-secondary hover:text-primary-600 transition-colors ${fontFamily === 'Atkinson Hyperlegible' ? 'text-primary-active' : ''}`}
                aria-label="Yazı tipini değiştir"
                title={fontFamily === 'Inter' ? "Disleksi dostu yazı tipine geç" : "Normal yazı tipine geç"}
            >
                <i className="fas fa-font text-2xl"></i>
            </button>
            <button 
                onClick={onShowArchive} 
                className="text-text-secondary hover:text-primary-600 transition-colors"
                aria-label="Sınav arşivini aç"
                title="Sınav arşivini aç"
            >
                <i className="fas fa-archive text-2xl"></i>
            </button>
            <button 
                onClick={onShowAbout} 
                className="text-text-secondary hover:text-primary-600 transition-colors"
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