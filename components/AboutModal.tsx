import React from 'react';

// --- Hakkında Penceresi Bileşeni ---
interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl p-8 max-w-2xl w-full m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h2 className="text-2xl font-bold text-text-primary">Uygulama Hakkında</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl">&times;</button>
        </div>
        <div className="mt-4 space-y-4 text-text-secondary max-h-[70vh] overflow-y-auto pr-2">
          <p>
            Bu uygulama, Türkiye Millî Eğitim Bakanlığı (MEB) müfredatına hakim, deneyimli bir ortaokul Türkçe öğretmeni ve ölçme-değerlendirme uzmanı gibi davranan bir yapay zeka modeli kullanarak, 4., 5., 6., 7. ve 8. sınıflar için nitelikli Türkçe soruları üretmek amacıyla tasarlanmıştır.
          </p>
          <h3 className="text-lg font-semibold text-text-primary pt-2">Pedagojik İlkeler</h3>
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
           <h3 className="text-lg font-semibold text-text-primary pt-2">Soru Tipleri</h3>
           <p>Uygulama, müfredat kazanımlarına uygun olarak üç farklı tipte soru üretebilir: Çoktan Seçmeli, Doğru/Yanlış ve Boşluk Doldurma.</p>
        </div>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};
// --- Hakkında Penceresi Bitişi ---