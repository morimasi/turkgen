import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Question, VocabularyWord } from '../types';
import { analyzeVocabulary } from '../services/geminiService';

interface VocabularyWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
}

export const VocabularyWorksheetModal: React.FC<VocabularyWorksheetModalProps> = ({ isOpen, onClose, questions }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const grade = useMemo(() => questions?.[0]?.sinif || 5, [questions]);

  const wordsToAnalyze = useMemo(() => {
    if (!isOpen || !questions) return [];
    const allText = questions.map(q => q.paragraf_metni).filter(Boolean).join(' ');
    // Match words with 4 or more characters, Turkish characters included
    const uniqueWords = [...new Set(allText.toLowerCase().match(/\b[a-zçğıöşü]{4,}\b/g) || [])];
    const stopWords = new Set(['bir', 've', 'ile', 'ama', 'için', 'gibi', 'kadar', 'olan', 'olarak', 'daha', 'çok', 'her', 'bu', 'şu', 'o', 'ise', 'dedi', 'diye', 'yok', 'var', 'ben', 'sen', 'biz', 'siz', 'onlar', 'bunu', 'şunu', 'onu']);
    const filteredWords = uniqueWords.filter(word => !stopWords.has(word));
    // Limit to 20 words to avoid long API calls and large worksheets
    return filteredWords.slice(0, 20); 
  }, [isOpen, questions]);

  useEffect(() => {
    if (isOpen && wordsToAnalyze.length > 0) {
      const fetchVocabulary = async () => {
        setIsLoading(true);
        setError(null);
        setVocabulary(null);
        try {
          const result = await analyzeVocabulary(wordsToAnalyze, grade);
          setVocabulary(result);
        } catch (err: any) {
          setError(err.message || 'Kelime analizi sırasında bir hata oluştu.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchVocabulary();
    }
  }, [isOpen, wordsToAnalyze, grade]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalTitle = document.title;
      document.title = "Kelime Çalışma Kağıdı";
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Kelime Çalışma Kağıdı</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: 'Inter', sans-serif; padding: 2rem; }
                h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; text-align: center; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; }
                th { background-color: #f8fafc; }
                tr { break-inside: avoid; }
            </style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
      printWindow?.close();
      document.title = originalTitle;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center animate-fade-in" onClick={onClose}>
      <div className="bg-surface rounded-xl shadow-2xl p-6 max-w-4xl w-full m-4 flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Kelime Çalışma Kağıdı</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-3xl">&times;</button>
        </div>
        
        <div className="flex-grow overflow-y-auto max-h-[70vh] pr-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
                <i className="fas fa-spinner fa-spin fa-3x mb-4 text-primary-600"></i>
                <p className="font-semibold">Kelimeler analiz ediliyor...</p>
                <p className="text-sm">Bu işlem birkaç saniye sürebilir.</p>
            </div>
          )}
          {error && <div className="text-danger-900 bg-danger-50 p-4 rounded-lg text-center">{error}</div>}
          {vocabulary && vocabulary.length > 0 && (
            <div ref={printRef}>
                <h1 className="text-2xl font-bold text-center mb-6 text-text-primary">Kelime Çalışması</h1>
                <table className="w-full border-collapse">
                    <thead className="bg-worksheet-surface">
                        <tr>
                            <th className="border border-border p-3 font-semibold text-text-primary">Kelime</th>
                            <th className="border border-border p-3 font-semibold text-text-primary">Tanımı</th>
                            <th className="border border-border p-3 font-semibold text-text-primary">Eş Anlamlısı</th>
                            <th className="border border-border p-3 font-semibold text-text-primary">Örnek Cümle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vocabulary.map((v, index) => (
                            <tr key={index} className="bg-surface even:bg-background">
                                <td className="border border-border p-3 font-semibold text-primary-600">{v.kelime}</td>
                                <td className="border border-border p-3 text-text-secondary">{v.tanim}</td>
                                <td className="border border-border p-3 text-text-secondary">{v.es_anlam}</td>
                                <td className="border border-border p-3 text-text-secondary italic">"{v.ornek_cumle}"</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
           {!isLoading && !error && (!vocabulary || vocabulary.length === 0) && (
             <div className="text-center py-10 text-text-secondary">
              <i className="fas fa-file-excel fa-3x mb-4"></i>
              <p>Analiz edilecek uygun kelime bulunamadı.</p>
              <p className="text-sm mt-2">Bu özellik, sorularda paragraf metinleri olduğunda çalışır.</p>
            </div>
           )}
        </div>
         <div className="mt-6 text-right border-t border-border pt-4 flex justify-end items-center gap-4">
            <button onClick={onClose} className="bg-text-secondary text-surface px-5 py-2 rounded-lg hover:opacity-80 transition-colors">
                Kapat
            </button>
            <button onClick={handlePrint} disabled={!vocabulary || vocabulary.length === 0} className="bg-primary-600 text-on-primary px-5 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-primary-300 disabled:cursor-not-allowed flex items-center gap-2">
                <i className="fas fa-print"></i> Yazdır
            </button>
        </div>
      </div>
    </div>
  );
};