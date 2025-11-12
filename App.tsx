import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { QuestionForm } from './components/QuestionForm';
import { QuestionDisplay } from './components/QuestionDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateQuestions } from './services/geminiService';
import type { Question, QuestionGenerationParams } from './types';
import { AboutModal } from './components/AboutModal';
import { ArchiveModal } from './components/ArchiveModal';


const App: React.FC = () => {
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [font, setFont] = useState<'Inter' | 'Atkinson Hyperlegible'>('Inter');

  useEffect(() => {
    const newClass = font === 'Atkinson Hyperlegible' ? 'font-atkinson-hyperlegible' : 'font-inter';
    const oldClass = font === 'Atkinson Hyperlegible' ? 'font-inter' : 'font-atkinson-hyperlegible';
    document.body.classList.remove(oldClass);
    document.body.classList.add(newClass);
  }, [font]);

  const handleGenerateQuestion = useCallback(async (params: QuestionGenerationParams) => {
    setIsLoading(true);
    setError(null);
    setGeneratedQuestions(null);
    try {
      const questions = await generateQuestions(params);
      setGeneratedQuestions(questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadExamFromArchive = (questions: Question[], examName: string) => {
      setGeneratedQuestions(questions);
      setError(null);
      setIsLoading(false);
      setNotification(`"${examName}" adlı sınav başarıyla yüklendi.`);
      setTimeout(() => setNotification(null), 3000); // 3 saniye sonra bildirimi kaldır
  };

  const toggleFont = () => {
    setFont(prevFont => (prevFont === 'Inter' ? 'Atkinson Hyperlegible' : 'Inter'));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header
        onShowAbout={() => setIsAboutModalOpen(true)}
        onShowArchive={() => setIsArchiveModalOpen(true)}
        fontFamily={font}
        onToggleFont={toggleFont}
      />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onLoadExam={handleLoadExamFromArchive}
      />
      <main className="container mx-auto p-4 md:p-8">
        {notification && (
            <div className="fixed top-24 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
                <i className="fas fa-check-circle mr-2"></i>
                {notification}
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Soru Kriterleri Formu - Sol Panel */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-200 no-print">
                <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-4">Soru Kriterleri</h2>
                <QuestionForm onGenerate={handleGenerateQuestion} isLoading={isLoading} />
            </div>
            
            {/* Çalışma Sayfası (Soru Görüntüleme) - Sağ Panel */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col">
                <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-4">Çalışma Sayfası</h2>
                <div className="flex-grow flex items-center justify-center">
                {isLoading && <LoadingSpinner />}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg w-full text-center">{error}</div>}
                {generatedQuestions && generatedQuestions.length > 0 && <QuestionDisplay questions={generatedQuestions} />}
                {!isLoading && !error && (!generatedQuestions || generatedQuestions.length === 0) && (
                    <div className="text-center text-gray-500">
                    <i className="fas fa-file-alt fa-3x mb-4"></i>
                    <p>Yeni bir çalışma sayfası oluşturmak için soldaki formu doldurun.</p>
                    </div>
                )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;