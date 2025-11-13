import React, { useState, useEffect, useMemo } from 'react';
import type { Question, ArchivedExam } from '../types';
import { MEB_CURRICULUM } from '../constants';
import { SAMPLE_EXAMS } from './sampleExams';

// --- Arşiv Penceresi Bileşeni ---
interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExam: (questions: Question[], examName: string) => void;
}

type GroupedExams = {
    [grade: string]: {
        [unitNo: string]: {
            [objectiveCode: string]: ArchivedExam[]
        }
    }
};

const ArchiveAccordion: React.FC<{
    groupedExams: GroupedExams;
    onLoad: (exam: ArchivedExam) => void;
    onDelete: (examId: string) => void;
}> = ({ groupedExams, onLoad, onDelete }) => {
    
    const sortedGrades = Object.keys(groupedExams).sort((a, b) => parseInt(a) - parseInt(b));

    if (sortedGrades.length === 0) {
        return (
            <div className="text-center py-10 text-text-secondary">
              <i className="fas fa-archive fa-3x mb-4"></i>
              <p>Arşivinizde kayıtlı sınav bulunmuyor.</p>
              <p className="text-sm mt-2">Örnek sınavları görmek için 5. sınıfı kontrol edebilirsiniz.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-2">
            {sortedGrades.map(grade => {
                const units = MEB_CURRICULUM[grade]?.units || [];
                const sortedUnitNos = Object.keys(groupedExams[grade]).sort((a,b) => parseInt(a) - parseInt(b));

                return (
                    <details key={grade} className="border border-border rounded-lg group overflow-hidden">
                        <summary className="flex items-center justify-between p-3 cursor-pointer bg-surface hover:bg-worksheet-surface transition-colors font-semibold text-text-primary">
                            {grade}. Sınıf
                            <i className="fas fa-chevron-right transition-transform duration-200 group-open:rotate-90"></i>
                        </summary>
                        <div className="bg-background p-2 space-y-2">
                            {sortedUnitNos.map(unitNo => {
                                const unit = units.find(u => u.no.toString() === unitNo);
                                const sortedObjectiveCodes = Object.keys(groupedExams[grade][unitNo]).sort();

                                return (
                                    <details key={unitNo} className="border border-border rounded-md group/unit overflow-hidden">
                                        <summary className="flex items-center justify-between p-2 cursor-pointer bg-surface hover:bg-worksheet-surface transition-colors text-sm font-medium text-text-primary">
                                            Ünite {unitNo}: {unit?.name || 'Bilinmeyen Ünite'}
                                            <i className="fas fa-chevron-right transition-transform duration-200 group-open/unit:rotate-90 text-xs"></i>
                                        </summary>
                                        <div className="bg-background p-2 space-y-2">
                                            {sortedObjectiveCodes.map(objCode => {
                                                const objective = unit?.objectives.find(o => o.code === objCode);
                                                const exams = groupedExams[grade][unitNo][objCode];
                                                
                                                return (
                                                    <div key={objCode} className="bg-surface rounded-md p-2 border border-border">
                                                        <p className="text-xs font-semibold text-text-secondary mb-2 p-1">{objective?.code} - {objective?.text || 'Bilinmeyen Kazanım'}</p>
                                                        <ul className="space-y-2">
                                                            {exams.map(exam => (
                                                                <li key={exam.id} className="flex items-center justify-between p-2 bg-worksheet-surface rounded-md border border-border hover:shadow-sm transition-shadow">
                                                                    <div className="flex items-center">
                                                                        {exam.isSample && <i className="fas fa-star text-yellow-400 text-xs mr-2" title="Örnek Sınav"></i>}
                                                                        <div>
                                                                            <p className="font-medium text-text-primary text-sm">{exam.name}</p>
                                                                            <p className="text-xs text-text-secondary">
                                                                                {new Date(exam.date).toLocaleDateString('tr-TR')} &bull; {exam.questions.length} soru
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-shrink-0 space-x-2">
                                                                        <button onClick={() => onLoad(exam)} className="px-2 py-1 text-xs font-medium text-on-primary bg-primary-600 rounded-md hover:bg-primary-700 transition-colors">
                                                                            <i className="fas fa-upload mr-1"></i> Yükle
                                                                        </button>
                                                                        {!exam.isSample && (
                                                                            <button onClick={() => onDelete(exam.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                                                                                <i className="fas fa-trash-alt mr-1"></i> Sil
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    </details>
                );
            })}
        </div>
    );
};


export const ArchiveModal: React.FC<ArchiveModalProps> = ({ isOpen, onClose, onLoadExam }) => {
  const [userExams, setUserExams] = useState<ArchivedExam[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const archiveData = localStorage.getItem('turkGenSoruArsivi');
        const archive = archiveData ? JSON.parse(archiveData) : [];
        setUserExams(archive);
      } catch (error) {
        console.error("Arşiv yüklenirken hata:", error);
        setUserExams([]);
      }
    }
  }, [isOpen]);

  const groupedExams = useMemo(() => {
    const allExams = [...SAMPLE_EXAMS, ...userExams];
    
    return allExams.reduce<GroupedExams>((acc, exam) => {
        const firstQuestion = exam.questions[0];
        if (!firstQuestion) return acc;

        const { sinif, unite_no, kazanim_kodu } = firstQuestion;
        const gradeStr = sinif.toString();
        const unitNoStr = unite_no.toString();

        if (!acc[gradeStr]) acc[gradeStr] = {};
        if (!acc[gradeStr][unitNoStr]) acc[gradeStr][unitNoStr] = {};
        if (!acc[gradeStr][unitNoStr][kazanim_kodu]) acc[gradeStr][unitNoStr][kazanim_kodu] = [];
        
        // Aynı ID'ye sahip sınavın tekrar eklenmesini önle (örnek ve kullanıcıda çakışma olursa)
        if (!acc[gradeStr][unitNoStr][kazanim_kodu].some(e => e.id === exam.id)) {
            acc[gradeStr][unitNoStr][kazanim_kodu].push(exam);
            // Sınavları tarihine göre sırala (en yeni üstte)
             acc[gradeStr][unitNoStr][kazanim_kodu].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        
        return acc;
    }, {});
  }, [userExams]);

  const handleDelete = (examId: string) => {
    if (window.confirm("Bu sınavı arşivden silmek istediğinizden emin misiniz?")) {
      const updatedExams = userExams.filter(exam => exam.id !== examId);
      localStorage.setItem('turkGenSoruArsivi', JSON.stringify(updatedExams));
      setUserExams(updatedExams);
    }
  };

  const handleLoad = (exam: ArchivedExam) => {
    onLoadExam(exam.questions, exam.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl p-6 max-w-4xl w-full m-4 flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Sınav Kütüphanesi</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl">&times;</button>
        </div>
        <div className="flex-grow overflow-y-auto max-h-[70vh] pr-2">
            <ArchiveAccordion groupedExams={groupedExams} onLoad={handleLoad} onDelete={handleDelete} />
        </div>
         <div className="mt-6 text-right border-t border-border pt-4">
          <button onClick={onClose} className="bg-text-secondary text-surface px-5 py-2 rounded-lg hover:opacity-80 transition-colors">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
// --- Arşiv Penceresi Bitişi ---