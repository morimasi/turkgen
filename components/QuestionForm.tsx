import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MEB_CURRICULUM } from '../constants';
import type { QuestionGenerationParams, QuestionType, Difficulty, Unit, Objective } from '../types';

interface QuestionFormProps {
  onGenerate: (params: QuestionGenerationParams) => void;
  isLoading: boolean;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const QuestionForm: React.FC<QuestionFormProps> = ({ onGenerate, isLoading }) => {
  const [grade, setGrade] = useState<string>('5');
  const [selectedUnitNos, setSelectedUnitNos] = useState<string[]>([]);
  const [selectedObjectiveCodes, setSelectedObjectiveCodes] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState<QuestionType>('coktan_secmeli');
  const [difficulty, setDifficulty] = useState<Difficulty>('orta');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customInstructions, setCustomInstructions] = useState<string>('');

  const availableUnits = useMemo(() => MEB_CURRICULUM[grade]?.units || [], [grade]);
  
  const derivedObjectives = useMemo(() => {
    return availableUnits
      .filter(u => selectedUnitNos.includes(u.no.toString()))
      .flatMap(u => u.objectives);
  }, [availableUnits, selectedUnitNos]);

  useEffect(() => {
    if (availableUnits.length > 0) {
      setSelectedUnitNos([availableUnits[0].no.toString()]);
    } else {
      setSelectedUnitNos([]);
    }
  }, [availableUnits]);
  
  useEffect(() => {
     setSelectedObjectiveCodes([]);
  }, [selectedUnitNos]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUnits = availableUnits.filter(u => selectedUnitNos.includes(u.no.toString()));
    const selectedObjectives = derivedObjectives.filter(o => selectedObjectiveCodes.includes(o.code));

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
  
  const handleUnitSelection = (unitNo: string) => {
    setSelectedUnitNos(prev => 
        prev.includes(unitNo) 
            ? prev.filter(no => no !== unitNo) 
            : [...prev, unitNo]
    );
  };
  
  const handleObjectiveSelection = (objCode: string) => {
    setSelectedObjectiveCodes(prev => 
        prev.includes(objCode) 
            ? prev.filter(code => code !== objCode) 
            : [...prev, objCode]
    );
  };

  const handleSelectAllObjectives = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedObjectiveCodes(derivedObjectives.map(o => o.code));
      } else {
          setSelectedObjectiveCodes([]);
      }
  };
  
  const CheckboxList = ({ title, items, selectedItems, onSelectItem, onSelectAll }: {
      title: string;
      items: { id: string; label: string; }[];
      selectedItems: string[];
      onSelectItem: (id: string) => void;
      onSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
      <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
          <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto p-2 bg-white">
              {onSelectAll && items.length > 0 && (
                  <div className="flex items-center p-2 border-b">
                      <input
                          type="checkbox"
                          id={`select-all-${title}`}
                          checked={selectedItems.length === items.length}
                          onChange={onSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`select-all-${title}`} className="ml-2 block text-sm font-semibold text-gray-800">
                          Tümünü Seç
                      </label>
                  </div>
              )}
              {items.length === 0 && <p className="text-xs text-gray-500 p-2">Seçim yapınız.</p>}
              {items.map(item => (
                  <div key={item.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                      <input
                          type="checkbox"
                          id={item.id}
                          value={item.id}
                          checked={selectedItems.includes(item.id)}
                          onChange={() => onSelectItem(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={item.id} className="ml-2 block text-sm text-gray-700">
                          {item.label}
                      </label>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
          <label htmlFor="grade-select" className="block text-sm font-medium text-gray-700 mb-1">Sınıf</label>
          <select
              id="grade-select"
              value={grade}
              onChange={e => setGrade(e.target.value)}
              disabled={isLoading}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
          >
              {Object.keys(MEB_CURRICULUM).map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
          </select>
      </div>

      <CheckboxList 
          title="Üniteler"
          items={availableUnits.map(u => ({ id: u.no.toString(), label: u.name }))}
          selectedItems={selectedUnitNos}
          onSelectItem={handleUnitSelection}
      />
      
      <CheckboxList 
          title="Kazanımlar"
          items={derivedObjectives.map(o => ({ id: o.code, label: `${o.code} - ${o.text}` }))}
          selectedItems={selectedObjectiveCodes}
          onSelectItem={handleObjectiveSelection}
          onSelectAll={handleSelectAllObjectives}
      />

      <div className="mb-3">
          <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-1">Soru Tipi</label>
          <select
              id="type-select"
              value={questionType}
              onChange={e => setQuestionType(e.target.value as QuestionType)}
              disabled={isLoading}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
          >
              <option value="coktan_secmeli">Çoktan Seçmeli</option>
              <option value="dogru_yanlis">Doğru / Yanlış</option>
              <option value="bosluk_doldurma">Boşluk Doldurma</option>
          </select>
      </div>
      <div className="mb-3">
          <label htmlFor="difficulty-select" className="block text-sm font-medium text-gray-700 mb-1">Zorluk Seviyesi</label>
          <select
              id="difficulty-select"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as Difficulty)}
              disabled={isLoading}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
          >
              <option value="temel">Temel</option>
              <option value="orta">Orta</option>
              <option value="ileri">İleri</option>
          </select>
      </div>
      
      <div className="mb-3">
          <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 mb-1">Soru Sayısı</label>
          <input 
              type="number"
              id="question-count"
              value={questionCount}
              onChange={e => setQuestionCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10)) || 1))}
              min="1"
              max="50"
              disabled={isLoading}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
          />
      </div>

      <div className="mt-3">
        <label htmlFor="custom-instructions" className="block text-sm font-medium text-gray-700 mb-1">Ek Talimatlar (İsteğe Bağlı)</label>
        <textarea
          id="custom-instructions"
          rows={2}
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          disabled={isLoading}
          placeholder="Örn: Paragraf bir fabl olsun."
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
        ></textarea>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button 
          type="submit" 
          disabled={isLoading || selectedObjectiveCodes.length === 0}
          className="w-full flex-grow flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Oluşturuluyor...
            </>
          ) : (
            <><i className="fas fa-magic mr-2"></i>Soru Oluştur</>
          )}
        </button>
        <button
          type="button"
          disabled={true}
          title="Sesli komut özelliği çoklu seçim ile uyumlu değildir."
          className={`w-full sm:w-auto px-4 py-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
            bg-gray-300 cursor-not-allowed`}
        >
          <i className="fas fa-microphone-slash"></i>
        </button>
      </div>

    </form>
  );
};