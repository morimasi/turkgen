import React, { useState, useEffect } from 'react';
import type { Question, ArchivedExam } from '../types';

// --- Arşiv Penceresi Bileşeni ---
interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExam: (questions: Question[], examName: string) => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({ isOpen, onClose, onLoadExam }) => {
  const [archivedExams, setArchivedExams] = useState<ArchivedExam[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const archiveData = localStorage.getItem('turkGenSoruArsivi');
        const archive = archiveData ? JSON.parse(archiveData) : [];
        archive.sort((a: ArchivedExam, b: ArchivedExam) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setArchivedExams(archive);
      } catch (error) {
        console.error("Arşiv yüklenirken hata:", error);
        setArchivedExams([]);
      }
    }
  }, [isOpen]);

  const handleDelete = (examId: string) => {
    if (window.confirm("Bu sınavı arşivden silmek istediğinizden emin misiniz?")) {
      const updatedExams = archivedExams.filter(exam => exam.id !== examId);
      localStorage.setItem('turkGenSoruArsivi', JSON.stringify(updatedExams));
      setArchivedExams(updatedExams);
    }
  };

  const handleLoad = (exam: ArchivedExam) => {
    onLoadExam(exam.questions, exam.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl p-8 max-w-3xl w-full m-4 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Sınav Arşivim</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl">&times;</button>
        </div>
        <div className="flex-grow overflow-y-auto max-h-[70vh] pr-2">
          {archivedExams.length === 0 ? (
            <div className="text-center py-10 text-text-secondary">
              <i className="fas fa-archive fa-3x mb-4"></i>
              <p>Arşivinizde kayıtlı sınav bulunmuyor.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {archivedExams.map((exam) => (
                <li key={exam.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-border hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-semibold text-text-primary">{exam.name}</p>
                    <p className="text-sm text-text-secondary">
                      {new Date(exam.date).toLocaleString('tr-TR')} &bull; {exam.questions.length} soru
                    </p>
                  </div>
                  <div className="flex-shrink-0 space-x-2">
                    <button onClick={() => handleLoad(exam)} className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors">
                      <i className="fas fa-upload mr-1"></i> Yükle
                    </button>
                    <button onClick={() => handleDelete(exam.id)} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                      <i className="fas fa-trash-alt mr-1"></i> Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
         <div className="mt-6 text-right border-t border-border pt-4">
          <button onClick={onClose} className="bg-slate-600 text-white px-5 py-2 rounded-lg hover:bg-slate-700 transition-colors">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
// --- Arşiv Penceresi Bitişi ---