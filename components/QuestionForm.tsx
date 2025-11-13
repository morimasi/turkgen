import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MEB_CURRICULUM } from '../constants';
import type { QuestionGenerationParams, QuestionType, Difficulty, Unit } from '../types';

interface QuestionFormProps {
  onGenerate: (params: QuestionGenerationParams) => void;
  isLoading: boolean;
}

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => (
    <details className="border border-border rounded-lg mb-4 group rotate-90-on-open overflow-visible" open={defaultOpen}>
        <summary className="flex items-center justify-between p-3 cursor-pointer bg-surface hover:bg-worksheet-surface transition-colors">
            <h3 className="font-semibold text-text-primary">{title}</h3>
            <svg className="w-5 h-5 text-text-secondary transform transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
        </summary>
        <div className="content-wrapper">
             <div className="p-4 bg-surface">
                {children}
            </div>
        </div>
    </details>
);

const CurriculumSelector: React.FC<{
    units: Unit[];
    selectedUnitNos: string[];
    selectedObjectiveCodes: string[];
    onUnitToggle: (unitNo: string) => void;
    onObjectiveToggle: (objCode: string) => void;
    onSelectAllUnits: (select: boolean) => void;
}> = ({ units, selectedUnitNos, selectedObjectiveCodes, onUnitToggle, onObjectiveToggle, onSelectAllUnits }) => {

    const [activeUnitNo, setActiveUnitNo] = useState<string | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const activeUnit = useMemo(() => {
        if (!activeUnitNo) return null;
        return units.find(u => u.no.toString() === activeUnitNo);
    }, [activeUnitNo, units]);

    const handleMouseEnterUnit = (unitNo: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveUnitNo(unitNo);
    };

    const handleMouseLeaveContainer = () => {
        timeoutRef.current = window.setTimeout(() => {
            setActiveUnitNo(null);
        }, 300);
    };

    const handlePanelMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleSelectAllObjectivesForUnit = (unit: Unit, select: boolean) => {
        unit.objectives.forEach(obj => {
            const isSelected = selectedObjectiveCodes.includes(obj.code);
            if (select && !isSelected) {
                onObjectiveToggle(obj.code);
            } else if (!select && isSelected) {
                onObjectiveToggle(obj.code);
            }
        });
    };

    return (
        <div className="relative" onMouseLeave={handleMouseLeaveContainer}>
            <div className="border border-border rounded-lg max-h-80 overflow-y-auto bg-surface">
                <div className="sticky top-0 bg-surface border-b border-border p-2 z-10">
                     <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="select-all-units"
                            checked={units.length > 0 && selectedUnitNos.length === units.length}
                            onChange={(e) => onSelectAllUnits(e.target.checked)}
                            className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="select-all-units" className="ml-2 block text-sm font-semibold text-text-primary">
                            Tüm Üniteleri Seç
                        </label>
                    </div>
                </div>
                {units.map(unit => {
                    const isUnitSelected = selectedUnitNos.includes(unit.no.toString());
                    
                    return (
                        <div 
                            key={unit.no} 
                            className="flex items-center p-2 border-b border-border last:border-b-0 hover:bg-worksheet-surface cursor-pointer"
                            onMouseEnter={() => handleMouseEnterUnit(unit.no.toString())}
                        >
                             <input
                                type="checkbox"
                                id={`unit-${unit.no}`}
                                checked={isUnitSelected}
                                onChange={() => onUnitToggle(unit.no.toString())}
                                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor={`unit-${unit.no}`} className="ml-2 flex-grow text-sm font-medium text-text-primary">{unit.name}</label>
                            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    );
                })}
            </div>
            
            {activeUnit && (
                 <div
                    className="absolute top-0 left-full ml-2 w-96 z-20 transition-opacity duration-200 animate-fade-in"
                    style={{ minHeight: '100%' }}
                    onMouseEnter={handlePanelMouseEnter}
                >
                    <div className="bg-surface border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
                        <div className="sticky top-0 bg-worksheet-surface border-b border-border p-2">
                            <h4 className="font-semibold text-text-primary text-sm truncate mb-2">{activeUnit.name}</h4>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`select-all-obj-${activeUnit.no}`}
                                    checked={activeUnit.objectives.length > 0 && activeUnit.objectives.every(obj => selectedObjectiveCodes.includes(obj.code))}
                                    onChange={(e) => handleSelectAllObjectivesForUnit(activeUnit, e.target.checked)}
                                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor={`select-all-obj-${activeUnit.no}`} className="ml-2 block text-xs font-semibold text-text-secondary">
                                    Tüm Kazanımları Seç
                                </label>
                            </div>
                        </div>
                        <div className="p-2">
                             {activeUnit.objectives.map(obj => (
                                <div key={obj.code} className="flex items-start p-1.5 rounded-md hover:bg-worksheet-surface">
                                    <input
                                        type="checkbox"
                                        id={obj.code}
                                        value={obj.code}
                                        checked={selectedObjectiveCodes.includes(obj.code)}
                                        onChange={() => onObjectiveToggle(obj.code)}
                                        className="h-4 w-4 mt-1 rounded border-border text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor={obj.code} className="ml-2 block text-sm text-text-secondary">
                                        {obj.code} - {obj.text}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const QuestionForm: React.FC<QuestionFormProps> = ({ onGenerate, isLoading }) => {
  const [grade, setGrade] = useState<string>('5');
  const [selectedUnitNos, setSelectedUnitNos] = useState<string[]>([]);
  const [selectedObjectiveCodes, setSelectedObjectiveCodes] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState<QuestionType>('coktan_secmeli');
  const [difficulty, setDifficulty] = useState<Difficulty>('orta');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customInstructions, setCustomInstructions] = useState<string>('');

  const availableUnits = useMemo(() => MEB_CURRICULUM[grade]?.units || [], [grade]);
  
  // Sınıf değiştiğinde seçimleri sıfırla
  useEffect(() => {
    setSelectedUnitNos([]);
    setSelectedObjectiveCodes([]);
  }, [grade]);
  
  // Ünite seçimi değiştiğinde, seçili olmayan ünitelerin kazanımlarını da temizle
  useEffect(() => {
     const allowedObjectiveCodes = availableUnits
        .filter(u => selectedUnitNos.includes(u.no.toString()))
        .flatMap(u => u.objectives.map(o => o.code));
     setSelectedObjectiveCodes(prev => prev.filter(code => allowedObjectiveCodes.includes(code)));
  }, [selectedUnitNos, availableUnits]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUnits = availableUnits.filter(u => selectedUnitNos.includes(u.no.toString()));
    const selectedObjectives = availableUnits
        .flatMap(u => u.objectives)
        .filter(o => selectedObjectiveCodes.includes(o.code));

    if (selectedUnits.length > 0 && selectedObjectives.length > 0) {
      onGenerate({
        grade: parseInt(grade),
        units: selectedUnits.map(u => ({ no: u.no, name: u.name })),
        objectives: selectedObjectives.map(o => ({ code: o.code, text: o.text })),
        questionType,
        difficulty,
        questionCount,
        customInstructions,
      });
    } else {
        alert("Lütfen en az bir ünite ve bir kazanım seçin.");
    }
  };
  
  const handleUnitToggle = (unitNo: string) => {
    setSelectedUnitNos(prev => 
        prev.includes(unitNo) 
            ? prev.filter(no => no !== unitNo) 
            : [...prev, unitNo]
    );
  };
  
  const handleObjectiveToggle = (objCode: string) => {
    // Tıklanan kazanımın ait olduğu üniteyi bul.
    const parentUnit = availableUnits.find(unit => 
        unit.objectives.some(obj => obj.code === objCode)
    );

    // Kazanımın mevcut seçim durumunu kontrol et.
    const isCurrentlySelected = selectedObjectiveCodes.includes(objCode);

    // Kazanım seçim durumunu güncelle (kaldır veya ekle).
    setSelectedObjectiveCodes(prev => 
        isCurrentlySelected 
            ? prev.filter(code => code !== objCode) 
            : [...prev, objCode]
    );

    // Eğer kazanım YENİ SEÇİLDİYSE ve ait olduğu ünite zaten seçili değilse, üniteyi de seç.
    if (!isCurrentlySelected && parentUnit) {
        setSelectedUnitNos(prev => {
            const parentUnitNo = parentUnit.no.toString();
            if (!prev.includes(parentUnitNo)) {
                return [...prev, parentUnitNo];
            }
            return prev; // Ünite zaten seçiliyse bir şey yapma
        });
    }
  };
  
  const handleSelectAllUnits = (select: boolean) => {
      setSelectedUnitNos(select ? availableUnits.map(u => u.no.toString()) : []);
      // Bütün üniteler seçilince, bütün kazanımları da seç
      if(select){
          const allObjectiveCodes = availableUnits.flatMap(u => u.objectives.map(o => o.code));
          setSelectedObjectiveCodes(allObjectiveCodes);
      } else {
          setSelectedObjectiveCodes([]);
      }
  };

  return (
    <form onSubmit={handleSubmit}>
       <AccordionSection title="1. Sınıf ve Ünite Seçimi" defaultOpen={true}>
         <div className="mb-4">
            <label htmlFor="grade-select" className="block text-sm font-medium text-text-secondary mb-1">Sınıf</label>
            <select
                id="grade-select"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                disabled={isLoading}
                className="block w-full px-3 py-2 bg-surface border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-background"
            >
                {Object.keys(MEB_CURRICULUM).map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
            </select>
        </div>
         <label className="block text-sm font-medium text-text-secondary mb-2">Üniteler ve Kazanımlar</label>
         <CurriculumSelector
            units={availableUnits}
            selectedUnitNos={selectedUnitNos}
            selectedObjectiveCodes={selectedObjectiveCodes}
            onUnitToggle={handleUnitToggle}
            onObjectiveToggle={handleObjectiveToggle}
            onSelectAllUnits={handleSelectAllUnits}
         />
       </AccordionSection>
       
       <AccordionSection title="2. Soru Ayarları">
           <div className="grid grid-cols-2 gap-4">
              <div>
                  <label htmlFor="type-select" className="block text-sm font-medium text-text-secondary mb-1">Soru Tipi</label>
                  <select
                      id="type-select"
                      value={questionType}
                      onChange={e => setQuestionType(e.target.value as QuestionType)}
                      disabled={isLoading}
                      className="block w-full px-3 py-2 bg-surface border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-background"
                  >
                      <option value="coktan_secmeli">Çoktan Seçmeli</option>
                      <option value="dogru_yanlis">Doğru / Yanlış</option>
                      <option value="bosluk_doldurma">Boşluk Doldurma</option>
                  </select>
              </div>
              <div>
                  <label htmlFor="difficulty-select" className="block text-sm font-medium text-text-secondary mb-1">Zorluk Seviyesi</label>
                  <select
                      id="difficulty-select"
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as Difficulty)}
                      disabled={isLoading}
                      className="block w-full px-3 py-2 bg-surface border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-background"
                  >
                      <option value="temel">Temel</option>
                      <option value="orta">Orta</option>
                      <option value="ileri">İleri</option>
                  </select>
              </div>
           </div>
            <div className="mt-4">
              <label htmlFor="question-count" className="block text-sm font-medium text-text-secondary mb-1">Soru Sayısı</label>
              <input 
                  type="number"
                  id="question-count"
                  value={questionCount}
                  onChange={e => setQuestionCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10)) || 1))}
                  min="1"
                  max="50"
                  disabled={isLoading}
                  className="block w-full px-3 py-2 bg-surface border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-background"
              />
          </div>
       </AccordionSection>
       
       <AccordionSection title="3. Ek Talimatlar (İsteğe Bağlı)">
         <textarea
          id="custom-instructions"
          rows={2}
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          disabled={isLoading}
          placeholder="Örn: Paragraf bir fabl olsun."
          className="block w-full px-3 py-2 bg-surface border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-background"
        ></textarea>
       </AccordionSection>
      
      <div className="mt-6">
        <button 
          type="submit" 
          disabled={isLoading || selectedObjectiveCodes.length === 0}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-on-primary bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-600/30"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Oluşturuluyor...
            </>
          ) : (
            <><i className="fas fa-magic mr-2"></i>Soru Oluştur</>
          )}
        </button>
      </div>

    </form>
  );
};