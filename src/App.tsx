import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { QuestionForm } from './components/QuestionForm';
import { QuestionDisplay } from './components/QuestionDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateQuestions } from './services/geminiService';
import type { Question, QuestionGenerationParams, Theme, NotificationData } from './types';
import { AboutModal } from './components/AboutModal';
import { ArchiveModal } from './components/ArchiveModal';
import { Notification } from './components/Notification';


const App: React.FC = () => {
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [font, setFont] = useState<'Inter' | 'Atkinson Hyperlegible'>('Inter');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('turkGenTheme') as Theme) || 'coffee');

  useEffect(() => {
    const root = document.documentElement;
    root.className = `theme-${theme}`;
    localStorage.setItem('turkGenTheme', theme);
  }, [theme]);

  useEffect(() => {
    const newClass = font === 'Atkinson Hyperlegible' ? 'font-atkinson-hyperlegible' : 'font-inter';
    const oldClass = font === 'Atkinson Hyperlegible' ? 'font-inter' : 'font-atkinson-hyperlegible';
    document.body.classList.remove(oldClass);
    document.body.classList.add(newClass);
  }, [font]);

  const handleGenerateQuestion = useCallback(async (params: QuestionGenerationParams) => {
    setIsLoading(true);
    setError(null);
    setGeneratedQuestions([]);
    let questionCounter = 0;

    try {
      await generateQuestions(
        params,
        (question: Question) => {
          // Callback is called for each question from the stream
          setGeneratedQuestions((prev) => [...prev, question]);
          questionCounter++;
        }
      );
      // After stream is finished
      if (questionCounter > 0) {
        setNotification({ message: `${questionCounter} adet soru başarıyla oluşturuldu!`, type: 'success' });
      } else {
        // This case can happen if all generations fail on the backend
        const errorMessage = "Hiç soru üretilemedi. Lütfen kriterlerinizi gözden geçirin veya tekrar deneyin.";
        setError(errorMessage);
        setNotification({ message: errorMessage, type: 'error' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setError(errorMessage);
      setNotification({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadExamFromArchive = (questions: Question[], examName: string) => {
      setGeneratedQuestions(questions);
      setError(null);
      setIsLoading(false);
      setNotification({ message: `"${examName}" adlı sınav başarıyla yüklendi.`, type: 'success' });
  };

  const toggleFont = () => {
    setFont(prevFont => (prevFont === 'Inter' ? 'Atkinson Hyperlegible' : 'Inter'));
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header
        onShowAbout={() => setIsAboutModalOpen(true)}
        onShowArchive={() => setIsArchiveModalOpen(true)}
        fontFamily={font}
        onToggleFont={toggleFont}
        theme={theme}
        setTheme={setTheme}
      />
      <Notification notification={notification} onClose={() => setNotification(null)} />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onLoadExam={handleLoadExamFromArchive}
      />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Soru Kriterleri Formu - Sol Panel */}
            <div 
                className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-md border border-border no-print animate-fade-in-slide-up"
                style={{ animationDelay: '100ms' }}
            >
                <h2 className="text-2xl font-bold text-text-primary mb-6 border-b border-border pb-4">Soru Kriterleri</h2>
                <QuestionForm onGenerate={handleGenerateQuestion} isLoading={isLoading} />
            </div>
            
            {/* Çalışma Sayfası (Soru Görüntüleme) - Sağ Panel */}
            <div 
                className="lg:col-span-3 bg-worksheet-surface p-6 rounded-xl shadow-md border border-border flex flex-col animate-fade-in-slide-up"
                style={{ animationDelay: '200ms' }}
            >
                <h2 className="text-2xl font-bold text-text-primary mb-6 border-b border-border pb-4">Çalışma Sayfası</h2>
                <div className="flex-grow flex items-center justify-center">
                {isLoading && generatedQuestions.length === 0 && <LoadingSpinner />}
                {error && <div className="text-danger-900 bg-danger-50 p-4 rounded-lg w-full text-center">{error}</div>}
                {generatedQuestions.length > 0 && (
                    <QuestionDisplay 
                        questions={generatedQuestions} 
                        setNotification={setNotification}
                    />
                )}
                {!isLoading && !error && generatedQuestions.length === 0 && (
                    <div className="text-center text-text-secondary">
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
