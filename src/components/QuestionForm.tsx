import React, { useState, useMemo, useEffect } from 'react';
import { MEB_CURRICULUM } from '../constants';
import type { QuestionGenerationParams, QuestionType, Difficulty, Unit } from '../types';

interface QuestionFormProps {
  onGenerate: (params: QuestionGenerationParams) => void;
  isLoading: boolean;
}

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => (
    <details className="border border-border rounded-lg mb-4 group rotate-90-on-open" open={defaultOpen}>
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
        <div className="border border-border rounded-lg max-h-96 overflow-y-auto bg-surface">
            {/* "Tüm Üniteleri Seç" checkbox at the top */}
            <div className="sticky top-0 bg-surface border-b border-border p-3 z-10">
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

            {/* Accordion for each unit */}
            {units.map(unit => {
                const isUnitSelected = selectedUnitNos.includes(unit.no.toString());
                const areAllObjectivesInUnitSelected = unit.objectives.length > 0 && unit.objectives.every(obj => selectedObjectiveCodes.includes(obj.code));

                return (
                    <div key={unit.no} className="flex items-center border-b border-border last:border-b-0">
                        <div className="pl-3">
                            <input
                                type="checkbox"
                                id={`unit-${unit.no}`}
                                aria-labelledby={`unit-label-${unit.no}`}
                                checked={isUnitSelected}
                                onChange={() => onUnitToggle(unit.no.toString())}
                                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                        <details className="flex-grow group rotate-90-on-open">
                            <summary className="flex w-full items-center justify-between p-3 cursor-pointer hover:bg-worksheet-surface list-none">
                                <span id={`unit-label-${unit.no}`} className="text-sm font-medium text-text-primary">{unit.name}</span>
                                <svg className="w-5 h-5 text-text-secondary transform transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </summary>
                            
                            <div className="content-wrapper">
                               <div className="p-3 bg-background border-t border-border">
                                    {/* "Select All Objectives" for this specific unit */}
                                    <div className="flex items-center mb-3 p-2 bg-surface rounded-md border border-border">
                                        <input
                                            type="checkbox"
                                            id={`select-all-obj-${unit.no}`}
                                            checked={areAllObjectivesInUnitSelected}
                                            onChange={(e) => handleSelectAllObjectivesForUnit(unit, e.target.checked)}
                                            className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor={`select-all-obj-${unit.no}`} className="ml-2 block text-xs font-semibold text-text-secondary">
                                            Bu Ünitenin Tüm Kazanımlarını Seç
                                        </label>
                                    </div>

                                    {/* Objectives list */}
                                    <div className="space-y-1">
                                        {unit.objectives.map(obj => (
                                            <div key={obj.code} className="flex items-start p-1.5 rounded-md hover:bg-surface">
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
                        </details>
                    </div>
                );
            })}
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
    const isCurrentlySelected = selectedObjectiveCodes.includes(objCode);
    const newSelectedObjectiveCodes = isCurrentlySelected
        ? selectedObjectiveCodes.filter(c => c !== objCode)
        : [...selectedObjectiveCodes, objCode];
    
    setSelectedObjectiveCodes(newSelectedObjectiveCodes);

    const parentUnit = availableUnits.find(unit => 
        unit.objectives.some(obj => obj.code === objCode)
    );

    if (!parentUnit) return;

    const parentUnitNoStr = parentUnit.no.toString();

    if (isCurrentlySelected) {
        // Objective was deselected. Check if it's the last one in its unit.
        const hasOtherSelected = parentUnit.objectives.some(obj => newSelectedObjectiveCodes.includes(obj.code));
        if (!hasOtherSelected) {
            setSelectedUnitNos(prev => prev.filter(uNo => uNo !== parentUnitNoStr));
        }
    } else {
        // Objective was selected. Ensure its parent unit is selected.
        setSelectedUnitNos(prev => {
            if (!prev.includes(parentUnitNoStr)) {
                return [...prev, parentUnitNoStr];
            }
            return prev;
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
