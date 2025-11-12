import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { QuestionForm } from './components/QuestionForm';
import { QuestionDisplay } from './components/QuestionDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateQuestions } from './services/geminiService';
import type { Question, QuestionGenerationParams } from './types';

// --- Hakkında Penceresi Bileşeni ---
interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">Uygulama Hakkında</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="mt-4 space-y-4 text-gray-700 max-h-[70vh] overflow-y-auto pr-2">
          <p>
            Bu uygulama, Türkiye Millî Eğitim Bakanlığı (MEB) müfredatına hakim, deneyimli bir ortaokul Türkçe öğretmeni ve ölçme-değerlendirme uzmanı gibi davranan bir yapay zeka modeli kullanarak, 4., 5., 6., 7. ve 8. sınıflar için nitelikli Türkçe soruları üretmek amacıyla tasarlanmıştır.
          </p>
          <h3 className="text-lg font-semibold text-gray-800 pt-2">Pedagojik İlkeler</h3>
          <p>
            Üretilen her soru, aşağıdaki pedagojik derinlik unsurlarını içermeyi hedefler:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Müfredat Uyumu:</strong> Tüm sorular, seçilen sınıf, ünite ve kazanıma %100 uyumlu olarak oluşturulur.</li>
            <li><strong>Özgünlük:</strong> Paragraflar, soru kökleri ve seçenekler tamamen özgündür.</li>
            <li><strong>Nitelikli Çeldiriciler:</strong> Çoktan seçmeli sorularda, yanlış seçenekler (çeldiriciler) öğrencilerin sık yaptığı hatalara dayalı olarak mantıklı ve güçlü bir şekilde tasarlanır.</li>
            <li><strong>Gerçek Yaşam Bağlantısı:</strong> Her soruda, ilgili kazanımın günlük hayattaki önemini veya kullanımını açıklayan bir bölüm bulunur.</li>
            <li><strong>Zorluk Seviyesi:</strong> Sorular, Bloom taksonomisine uygun olarak 'temel', 'orta' ve 'ileri' düzeylerde sınıflandırılır.</li>
            <li><strong>Çözüm Anahtarı:</strong> Her sorunun çözüm yolu, bir öğretmenin konuyu özetleyebileceği netlikte açıklanır.</li>
          </ul>
           <h3 className="text-lg font-semibold text-gray-800 pt-2">Soru Tipleri</h3>
           <p>Uygulama, müfredat kazanımlarına uygun olarak üç farklı tipte soru üretebilir: Çoktan Seçmeli, Doğru/Yanlış ve Boşluk Doldurma.</p>
        </div>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};
// --- Hakkında Penceresi Bitişi ---

const App: React.FC = () => {
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header onShowAbout={() => setIsAboutModalOpen(true)} />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 no-print">
            <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-4">Soru Kriterleri</h2>
            <QuestionForm onGenerate={handleGenerateQuestion} isLoading={isLoading} />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-4">Oluşturulan Soru(lar)</h2>
            <div className="flex-grow flex items-center justify-center">
              {isLoading && <LoadingSpinner />}
              {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg w-full text-center">{error}</div>}
              {generatedQuestions && generatedQuestions.length > 0 && <QuestionDisplay questions={generatedQuestions} />}
              {!isLoading && !error && (!generatedQuestions || generatedQuestions.length === 0) && (
                <div className="text-center text-gray-500">
                  <i className="fas fa-file-alt fa-3x mb-4"></i>
                  <p>Soru oluşturmak için soldaki formu doldurun.</p>
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